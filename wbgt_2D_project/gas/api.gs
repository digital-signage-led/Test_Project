/**
 * 防災モニタリング API（WBGT + 大雨 統合）
 * index.html の GAS_URL にデプロイURLを設定
 *
 * type=wbgt | rain | all（推奨）
 * point=環境省地点（6桁表示: 620780=大阪 → API 62078）
 * area=気象庁市町村等（例: 2710000=大阪府大阪市）
 */
function doGet(e) {
  var p = (e && e.parameter) || {};
  var callback = p.callback;
  var type = String(p.type || 'all').toLowerCase();
  var point = p.point || '620780';
  var area = p.area || '2710000';
  var data;

  if (type === 'wbgt') {
    try { data = fetchWbgt_(point); }
    catch (err) { data = { error: String(err) }; }
  } else if (type === 'rain') {
    try { data = fetchRainLevel_(area); }
    catch (err) { data = { error: String(err) }; }
  } else if (type === 'all') {
    data = {};
    try { data.wbgt = fetchWbgt_(point); }
    catch (err) { data.wbgt = { error: String(err) }; }
    try { data.rain = fetchRainLevel_(area); }
    catch (err) { data.rain = { error: String(err) }; }
  } else {
    data = { error: 'type must be wbgt, rain, or all' };
  }
  return output_(data, callback);
}

function fetchWbgt_(point) {
  var err = [];
  try { return fetchWbgtSurvey_(point); }
  catch (e1) { err.push(String(e1)); }
  try { return fetchWbgtCsv_(point); }
  catch (e2) { err.push('csv: ' + e2); }
  try { return fetchWbgtLegacy_(point); }
  catch (e3) { err.push('legacy: ' + e3); }
  throw new Error(err.join(' / '));
}

function wbgtApiNo_(point) {
  var n = parseInt(String(point).replace(/\D/g, ''), 10);
  if (!isFinite(n)) throw new Error('invalid point');
  if (n >= 100000) n = Math.floor(n / 10);
  if (n < 10000 || n > 99999) throw new Error('point must map to 5 digits');
  return n;
}

function surveyDateRange_() {
  var now = new Date();
  var fmt = 'yyyyMMddHHmmss';
  return {
    date_from: Utilities.formatDate(new Date(now.getTime() - 24 * 3600000), 'Asia/Tokyo', fmt),
    date_to: Utilities.formatDate(now, 'Asia/Tokyo', fmt)
  };
}

function fetchWbgtSurvey_(point) {
  var wbgtNo = wbgtApiNo_(point);
  var range = surveyDateRange_();
  var errMsg = '';

  // 環境省API: 0=実況推定 / 1=実況実測（地点によりどちらかのみの場合あり）
  for (var i = 0; i < 2; i++) {
    var dt = (i === 0) ? 1 : 0;
    try {
      var rows = fetchSurveyRows_(wbgtNo, range, dt);
      if (!rows.length) {
        errMsg = 'survey empty type' + dt;
        continue;
      }
      var parsed = parseSurveyRows_(rows);
      parsed.source = (dt === 1) ? 'measured' : 'estimate';
      return parsed;
    } catch (e) {
      errMsg = String(e);
    }
  }
  throw new Error(errMsg || 'survey no data');
}

function fetchSurveyRows_(wbgtNo, range, dataType) {
  var base = 'https://www.wbgt.env.go.jp/api/v1/getSurveyData';
  var q = [
    'data_type=' + dataType,
    'location_type=1',
    'wbgt_nos=' + wbgtNo,
    'date_from=' + range.date_from,
    'date_to=' + range.date_to
  ].join('&');

  var res = UrlFetchApp.fetch(base + '?' + q, {
    muteHttpExceptions: true,
    followRedirects: true
  });
  if (res.getResponseCode() !== 200) {
    res = UrlFetchApp.fetch(base, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        data_type: dataType,
        location_type: 1,
        wbgt_nos: [wbgtNo],
        date_from: range.date_from,
        date_to: range.date_to
      }),
      muteHttpExceptions: true,
      followRedirects: true
    });
  }
  if (res.getResponseCode() !== 200) {
    throw new Error('survey API ' + res.getResponseCode() + ' type' + dataType);
  }

  var raw = JSON.parse(res.getContentText('UTF-8'));
  if (raw.status && raw.status !== 'success') {
    throw new Error('survey ' + (raw.errMsg ? raw.errMsg.join(' ') : raw.status));
  }
  return raw.data || [];
}

function parseSurveyRows_(rows) {
  var latest = null;
  var latestTs = -1;
  for (var i = 0; i < rows.length; i++) {
    if (!isFinite(parseWbgtValue_(rows[i]))) continue;
    var ts = parseWbgtDateTs_(rows[i].wbgt_date);
    if (ts >= latestTs) {
      latestTs = ts;
      latest = rows[i];
    }
  }
  if (!latest) throw new Error('survey no valid row');

  var wbgt = parseWbgtValue_(latest);
  var temp = parseFloat(latest.wbgt_WO || latest.wbgt_Ta || latest.temp);
  var tw = parseFloat(latest.wbgt_Tw);
  var tg = parseFloat(latest.wbgt_Tg);
  if (!isFinite(temp) && isFinite(tw) && isFinite(tg)) temp = tg;

  if (!isFinite(wbgt)) throw new Error('survey invalid wbgt');

  return {
    temp: isFinite(temp) ? temp : null,
    humidity: estimateHumidity_(tw, temp),
    wbgt: wbgt,
    time: formatTime_(latest.wbgt_date || '')
  };
}

function parseWbgtDateTs_(s) {
  if (!s) return -1;
  var m = String(s).match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\s+(\d{1,2}):(\d{2})/);
  if (!m) return -1;
  return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], 0).getTime();
}

/** 環境省 実況推定値CSV（大阪などAPI空の地点のフォールバック） */
function fetchWbgtCsv_(point) {
  var wbgtNo = wbgtApiNo_(point);
  var now = new Date();
  var yymm = Utilities.formatDate(now, 'Asia/Tokyo', 'yyyyMM');
  var url = 'https://www.wbgt.env.go.jp/est15WG/dl/wbgt_' + wbgtNo + '_' + yymm + '.csv';
  var res = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true });
  if (res.getResponseCode() !== 200) throw new Error('HTTP ' + res.getResponseCode());

  var text = res.getContentText('UTF-8').replace(/^\uFEFF/, '');
  var lines = text.split(/\r?\n/);
  var latest = null;
  for (var i = lines.length - 1; i >= 1; i--) {
    var line = String(lines[i]).trim();
    if (!line) continue;
    var parts = line.split(',');
    if (parts.length < 3) continue;
    var val = parseFloat(parts[2]);
    if (!isFinite(val) || val <= 0) continue;
    latest = { date: parts[0], time: parts[1], wbgt: val };
    break;
  }
  if (!latest) throw new Error('no valid row');

  return {
    temp: null,
    humidity: null,
    wbgt: latest.wbgt,
    time: formatTimeCsv_(latest.time),
    source: 'estimate'
  };
}

function formatTimeCsv_(t) {
  if (!t) return '';
  var m = String(t).match(/(\d{1,2}):(\d{2})/);
  if (m) return ('0' + m[1]).slice(-2) + ':' + m[2];
  return String(t);
}

function parseWbgtValue_(row) {
  var direct = parseFloat(row.wbgt_WBGT || row.wbgt || row.WBGT);
  if (isFinite(direct) && direct >= 10) return direct;

  var tw = parseFloat(row.wbgt_Tw);
  var tg = parseFloat(row.wbgt_Tg);
  var ta = parseFloat(row.wbgt_WO || row.wbgt_Ta);
  if (isFinite(tw) && isFinite(tg) && isFinite(ta)) {
    return Math.round((0.7 * tw + 0.2 * tg + 0.1 * ta) * 10) / 10;
  }
  return NaN;
}

function estimateHumidity_(tw, ta) {
  if (!isFinite(tw) || !isFinite(ta) || ta <= tw) return null;
  var rh = 100 - (ta - tw) * 5;
  if (!isFinite(rh)) return null;
  return Math.max(0, Math.min(100, Math.round(rh)));
}

function fetchWbgtLegacy_(point) {
  var url = 'https://www.wbgt.env.go.jp/observ_json.php?id=' + encodeURIComponent(point);
  var res = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true });
  if (res.getResponseCode() !== 200) throw new Error('legacy ' + res.getResponseCode());

  var raw = JSON.parse(res.getContentText('UTF-8'));
  var row = null;
  if (raw.observ) {
    row = raw.observ[point] || raw.observ[String(point)];
    if (!row) {
      var keys = Object.keys(raw.observ);
      if (keys.length) row = raw.observ[keys[0]];
    }
  } else if (raw[point]) {
    row = raw[point];
  }
  if (!row) throw new Error('legacy no data');

  var wbgt = parseFloat(row.wbgt || row.WBGT || row.wbgt_index);
  if (!isFinite(wbgt)) throw new Error('legacy invalid wbgt');

  return {
    temp: parseFloat(row.temp || row.temperature || row.TEMP) || null,
    humidity: parseFloat(row.rh || row.humidity || row.RH) || null,
    wbgt: wbgt,
    time: formatTime_(row.time || row.datetime || row.TIME || '')
  };
}

/** 大雨レベル（気象庁 新形式 r8 → 旧形式の順） */
function fetchRainLevel_(areaCode) {
  try { return fetchRainLevelR8_(areaCode); }
  catch (e1) {
    try { return fetchRainLevelLegacy_(areaCode); }
    catch (e2) { throw new Error('rain: ' + e1 + ' / legacy: ' + e2); }
  }
}

/** 令和8年〜 https://www.jma.go.jp/bosai/warning/data/r8/{府県}0000.json */
function fetchRainLevelR8_(areaCode) {
  var code = String(areaCode);
  var pref = prefectureCodeFromArea_(code);
  var url = 'https://www.jma.go.jp/bosai/warning/data/r8/' + pref + '.json';
  var res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) throw new Error('jma r8 ' + res.getResponseCode());

  var list = JSON.parse(res.getContentText('UTF-8'));
  if (!list.length || !list[0].warning) throw new Error('jma r8 empty');

  var w = list[0].warning;
  var maxLevel = 1;

  var item20 = findAreaItem_(w.class20Items, code);
  if (item20) maxLevel = Math.max(maxLevel, kindsToRainLevel_(item20.kinds));

  if (maxLevel <= 1) {
    var class10 = class10FromArea_(code);
    var item10 = findAreaItem_(w.class10Items, class10);
    if (item10) maxLevel = Math.max(maxLevel, kindsToRainLevel_(item10.kinds));
  }

  return { level: maxLevel, updated: list[0].reportDatetime || '' };
}

function findAreaItem_(items, code) {
  if (!items) return null;
  for (var i = 0; i < items.length; i++) {
    if (String(items[i].areaCode) === String(code)) return items[i];
  }
  return null;
}

/** 市町村コード → 一次細分区域（いすみ 1223800 → 120030） */
function class10FromArea_(areaCode) {
  var s = String(areaCode);
  if (s.length >= 6) return s.substring(0, 2) + '0030';
  return s;
}

function kindsToRainLevel_(kinds) {
  if (!kinds || !kinds.length) return 1;
  var maxLevel = 1;
  for (var i = 0; i < kinds.length; i++) {
    var lv = kindToRainLevel_(kinds[i]);
    if (lv > 0) maxLevel = Math.max(maxLevel, lv);
  }
  return maxLevel;
}

function kindToRainLevel_(k) {
  if (!k) return 0;
  var st = String(k.status || '');
  if (st.indexOf('なし') >= 0) return 1;
  if (st.indexOf('解除') >= 0 && st.indexOf('継続') < 0) return 0;

  var blob = JSON.stringify(k);
  if (blob.indexOf('大雨特別') >= 0 || blob.indexOf('レベル５') >= 0 || blob.indexOf('レベル5') >= 0) return 5;
  if (blob.indexOf('大雨危険') >= 0 || blob.indexOf('レベル４') >= 0 || blob.indexOf('レベル4') >= 0) return 4;
  if (blob.indexOf('大雨警報') >= 0 && blob.indexOf('注意') < 0) return 3;
  if (blob.indexOf('大雨注意') >= 0) return 2;

  var c = String(k.code || '');
  if (!c) return 0;
  if (c === '33') return 5;
  if (c === '39' || c === '40' || c === '41' || c === '42') return 4;
  if (c === '03') return 3;
  if (c === '10') return 2;
  return 0;
}

function fetchRainLevelLegacy_(areaCode) {
  var code = String(areaCode);
  var pref = prefectureCodeFromArea_(code);
  var url = 'https://www.jma.go.jp/bosai/warning/data/warning/' + pref + '.json';
  var res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) throw new Error('jma legacy ' + res.getResponseCode());

  var data = JSON.parse(res.getContentText('UTF-8'));
  var maxLevel = 1;
  var areaTypes = data.areaTypes || [];

  for (var i = 0; i < areaTypes.length; i++) {
    var areas = areaTypes[i].areas || [];
    for (var j = 0; j < areas.length; j++) {
      var area = areas[j];
      if (!areaMatches_(area, code)) continue;
      var warnings = area.warnings || [];
      for (var k = 0; k < warnings.length; k++) {
        var lv = warningToLevelLegacy_(warnings[k]);
        if (lv > 0) maxLevel = Math.max(maxLevel, lv);
      }
    }
  }
  return { level: maxLevel, updated: data.reportDatetime || '' };
}
  var s = String(areaCode);
  if (s.length >= 2) return s.slice(0, 2) + '0000';
  return s;
}

function areaMatches_(area, areaCode) {
  if (!area) return false;
  if (String(area.code) === String(areaCode)) return true;
  return false;
}

function warningToLevelLegacy_(w) {
  if (!warningIsActive_(w)) return 0;
  return kindToRainLevel_({ code: w.code, status: w.status });
}

function warningIsActive_(w) {
  var st = String(w.status || w.Status || '');
  if (!st) return true;
  return st.indexOf('解除') < 0 && st.indexOf('なし') < 0;
}

function formatTime_(t) {
  if (!t) return '';
  var s = String(t);
  var m = s.match(/(\d{1,2}):(\d{2})/);
  if (m) return ('0' + m[1]).slice(-2) + ':' + m[2];
  return s;
}

/** JSON または JSONP（callback=関数名。file:// 表示時の取得失敗対策） */
function output_(obj, callback) {
  var text = JSON.stringify(obj);
  if (callback && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(String(callback))) {
    return ContentService.createTextOutput(String(callback) + '(' + text + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(text)
    .setMimeType(ContentService.MimeType.JSON);
}
