/**
 * 現場設定（宮崎県南部平野部）
 * 4面 512×128。位置・社名・観測点はこのファイルだけ差し替える。
 * 観測: 宮崎 87376 / 予報・警報: 宮崎県 450000・南部平野部 450010・宮崎市 4520100
 */
(function (global) {
  'use strict';

  var cfg = {
    site: {
      customer: '',
      rental: '',
      label: '南部平野部',
      address: '宮崎県南部平野部',
      locationLabel: '南部平野部'
    },
    moe: {
      gasUrl:
        'https://script.google.com/macros/s/AKfycbzSTsappgfJTaJruOBJsbnCXSTPkeTBp39CXpvoSZsPQ0mWGs4KjSonC8_eZ2b1EeUXTQ/exec',
      point: '87376',
      fallbackPoint: '',
      pointName: '宮崎',
      alertArea: '宮崎県',
      region: '10',
      prefecture: '87'
    },
    jma: {
      amedasPoint: '87376',
      amedasSupplementPoint: '',
      forecastArea: '450000',
      forecastDetail: '450010',
      forecastLabel: '南部平野部',
      warnArea: '450000',
      warnCity: '4520100',
      warnCityLabel: '南部平野部'
    },
    wbgt: {
      seasonStart: { month: 4, day: 22 },
      seasonEnd: { month: 10, day: 22 }
    },
    faces: 4,
    profile: 'AC-512',
    geo: { lat: 31.9383, lon: 131.4133 },
    timeZone: 'Asia/Tokyo',
    refreshMs: 60000,
    footSource: '出典：気象庁・環境省データ',
    schedule: {
      enabled: false,
      weekStartsOn: 1,
      items: []
    }
  };

  global.SignageConfig = cfg;

  global.SIGNAGE_CONFIG = {
    logoSrc: './images/logo.svg?v=20260918-layout',
    logoAlt: cfg.site.customer || cfg.site.locationLabel,
    logoPanelBg: '#ffffff',
    logoCorpSrc: './images/logo.svg?v=20260918-layout',
    footLogoSrc: './images/logo.svg?v=20260918-layout',
    footBannerSrc: ''
  };
})(typeof window !== 'undefined' ? window : global);
