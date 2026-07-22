/**
 * WxTech プロキシ (320キューブ用) - 新規GAS
 * ------------------------------------------------------------
 * 既存のWBGT用GASとは別スクリプトとして作成すること。
 * 本番稼働中のWBGT用GASには一切手を加えない。
 *
 * 【デプロイ前に必ずやること】
 *   1. エディタ左「プロジェクトの設定」→「スクリプト プロパティ」に追加
 *        プロパティ名 : WXTECH_API_KEY
 *        値           : wxtech_trial_xxxxxxxxxxxx
 *      ※ コード内にキーを直書きしないこと。
 *         GitHub Pages は公開リポジトリなので HTML 側に置くと全世界に露出する。
 *
 *   2. デプロイ →「新しいデプロイ」→ 種類「ウェブアプリ」
 *        次のユーザーとして実行 : 自分
 *        アクセスできるユーザー   : 全員
 *
 *   3. 発行された /exec URL を HTML の SignageConfig.wxtech.gasUrl に設定
 *
 * 【トライアル制限】1日1,000回 / 秒間10回
 *   キャッシュ15分 = 1地点あたり96回/日 → 約10地点まで
 *   キャッシュ30分 = 1地点あたり48回/日 → 約20地点まで
 *   地点数が増えたら CACHE_SEC を伸ばすこと。
 *
 * 【呼び出し例】
 *   ?site=suminoe
 *   ?lat=34.605184&lon=135.470949&name=住之江区
 */

// ====== 設定 ======
var CACHE_SEC = 900;   // キャッシュ保持秒数 (900 = 15分)
var TIMEOUT_MS = 15000;

/**
 * APIキー（トライアル）
 * ※本来はスクリプトプロパティ WXTECH_API_KEY のみに置くのが安全。
 *   プロパティ設定が難しい場合の暫定。GitHub等の公開場所には上げないこと。
 *   HTML には絶対に書かないこと。
 */
var WXTECH_API_KEY_FALLBACK = 'wxtech_trial_2I6VFRNIUB5ZKKF4RVALGMAHAJ';

// 地点マスタ。現場が増えたらここに足すだけでよい。
// HTML から ?site=suminoe のように呼ぶ。
var SITES = {
  suminoe: { name: '大阪市住之江区', lat: 34.605184, lon: 135.470949 },
  shizuoka: { name: '静岡',         lat: 34.976944, lon: 138.383056 }
};

var API_BASE = 'https://wxtech.weathernews.com/api/v1/ss1wx';


function doGet(e) {
  var params = (e && e.parameter) ? e.parameter : {};
  var site = null;

  // site 指定があればマスタ優先。なければ lat/lon 直指定。どちらもなければ suminoe。
  // （旧: site未指定時に常に suminoe 固定 → HTML の lat/lon が無視される問題を修正）
  if (params.site) {
    site = SITES[params.site];
    if (!site) {
      return json_({ ok: false, reason: 'unknown_site' });
    }
  } else if (params.lat && params.lon) {
    site = {
      name: params.name || '',
      lat: Number(params.lat),
      lon: Number(params.lon)
    };
  } else {
    site = SITES.suminoe;
  }

  try {
    var data = fetchForecast_(site.lat, site.lon);
    data.siteName = site.name;
    return json_(data);
  } catch (err) {
    // ★安全ルール★ 取得に失敗したら ok:false のみを返す。
    // 前回値・推定値・気象庁からの代替値などは絶対に返さない。
    // 表示側は ok:false を受けたら「取得不可」だけを出す。
    return json_({ ok: false, reason: String(err).slice(0, 200) });
  }
}


/**
 * 1kmメッシュ ピンポイント天気予報・体感予報を取得して
 * 表示に必要な形だけに整形して返す。
 */
function fetchForecast_(lat, lon) {
  var cache = CacheService.getScriptCache();
  var key = 'ss1wx_' + lat.toFixed(4) + '_' + lon.toFixed(4);

  var hit = cache.get(key);
  if (hit) {
    var cached = JSON.parse(hit);
    cached.cached = true;
    return cached;
  }

  var apiKey = PropertiesService.getScriptProperties().getProperty('WXTECH_API_KEY')
            || WXTECH_API_KEY_FALLBACK;
  if (!apiKey) throw new Error('WXTECH_API_KEY not set');

  var url = API_BASE + '?lat=' + lat + '&lon=' + lon;
  var res = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: { 'X-API-Key': apiKey },
    muteHttpExceptions: true,
    followRedirects: true,
    validateHttpsCertificates: true
  });

  var code = res.getResponseCode();
  if (code !== 200) {
    throw new Error('http_' + code + ' ' + res.getContentText().slice(0, 120));
  }

  var raw = JSON.parse(res.getContentText());
  var wx = raw.wxdata && raw.wxdata[0];
  if (!wx || !wx.srf || !wx.srf.length) throw new Error('empty_payload');

  var out = {
    ok: true,
    cached: false,
    fetchedAt: new Date().toISOString(),
    now: wx.srf[0],                 // 直近1時間の予報 = 現在表示用
    hourly: wx.srf.slice(0, 12),    // 12時間分
    daily: (wx.mrf || []).slice(0, 7)
  };

  cache.put(key, JSON.stringify(out), CACHE_SEC);
  return out;
}


function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}


/** エディタ上での動作確認用。実行して200が返ることを見る。 */
function testFetch() {
  var r = fetchForecast_(34.605184, 135.470949);
  Logger.log(JSON.stringify(r, null, 2));
}
