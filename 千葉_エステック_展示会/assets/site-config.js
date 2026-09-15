/**
 * 現場設定（東京ビッグサイト）
 * 表示名: ビックサイト / 観測: 江戸川臨海 44136 / 警報: 江東区 1310800
 * 他会場へ展開するときは site-config.template.js をコピーして書き換える。
 */
(function (global) {
  'use strict';

  var cfg = {
    site: {
      customer: '株式会社エステック',
      rental: '',
      /* 時刻下白帯＝会場名 */
      label: '東京ビックサイト',
      address: '〒135-0063 東京都江東区有明3-11-1（東京ビッグサイト）',
      /* 画面の短い地名 */
      locationLabel: 'ビックサイト'
    },
    moe: {
      /* 環境省 WBGT（有明・江東区最寄りは江戸川臨海 44136） */
      gasUrl:
        'https://script.google.com/macros/s/AKfycbzSTsappgfJTaJruOBJsbnCXSTPkeTBp39CXpvoSZsPQ0mWGs4KjSonC8_eZ2b1EeUXTQ/exec',
      point: '44136',
      fallbackPoint: '',
      pointName: '江戸川臨海',
      alertArea: '東京都',
      region: '03',
      prefecture: '13'
    },
    jma: {
      /* 気象庁 AMeDAS 44136（江戸川臨海・WBGT と同一） */
      amedasPoint: '44136',
      /* 欠ける項目は東京（44132）で補完 */
      amedasSupplementPoint: '44132',
      forecastArea: '130000',
      forecastLabel: 'ビックサイト',
      warnArea: '130000',
      warnCity: '1310800',
      /* 気象庁コード 1310800＝江東区。画面表示はビックサイト */
      warnCityLabel: 'ビックサイト'
    },
    geo: { lat: 35.6298, lon: 139.7941 },
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
