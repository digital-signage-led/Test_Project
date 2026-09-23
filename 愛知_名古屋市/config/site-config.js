/**
 * 現場設定（名古屋市）
 * アラートキューブ V2.0 / 4面 512×128。
 * ロゴ・社名なし。位置情報だけこのファイルで差し替える。
 */
(function (global) {
  'use strict';

  var cfg = {
    site: {
      customer: '',
      rental: '',
      label: '名古屋市',
      address: '愛知県名古屋市',
      locationLabel: '名古屋市'
    },
    moe: {
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
      amedasPoint: '51106',
      amedasSupplementPoint: '',
      forecastArea: '230000',
      forecastDetail: '230010',
      forecastLabel: '名古屋市',
      warnArea: '230000',
      warnCity: '2310000',
      warnCityLabel: '名古屋市'
    },
    wbgt: {
      seasonStart: { month: 4, day: 22 },
      seasonEnd: { month: 10, day: 22 }
    },
    faces: 4,
    profile: 'AC-512',
    geo: { lat: 35.16667, lon: 136.96500 },
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
    logoSrc: '',
    logoAlt: '',
    logoPanelBg: '#ffffff',
    logoCorpSrc: '',
    footLogoSrc: '',
    footBannerSrc: ''
  };
})(typeof window !== 'undefined' ? window : global);
