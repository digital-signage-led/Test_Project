/**
 * 現場テンプレート（位置情報だけ書き換え）
 *
 * 使い方:
 * 1. このファイルを site-config.js にコピー
 * 2. 下の ★ を現場の値に書き換え
 */
(function (global) {
  'use strict';

  var cfg = {
    site: {
      customer: '',
      rental: '',
      /* ★ 時刻下白帯に出る会場名 */
      label: '（会場名）',
      address: '（住所）',
      /* ★ 予報・天気パネル下の短い地名 */
      locationLabel: '（表示地名）'
    },
    moe: {
      gasUrl:
        'https://script.google.com/macros/s/AKfycbzSTsappgfJTaJruOBJsbnCXSTPkeTBp39CXpvoSZsPQ0mWGs4KjSonC8_eZ2b1EeUXTQ/exec',
      /* ★ 環境省 WBGT 5桁地点コード */
      point: '00000',
      fallbackPoint: '',
      pointName: '（観測地点名）',
      alertArea: '（都道府県）',
      region: '00',
      prefecture: '00'
    },
    jma: {
      amedasPoint: '00000',
      amedasSupplementPoint: '',
      forecastArea: '000000',
      forecastLabel: '（表示地名）',
      warnArea: '000000',
      warnCity: '0000000',
      warnCityLabel: '（市町村名）'
    },
    geo: { lat: 0, lon: 0 },
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
