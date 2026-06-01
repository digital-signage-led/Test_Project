/**
 * 環境省 暑さ指数（WBGT）実況推定値 → WBGTサイネージ用JSONを返すGoogle Apps Script。
 *
 * 役割:
 *   ブラウザは環境省CSV（www.wbgt.env.go.jp）をCORS制限で直接取得できないため、
 *   このGASが中継して、サイネージ(index.html)が読めるJSONに変換して返す。
 *
 * データ元:
 *   環境省 暑さ指数(WBGT)実況推定値 est15WG
 *   https://www.wbgt.env.go.jp/est15WG/dl/wbgt_{地点}_{年月}.csv
 *
 * デプロイ手順:
 *   1. https://script.google.com で新規プロジェクトを作成
 *   2. このコードを Code.gs に貼り付けて保存
 *   3. 右上「デプロイ」→「新しいデプロイ」→種類「ウェブアプリ」
 *   4. 「次のユーザーとして実行」= 自分 /「アクセスできるユーザー」= 全員
 *   5. デプロイして表示される .../exec のURLをコピー
 *   6. サイネージURLに ?moeApi=<コピーしたURL> を付けるか、
 *      index.html の DEFAULT_MOE_GAS_URL を差し替える
 *
 * 動作確認:
 *   <exec URL>?point=62078          → WBGT実況推定値のJSON
 *   <exec URL>?type=alert&point=62078 → 熱中症警戒アラート（環境省公式発表）のJSON
 *   <exec URL>?type=rainwarn&area=270000&city=2710000 → 大雨警報（気象庁）のJSON
 *   いずれもブラウザで開いてJSONが返ればOK。
 */

var MOE_EST_URL = 'https://www.wbgt.env.go.jp/est15WG/dl/wbgt_{point}_{ym}.csv';

// 環境省 熱中症警戒アラート CSV（公式発表）。発表時刻 05/10/14/17時頃。
var MOE_ALERT_URL = 'https://www.wbgt.env.go.jp/alert/dl/{year}/alert_{ymd}_{hh}.csv';
var ALERT_HHS = ['17', '14', '10', '05'];

// 地点コード → 表示名（必要に応じて追加）
var POINT_NAMES = {
  '62078': '大阪',
  '44132': '東京'
};

// 地点コード → アラートCSVの府県予報区名（row[0]と照合）
var ALERT_AREA = {
  '62078': '大阪府',
  '44132': '東京地方'
};

// 環境省WBGTは1時間ごと更新。環境省サイトの注意事項「アクセス集中や動作遅延を避けるため
// 自動化ツールからの高頻度アクセスは控えて」を踏まえ、上流アクセスを抑えるため
// GAS側で30分キャッシュ（運用上の判断。具体的な秒数指定は資料の文言ではない）。
var CACHE_TTL_SEC = 1800;

function doGet(e) {
  var params = (e && e.parameter) ? e.parameter : {};
  var point = params.point ? String(params.point) : '62078';
  var callback = params.callback ? String(params.callback) : '';
  var type = params.type ? String(params.type).toLowerCase() : 'wbgt';

  var cacheKey = (type === 'alert' ? 'alert_' : (type === 'rainwarn' ? 'rainwarn_' : 'wbgt_')) + point;
  if (type === 'rainwarn') {
    cacheKey = 'rainwarn_' + (params.area || '270000') + '_' + (params.city || '2710000');
  }
  var json = getCached_(cacheKey);
  if (!json) {
    var payload;
    try {
      if (type === 'alert') payload = buildAlertPayload_(point);
      else if (type === 'rainwarn') payload = buildRainWarnPayload_(params.area || '270000', params.city || '2710000');
      else payload = buildWbgtPayload_(point);
    } catch (err) {
      payload = { source: 'error', point: point, error: String(err && err.message ? err.message : err) };
    }
    json = JSON.stringify(payload);
    // 正常応答はキャッシュ。エラー応答はキャッシュしない（次回すぐ再取得）
    if (payload && (payload.source === 'moe-env.go.jp' || payload.source === 'off-season' || payload.source === 'moe-alert' || payload.source === 'jma-rainwarn')) {
      putCached_(cacheKey, json);
    }
  }
  if (callback) {
    // JSONPフォールバック用
    return ContentService.createTextOutput(callback + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

// 最新値がこの時間(h)以上前なら「提供期間外」とみなす。
// 環境省WBGTは提供期間中は1時間ごと更新。停止期間(冬季など)は更新が止まる。
// 固定日付(4/22〜10/21)ではなく「データが新しいか」で判定するため、
// 毎年の提供期間の変更に自動追従する。
var OFFSEASON_AGE_HOURS = 24;

function buildWbgtPayload_(point) {
  var tz = 'Asia/Tokyo';
  var now = new Date();

  // 当月のCSVを取得。月初などで空なら前月を試す。
  var ym = Utilities.formatDate(now, tz, 'yyyyMM');
  var rows = fetchEstRows_(point, ym);
  if (!rows.length) {
    var prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    rows = fetchEstRows_(point, Utilities.formatDate(prev, tz, 'yyyyMM'));
  }

  // 当月・前月ともデータ無し → 提供期間外（停止期間）
  if (!rows.length) {
    return offSeasonPayload_(point, '');
  }

  var latest = rows[rows.length - 1];
  var latestMs = parseJstMs_(latest.date, latest.time);
  var ageHours = isFinite(latestMs) ? (now.getTime() - latestMs) / 3600000 : Infinity;

  // 最新値が古い（更新が止まっている）→ 提供期間外
  if (ageHours > OFFSEASON_AGE_HOURS) {
    return offSeasonPayload_(point, latest.date + ' ' + latest.time);
  }

  // 提供期間中。サイネージは4スロット必須（先頭=現在を表示）。最新値で4枠そろえる。
  var slots = [];
  for (var i = 0; i < 4; i++) {
    slots.push({
      wbgt: latest.wbgt,
      levelIdx: wbgtLevel_(latest.wbgt),
      hour: (i === 0) ? '現在' : latest.time
    });
  }

  return {
    source: 'moe-env.go.jp',
    point: String(point),
    pointName: POINT_NAMES[point] || String(point),
    updatedAt: latest.date + ' ' + latest.time,
    data: slots,
    slots: slots
  };
}

// 提供期間外（環境省がWBGTを出していない期間）。サイネージ側はWBGTを非表示にする。
function offSeasonPayload_(point, updatedAt) {
  return {
    source: 'off-season',
    inService: false,
    point: String(point),
    pointName: POINT_NAMES[point] || String(point),
    updatedAt: updatedAt || '',
    data: [],
    slots: []
  };
}

// "2026/5/30","10:00" (JST) → epoch ms
function parseJstMs_(dateStr, timeStr) {
  var d = String(dateStr || '').split('/');
  var t = String(timeStr || '').split(':');
  if (d.length < 3 || t.length < 2) return NaN;
  var iso = d[0] + '-' + ('0' + d[1]).slice(-2) + '-' + ('0' + d[2]).slice(-2) +
    'T' + ('0' + t[0]).slice(-2) + ':' + ('0' + t[1]).slice(-2) + ':00+09:00';
  return Date.parse(iso);
}

function fetchEstRows_(point, ym) {
  var url = MOE_EST_URL.replace('{point}', point).replace('{ym}', ym);
  var res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) return [];

  var text = res.getContentText('UTF-8');
  var lines = text.split(/\r?\n/);
  var out = [];
  // 1行目はヘッダー（Date,Time,<地点>）
  for (var i = 1; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line) continue;
    var cols = line.split(',');
    if (cols.length < 3) continue;
    var raw = (cols[2] || '').trim();
    if (raw === '' || /^[\/\-]+$/.test(raw)) continue;
    var v = parseFloat(raw);
    if (!isFinite(v) || v < 5 || v > 45) continue;
    out.push({
      date: (cols[0] || '').trim(),
      time: (cols[1] || '').trim(),
      wbgt: Math.round(v * 10) / 10
    });
  }
  return out;
}

function wbgtLevel_(w) {
  return w >= 31 ? 4 : w >= 28 ? 3 : w >= 25 ? 2 : w >= 21 ? 1 : 0;
}

function getCached_(key) {
  try {
    return CacheService.getScriptCache().get(key);
  } catch (e) {
    return null;
  }
}

function putCached_(key, json) {
  try {
    CacheService.getScriptCache().put(key, json, CACHE_TTL_SEC);
  } catch (e) {
    // キャッシュ不可でも本処理は続行
  }
}

/* ===== 熱中症警戒アラート（環境省公式CSVの発表をそのまま読む） ===== */
// row[6]=今日, row[7]=明日 の発表フラグ（1=警戒 / 2,3=特別警戒 / 0=なし）
function buildAlertPayload_(point) {
  var area = ALERT_AREA[point] || '大阪府';
  var tz = 'Asia/Tokyo';
  var now = new Date();
  for (var off = 0; off < 2; off++) {
    var day = new Date(now.getTime() - off * 86400000);
    var ymd = Utilities.formatDate(day, tz, 'yyyyMMdd');
    for (var i = 0; i < ALERT_HHS.length; i++) {
      var hh = ALERT_HHS[i];
      var url = MOE_ALERT_URL.replace('{year}', ymd.substring(0, 4)).replace('{ymd}', ymd).replace('{hh}', hh);
      var res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
      if (res.getResponseCode() !== 200) continue;
      var rows = Utilities.parseCsv(decodeJp_(res));
      for (var r = 0; r < rows.length; r++) {
        var row = rows[r];
        if (!row || row.length < 9) continue;
        if (String(row[0]).trim() !== area) continue;
        var td1 = String(row[6]).trim();
        var td2 = String(row[7]).trim();
        return {
          source: 'moe-alert',
          point: String(point),
          area: area,
          level: alertLevel_(td1, td2),
          today: { flag: td1, label: alertLabel_(td1) },
          tomorrow: { flag: td2, label: alertLabel_(td2) },
          reportFile: 'alert_' + ymd + '_' + hh + '.csv',
          updatedAt: ymd + ' ' + hh + ':00'
        };
      }
    }
  }
  // 該当発表が見つからない＝発表なし（オフシーズン/未発表）。誤発報を避け none。
  return {
    source: 'moe-alert', point: String(point), area: area, level: 'none',
    today: { flag: '0', label: '発表なし' }, tomorrow: { flag: '0', label: '発表なし' }
  };
}

function alertSeverity_(flag) {
  if (flag === '3' || flag === '2') return 2;  // 特別警戒
  if (flag === '1') return 1;                  // 警戒
  return 0;
}
function alertLevel_(td1, td2) {
  var s = Math.max(alertSeverity_(td1), alertSeverity_(td2));
  return s === 2 ? 'special' : (s === 1 ? 'warning' : 'none');
}
function alertLabel_(flag) {
  if (flag === '1') return '熱中症警戒アラート';
  if (flag === '2') return '熱中症特別警戒アラート（判定・注意喚起）';
  if (flag === '3') return '熱中症特別警戒アラート';
  return '発表なし';
}
// 環境省CSVは Shift_JIS のことがあるため、日本語が読める方の文字コードで取得
function decodeJp_(res) {
  var encs = ['Shift_JIS', 'UTF-8'];
  for (var i = 0; i < encs.length; i++) {
    try {
      var t = res.getContentText(encs[i]);
      if (t && /[\u3040-\u30ff\u4e00-\u9faf]/.test(t)) return t;
    } catch (e) { /* try next */ }
  }
  return res.getContentText();
}

/* ===== 大雨警報（気象庁 bosai JSON） ===== */
var WARN_AREA_BY_POINT = { '62078': '270000', '44132': '130000' };
var WARN_CITY_BY_POINT = { '62078': '2710000', '44132': '1310400' };

function buildRainWarnPayload_(areaCode, cityCode) {
  var warnUrl = 'https://www.jma.go.jp/bosai/warning/data/warning/' + areaCode + '.json';
  var probUrl = 'https://www.jma.go.jp/bosai/probability/data/probability/' + areaCode + '.json';
  var warnRes = UrlFetchApp.fetch(warnUrl, { muteHttpExceptions: true });
  var probRes = UrlFetchApp.fetch(probUrl, { muteHttpExceptions: true });
  var warnJson = warnRes.getResponseCode() === 200 ? JSON.parse(warnRes.getContentText('UTF-8')) : null;
  var probJson = probRes.getResponseCode() === 200 ? JSON.parse(probRes.getContentText('UTF-8')) : null;
  var parsed = parseJmaHeavyRainLevel_(warnJson, probJson, areaCode, cityCode);
  var l3Kinds = parseJmaActiveL3Kinds_(warnJson, cityCode, areaCode);
  return {
    source: 'jma-rainwarn',
    area: areaCode,
    city: cityCode,
    level: parsed.level,
    label: parsed.label,
    l3Kinds: l3Kinds,
    updatedAt: (warnJson && warnJson.reportDatetime) ? warnJson.reportDatetime : ''
  };
}

var JMA_L3_CODE_TO_KIND = { '02': 'wind', '03': 'rain', '04': 'flood', '09': 'surge' };
var JMA_L3_KIND_ORDER = ['rain', 'wind', 'flood', 'surge'];

function parseJmaActiveL3Kinds_(warnJson, cityCode, areaCode) {
  var found = {};
  var codes = [String(cityCode), String(areaCode)];
  if (warnJson && warnJson.areaTypes) {
    for (var ti = 0; ti < warnJson.areaTypes.length; ti++) {
      var areas = warnJson.areaTypes[ti].areas || [];
      for (var ai = 0; ai < areas.length; ai++) {
        if (codes.indexOf(String(areas[ai].code)) < 0) continue;
        var warnings = areas[ai].warnings || [];
        for (var wi = 0; wi < warnings.length; wi++) {
          var st = String(warnings[wi].status || '');
          if (!st || st.indexOf('解除') >= 0) continue;
          var kind = JMA_L3_CODE_TO_KIND[String(warnings[wi].code || '')];
          if (kind) found[kind] = true;
        }
      }
    }
  }
  var list = [];
  for (var ki = 0; ki < JMA_L3_KIND_ORDER.length; ki++) {
    if (found[JMA_L3_KIND_ORDER[ki]]) list.push(JMA_L3_KIND_ORDER[ki]);
  }
  return list.length ? list : ['rain'];
}

function parseJmaHeavyRainLevel_(warnJson, probJson, areaCode, cityCode) {
  var order = ['none', 'early', 'advisory', 'warning', 'danger', 'special'];
  var rank = { none: 0, early: 1, advisory: 2, warning: 3, danger: 4, special: 5 };
  var labels = {
    none: '発表なし',
    early: '早期注意情報',
    advisory: '大雨注意報',
    warning: '大雨警報',
    danger: '大雨危険警報',
    special: '大雨特別警報'
  };
  var best = 'none';
  var headline = warnJson && warnJson.headlineText ? String(warnJson.headlineText) : '';
  var dangerHeadline = headline.indexOf('大雨') >= 0 && headline.indexOf('危険警報') >= 0;
  var codes = [String(cityCode), String(areaCode)];

  function bump(level) {
    if (rank[level] > rank[best]) best = level;
  }

  if (warnJson && warnJson.areaTypes) {
    for (var ti = 0; ti < warnJson.areaTypes.length; ti++) {
      var areas = warnJson.areaTypes[ti].areas || [];
      for (var ai = 0; ai < areas.length; ai++) {
        if (codes.indexOf(String(areas[ai].code)) < 0) continue;
        var warnings = areas[ai].warnings || [];
        for (var wi = 0; wi < warnings.length; wi++) {
          var st = String(warnings[wi].status || '');
          if (!st || st.indexOf('解除') >= 0) continue;
          var c = String(warnings[wi].code || '');
          if (c === '33') bump('special');
          else if (c === '03') bump(dangerHeadline ? 'danger' : 'warning');
          else if (c === '02' || c === '04' || c === '09') bump('warning');
          else if (c === '10') bump('advisory');
        }
      }
    }
  }

  if (rank[best] === 0 && probJson && probJson.length) {
    for (var pi = 0; pi < probJson.length; pi++) {
      var series = probJson[pi].timeSeries || [];
      for (var si = 0; si < series.length; si++) {
        var pAreas = series[si].areas || [];
        for (var pai = 0; pai < pAreas.length; pai++) {
          if (String(pAreas[pai].code) !== String(areaCode)) continue;
          var props = pAreas[pai].properties || [];
          for (var pri = 0; pri < props.length; pri++) {
            var ptype = String(props[pri].type || '');
            if (ptype.indexOf('警報級') < 0 || ptype.indexOf('雨') < 0) continue;
            var cells = props[pri].timeCells || [];
            for (var ci = 0; ci < cells.length; ci++) {
              var locals = cells[ci].locals || [];
              for (var li = 0; li < locals.length; li++) {
                var cond = String(locals[li].condition || '');
                var val = Number(locals[li].value);
                if (cond.indexOf('高') >= 0 || val >= 50) bump('early');
                else if (cond.indexOf('中') >= 0 || val >= 30) bump('early');
              }
            }
          }
        }
      }
    }
  }

  return { level: best, label: labels[best] || labels.none };
}
