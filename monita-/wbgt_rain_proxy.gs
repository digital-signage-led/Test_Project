/**********************************************************************
 * WBGT / 大雨 サイネージ用 データ取得GAS（プロキシ）
 * HTML(bousai_monitor.html)のCONFIGに、デプロイ後のURLを貼るだけで動作。
 *
 * 返却JSON（HTML側が期待する形）:
 *   WBGT : { "wbgt":31.5, "temp":36.0, "humidity":72, "time":"15:00" }
 *   大雨 : { "level":3 }
 *
 * 呼び出し:
 *   ?type=wbgt&point=62078     （環境省 地点番号）
 *   ?type=rain&area=270000     （気象庁 エリアコード）
 *
 * 【安全ルール（絶対）】
 *   - 取得失敗・値が無い場合は wbgt/level を返さない → HTML側が「取得不可」表示
 *   - 推定値・前回値・固定値は絶対に返さない
 *   - 出典明記（気象庁・環境省）はHTML側で表示済み
 *   - キャッシュ15分（API ban回避 / 気象業務法の頻度配慮）
 *
 * 【本番前に必ず検証】
 *   WBGTの解析値が環境省公式サイトの同地点・同時刻と一致するか目視確認。
 *   1つでもズレたら本番投入しないこと（誤値は熱中症事故に直結）。
 **********************************************************************/

function doGet(e) {
  var p = (e && e.parameter) || {};
  var type = p.type || (p.area ? 'rain' : 'wbgt');
  var out;
  try {
    if (type === 'rain') {
      out = getRain(p.area);
    } else {
      out = getWBGT(p.point);
    }
  } catch (err) {
    out = {}; // 失敗時は空 → HTML側で「取得不可」
  }
  return ContentService
    .createTextOutput(JSON.stringify(out))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ===================== WBGT（環境省 予測値CSV） ===================== */
function getWBGT(point) {
  if (!point) return {};
  var cache = CacheService.getScriptCache();
  var key = 'wbgt_' + point;
  var hit = cache.get(key);
  if (hit) return JSON.parse(hit);

  // 確認済みエンドポイント（全地点予測値）。負荷軽減のため取得後に地点抽出。
  var url = 'https://www.wbgt.env.go.jp/prev15WG/dl/yohou_all.csv';
  var res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) return {};

  var lines = res.getContentText('UTF-8').split(/\r?\n/);
  if (lines.length < 4) return {};

  // 3行目(=index2)：対象時刻(YYYYMMDDHH)が3列目(index2)以降に並ぶ
  var times = lines[2].split(',').slice(2);
  // 4行目以降：地点ごとの行。3列目(index2)が地点番号、値は7列目(index6以降)
  var row = null;
  for (var i = 3; i < lines.length; i++) {
    var cols = lines[i].split(',');
    if (cols[2] === String(point)) { row = cols; break; }
  }
  if (!row) return {};
  var values = row.slice(6); // ←本番前に列位置を実データで要確認

  // 現在時刻に最も近い「過去側」の予測スロットを選ぶ
  var now = new Date();
  var nowKey = Utilities.formatDate(now, 'Asia/Tokyo', 'yyyyMMddHH');
  var idx = -1;
  for (var k = 0; k < times.length; k++) {
    var t = (times[k] || '').trim();
    if (t && t <= nowKey) idx = k; else break;
  }
  if (idx < 0) idx = 0;

  var raw = (values[idx] || '').trim();
  if (raw === '' || isNaN(parseFloat(raw))) return {}; // 値なし→取得不可
  var wbgt = parseFloat(raw) / 10;                      // ÷10ルール
  if (!isFinite(wbgt) || wbgt < 0 || wbgt > 50) return {}; // 異常値ガード

  var result = {
    wbgt: Math.round(wbgt * 10) / 10,
    time: Utilities.formatDate(now, 'Asia/Tokyo', 'HH:mm')
    // temp/humidity は環境省予測CSVに無いため省略 → HTML側は「−−」表示。
    // 気温/湿度も出す場合は、別途AMeDAS(地点コード別)を取得して追加すること。
  };
  cache.put(key, JSON.stringify(result), 900); // 15分キャッシュ
  return result;
}

/* ===================== 大雨（気象庁 警報JSON） ===================== */
/* 注意：警報コード→警戒レベルの対応は運用判断を含むため、
 *       貴社の検証済みロジックに合わせて mapLevel を確定してください。
 *       未検証のまま本番投入しないこと。 */
function getRain(area) {
  if (!area) return {};
  var cache = CacheService.getScriptCache();
  var key = 'rain_' + area;
  var hit = cache.get(key);
  if (hit) return JSON.parse(hit);

  var url = 'https://www.jma.go.jp/bosai/warning/data/warning/' + area + '.json';
  var res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) return {};

  var data = JSON.parse(res.getContentText('UTF-8'));
  var level = mapLevel(data);     // ←要検証
  if (!(level >= 1 && level <= 5)) return {};

  var result = { level: level };
  cache.put(key, JSON.stringify(result), 900);
  return result;
}

/* 警報JSONから大雨の警戒レベルを判定（要検証の雛形）。
 * 例：大雨特別警報→5 / 大雨警報→3 / 大雨注意報→2 / 早期注意情報→1
 * 実コードは bosai JSON の code・status を貴社ロジックで判定してください。 */
function mapLevel(data) {
  // TODO: 検証済みの判定に置換。未確定のうちは大雨モードは手動運用推奨。
  return 0;
}
