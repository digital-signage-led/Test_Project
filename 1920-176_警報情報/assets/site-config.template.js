/**
 * 現場テンプレート（位置情報だけ書き換え）
 *
 * 使い方:
 * 1. このファイルを site-config.js にコピー
 * 2. 下の ★ を現場の値に書き換え
 * 3. index.html / assets / ロゴはそのまま使う
 *
 * コード・見た目・ループ構成は共通。変えるのはこのファイルだけ。
 */
(function (global) {
  'use strict';

  var cfg = {
    site: {
      customer: '株式会社エステック',
      rental: '',
      /* ★ 時刻下白帯に出る会場名 */
      label: '（会場名）',
      /* ★ 備考用（画面には出さないことが多い） */
      address: '（住所）',
      /* ★ 予報・天気パネル下の短い地名（例: 幕張 / 横浜） */
      locationLabel: '（表示地名）'
    },
    moe: {
      /* GAS は共通。地点は point で切替 */
      gasUrl:
        'https://script.google.com/macros/s/AKfycbzSTsappgfJTaJruOBJsbnCXSTPkeTBp39CXpvoSZsPQ0mWGs4KjSonC8_eZ2b1EeUXTQ/exec',
      /* ★ 環境省 WBGT 5桁地点コード（必須・会場最寄り） */
      point: '00000',
      fallbackPoint: '',
      /* ★ GAS/CSV 用の観測地点名（環境省表記） */
      pointName: '（観測地点名）',
      /* ★ 熱中症アラートの府県名（例: 千葉県） */
      alertArea: '（都道府県）',
      /* ★ 環境省 region / prefecture（都道府県コード） */
      region: '00',
      prefecture: '00'
    },
    jma: {
      /* ★ 気象庁 AMeDAS 地点（通常は moe.point と同じ） */
      amedasPoint: '00000',
      amedasSupplementPoint: '',
      /* ★ 予報区域コード（例: 千葉県 120000） */
      forecastArea: '000000',
      /* ★ 予報表示用の短い地名（locationLabel と同じでよい） */
      forecastLabel: '（表示地名）',
      /* ★ 警報 JSON の都道府県コード（例: 120000） */
      warnArea: '000000',
      /* ★ 警報の市町村コード（例: 千葉市 1210000） */
      warnCity: '0000000',
      /* ★ 警報上段に出る市町村名（例: 千葉市） */
      warnCityLabel: '（市町村名）'
    },
    /* ★ 会場座標（任意） */
    geo: { lat: 0, lon: 0 },
    timeZone: 'Asia/Tokyo',
    refreshMs: 60000,
    footSource: '出典：気象庁・環境省データ'
  };

  global.SignageConfig = cfg;

  global.SIGNAGE_CONFIG = {
    logoSrc: './assets/estec_logo.png?v=1',
    logoAlt: '株式会社エステック',
    logoPanelBg: '#ffffff',
    logoCorpSrc: '',
    footLogoSrc: '',
    footBannerSrc: './assets/estec_foot_lockup.png?v=2'
  };
})(typeof window !== 'undefined' ? window : global);
