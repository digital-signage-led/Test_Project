/**
 * 現場設定（エステック・安芸区／安芸南部山系深山の滝川上流支川砂防堰堤他工事）
 * 他会場へ展開するときは site-config.template.js をコピーして書き換える。
 */
(function (global) {
  'use strict';

  var cfg = {
    site: {
      customer: '株式会社エステック',
      rental: '',
      /* 時刻下白帯＝会場・工事名 */
      label: '令和8年度 安芸南部山系深山の滝川上流支川砂防堰堤他工事',
      address: '〒731-4229 広島県安芸郡熊野町平谷2丁目19-7',
      /* 画面表示は安芸区。観測値は最寄り呉（67511） */
      locationLabel: '安芸区'
    },
    moe: {
      /* 環境省 WBGT（安芸区最寄り・呉 67511） */
      gasUrl:
        'https://script.google.com/macros/s/AKfycbzSTsappgfJTaJruOBJsbnCXSTPkeTBp39CXpvoSZsPQ0mWGs4KjSonC8_eZ2b1EeUXTQ/exec',
      point: '67511',
      /* 表示と実データを一致させるため、欠測時フォールバックは使わない */
      fallbackPoint: '',
      pointName: '呉',
      alertArea: '広島県',
      region: '08',
      prefecture: '67'
    },
    jma: {
      /* 気象庁 AMeDAS 67511（呉・WBGT と同一地点） */
      amedasPoint: '67511',
      /* 呉で欠ける項目は広島地方気象台で補完 */
      amedasSupplementPoint: '67437',
      forecastArea: '340000',
      forecastLabel: '安芸区',
      warnArea: '340000',
      warnCity: '3410300',
      /* 気象庁コード 3410300＝広島市安芸区 */
      warnCityLabel: '安芸区'
    },
    geo: { lat: 34.33836, lon: 132.55955 },
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
    /* 時刻下白帯：マーク＋株式会社エステック（256px枠で会場名と流す） */
    footBannerSrc: './assets/estec_foot_lockup.png?v=2'
  };
})(typeof window !== 'undefined' ? window : global);
