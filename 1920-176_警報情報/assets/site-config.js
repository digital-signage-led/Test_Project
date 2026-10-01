/**
 * 現場設定（大阪府大阪市淀川区西中島3丁目9-15 / 大鉄工業）
 * 気象観測＋警報。横スクロール末尾にロゴ1面。
 */
(function (global) {
  'use strict';

  var cfg = {
    site: {
      customer: '大鉄工業株式会社',
      rental: '',
      label: '淀川区',
      address: '大阪府大阪市淀川区西中島3丁目9-15',
      locationLabel: '淀川区'
    },
    moe: {
      gasUrl:
        'https://script.google.com/macros/s/AKfycbzSTsappgfJTaJruOBJsbnCXSTPkeTBp39CXpvoSZsPQ0mWGs4KjSonC8_eZ2b1EeUXTQ/exec',
      point: '62078',
      fallbackPoint: '',
      pointName: '大阪',
      alertArea: '大阪府',
      region: '06',
      prefecture: '62'
    },
    jma: {
      amedasPoint: '62078',
      amedasSupplementPoint: '',
      forecastArea: '270000',
      forecastLabel: '淀川区',
      warnArea: '270000',
      warnCity: '2710000',
      warnCityLabel: '淀川区'
    },
    geo: { lat: 34.7275, lon: 135.4995 },
    timeZone: 'Asia/Tokyo',
    refreshMs: 60000,
    footSource: '出典：気象庁・環境省データ'
  };

  global.SignageConfig = cfg;

  global.SIGNAGE_CONFIG = {
    logoSrc: './assets/daitetsu_logo.png?v=20261001',
    logoAlt: '大鉄工業株式会社',
    logoPanelBg: '#ffffff',
    logoCorpSrc: '',
    footLogoSrc: './assets/daitetsu_logo.png?v=20261001',
    footBannerSrc: ''
  };
})(typeof window !== 'undefined' ? window : global);
