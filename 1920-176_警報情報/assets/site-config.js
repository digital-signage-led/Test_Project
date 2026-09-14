/**
 * 現場設定（名古屋市）
 * 他会場へ展開するときは site-config.template.js をコピーして書き換える。
 */
(function (global) {
  'use strict';

  var cfg = {
    site: {
      customer: '株式会社エステック',
      rental: '',
      label: '名古屋市',
      address: '愛知県名古屋市',
      /* 画面表示名 */
      locationLabel: '名古屋市'
    },
    moe: {
      /* 環境省 WBGT（名古屋 51106）※WBGTシーン非表示でも地点は合わせておく */
      gasUrl:
        'https://script.google.com/macros/s/AKfycbzSTsappgfJTaJruOBJsbnCXSTPkeTBp39CXpvoSZsPQ0mWGs4KjSonC8_eZ2b1EeUXTQ/exec',
      point: '51106',
      fallbackPoint: '',
      pointName: '名古屋',
      alertArea: '愛知県',
      region: '05',
      prefecture: '51'
    },
    jma: {
      /* 気象庁 AMeDAS 51106（名古屋地方気象台） */
      amedasPoint: '51106',
      amedasSupplementPoint: '',
      forecastArea: '230000',
      forecastLabel: '名古屋市',
      warnArea: '230000',
      warnCity: '2310000',
      /* 気象庁コード 2310000＝名古屋市 */
      warnCityLabel: '名古屋市'
    },
    geo: { lat: 35.16667, lon: 136.96500 },
    timeZone: 'Asia/Tokyo',
    refreshMs: 60000,
    footSource: '出典：気象庁・環境省データ'
  };

  global.SignageConfig = cfg;

  global.SIGNAGE_CONFIG = {
    logoSrc: '',
    logoAlt: '',
    logoPanelBg: '#ffffff',
    logoCorpSrc: '',
    footLogoSrc: '',
    footBannerSrc: ''
  };
})(typeof window !== 'undefined' ? window : global);
