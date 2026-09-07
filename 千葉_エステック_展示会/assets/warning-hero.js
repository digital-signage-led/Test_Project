/**
 * 512×128 3段ヒーロー（注意報・警報・危険警報・特別警報・避難情報）
 * 256px（2面）を1セットとして流し、1周で次へ。
 */
(function (global) {
  'use strict';

  var KINDS = [
    { key: 'flood', label: '氾濫' },
    { key: 'rain', label: '大雨' },
    { key: 'landslide', label: '土砂災害' },
    { key: 'surge', label: '高潮' }
  ];
  var LEVELS = [
    { group: 'l2', key: 'advisory', label: '注意報', lv: 2, cls: 'advisory', suffix: '注意報',
      bot: '避難行動・避難経路の確認（ハザードマップ等の再チェック）' },
    { group: 'l3', key: 'warning', label: '警報', lv: 3, cls: 'warning', suffix: '警報',
      bot: '高齢者や避難に時間のかかる人は避難' },
    { group: 'l4', key: 'danger', label: '危険警報', lv: 4, cls: 'danger', suffix: '危険警報',
      bot: '危険な場所から全員避難（自治体の「避難指示」相当）' },
    { group: 'l5', key: 'special', label: '特別警報', lv: 5, cls: 'special', suffix: '特別警報',
      bot: '命を守るための最善の行動をとる（すでに災害発生または切迫）' }
  ];
  var EVAC_ITEMS = [
    { group: 'evac', label: '避難情報', lv: 3, cls: 'warning', levelLabel: '警戒レベル3',
      mid: 'レベル3高齢者等避難', bot: '高齢者や避難に時間のかかる人は避難', badge: '発表中', kind: 'evac3' },
    { group: 'evac', label: '避難情報', lv: 4, cls: 'danger', levelLabel: '警戒レベル4',
      mid: 'レベル4避難指示', bot: '危険な場所から全員避難', badge: '発表中', kind: 'evac4' },
    { group: 'evac', label: '避難情報', lv: 5, cls: 'special', levelLabel: '警戒レベル5',
      mid: 'レベル5緊急安全確保', bot: '命を守るための最善の行動をとる（すでに災害発生または切迫）', badge: '発表中', kind: 'evac5' }
  ];
  var CODE_MAP = {
    '10': { level: 'advisory', kind: 'rain' },
    '03': { level: 'warning', kind: 'rain' },
    '33': { level: 'special', kind: 'rain' },
    '18': { level: 'advisory', kind: 'flood' },
    '04': { level: 'warning', kind: 'flood' },
    '19': { level: 'advisory', kind: 'surge' },
    '08': { level: 'warning', kind: 'surge' },
    '09': { level: 'warning', kind: 'surge' },
    '38': { level: 'special', kind: 'surge' }
  };

  function warnItems() {
    var out = [];
    for (var i = 0; i < KINDS.length; i++) {
      var kind = KINDS[i];
      for (var j = 0; j < LEVELS.length; j++) {
        var lv = LEVELS[j];
        out.push({
          group: lv.group,
          levelKey: lv.key,
          kind: kind.key,
          label: lv.label,
          lv: lv.lv,
          cls: lv.cls,
          levelLabel: '警戒レベル' + lv.lv,
          mid: 'レベル' + lv.lv + kind.label + lv.suffix,
          bot: lv.bot,
          badge: '発表中'
        });
      }
    }
    return out;
  }

  function levelDemoItems() {
    return warnItems().map(function (item) {
      return Object.assign({}, item, {
        demo: true,
        badge: 'デモ',
        levelLabel: 'デモ 警戒レベル' + item.lv
      });
    });
  }

  function demoItems() {
    return levelDemoItems();
  }

  function levelByKey(key) {
    return LEVELS.filter(function (lv) { return lv.key === key; })[0] || null;
  }

  function kindLabel(kindKey) {
    var row = KINDS.filter(function (k) { return k.key === kindKey; })[0];
    return row ? row.label : '';
  }

  function catalogRow(levelKey, kindKey) {
    var src = global.JmaWarningKinds;
    var rows = src && src.CATALOG && src.CATALOG[levelKey];
    if (!rows) return null;
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].kind === kindKey) return rows[i];
    }
    return null;
  }

  function itemFromLive(levelKey, kindKey) {
    var lv = levelByKey(levelKey);
    if (!lv) return null;
    var four = kindLabel(kindKey);
    var row = catalogRow(levelKey, kindKey);
    if (!four && !row) return null;
    var hasLevel = row ? !!row.hasLevel : !!four;
    return {
      group: lv.group,
      levelKey: lv.key,
      kind: kindKey,
      label: lv.label,
      lv: lv.lv,
      cls: lv.cls,
      levelLabel: hasLevel ? ('警戒レベル' + lv.lv) : lv.label,
      mid: row ? row.name : ('レベル' + lv.lv + four + lv.suffix),
      bot: four ? lv.bot : ((row && row.short) || lv.bot),
      badge: '発表中'
    };
  }

  function liveMatchCodes(cityCode, areaCode) {
    var city = String(cityCode || '');
    var extra = {
      '1220410': ['1220400', '1210000', '120010'],
      '1220400': ['1220410', '1210000', '120010'],
      '1210000': ['1220400', '1220410', '120010']
    };
    var codes = [city, String(areaCode || '')];
    (extra[city] || []).forEach(function (c) {
      if (codes.indexOf(c) < 0) codes.push(c);
    });
    return codes;
  }

  function parseLiveEntries(warnJson, cityCode, areaCode) {
    var seen = {};
    var out = [];
    var codes = liveMatchCodes(cityCode, areaCode);
    var headline = String((warnJson && warnJson.headlineText) || '');
    if (!warnJson || !warnJson.areaTypes) return out;
    warnJson.areaTypes.forEach(function (at) {
      (at.areas || []).forEach(function (area) {
        if (codes.indexOf(String(area.code)) < 0) return;
        (area.warnings || []).forEach(function (w) {
          var st = String(w.status || '');
          if (!st || st.indexOf('解除') >= 0) return;
          var c = String(w.code || '');
          var base = CODE_MAP[c];
          if (!base) return;
          var levelKey = base.level;
          var kindKey = base.kind;
          if (c === '03' && headline.indexOf('危険') >= 0) levelKey = 'danger';
          if (c === '03' && headline.indexOf('土砂') >= 0) kindKey = 'landslide';
          var item = itemFromLive(levelKey, kindKey);
          if (!item) return;
          var key = item.levelKey + '|' + item.kind;
          if (seen[key]) return;
          seen[key] = true;
          out.push(item);
          if (c === '03' && headline.indexOf('土砂') >= 0 && kindKey === 'rain') {
            var extra = itemFromLive(levelKey, 'landslide');
            if (extra && !seen[extra.levelKey + '|landslide']) {
              seen[extra.levelKey + '|landslide'] = true;
              out.push(extra);
            }
          }
        });
      });
    });
    var order = { special: 0, danger: 1, warning: 2, advisory: 3 };
    var kindOrd = { rain: 0, landslide: 1, flood: 2, surge: 3 };
    out.sort(function (a, b) {
      var la = order[a.levelKey];
      var lb = order[b.levelKey];
      if (la !== lb) return la - lb;
      return (kindOrd[a.kind] || 9) - (kindOrd[b.kind] || 9);
    });
    return out;
  }

  function fetchLive(area, city) {
    var url = 'https://www.jma.go.jp/bosai/warning/data/warning/' + encodeURIComponent(area) + '.json';
    return fetch(url, { cache: 'no-store' }).then(function (res) {
      if (!res.ok) throw new Error('warning HTTP ' + res.status);
      return res.json();
    }).then(function (json) {
      return parseLiveEntries(json, city, area);
    });
  }

  var SPEED = 56;
  var UNIT_W = 256;

  function makeTopSeg(scene) {
    var seg = document.createElement('div');
    seg.className = 'seg';
    var unit = document.createElement('div');
    unit.className = 'unit';
    var level = document.createElement('span');
    level.className = 'top-label';
    level.textContent = scene.levelLabel;
    var badge = document.createElement('span');
    badge.className = 'badge';
    badge.innerHTML = '<span>' + (scene.badge || '発表中') + '</span>';
    unit.appendChild(level);
    unit.appendChild(badge);
    seg.appendChild(unit);
    return seg;
  }

  function makeMidSeg(scene) {
    var seg = document.createElement('div');
    seg.className = 'seg';
    var chip = document.createElement('span');
    chip.className = 'mid-chip';
    chip.textContent = scene.mid;
    seg.appendChild(chip);
    return seg;
  }

  function makeBotSeg(scene) {
    var seg = document.createElement('div');
    seg.className = 'seg';
    var txt = document.createElement('span');
    txt.className = 'bot-txt';
    txt.textContent = scene.bot;
    seg.appendChild(txt);
    return seg;
  }

  function fillTrack(track, makeSeg, scene) {
    track.style.transform = 'translate3d(0,0,0)';
    while (track.firstChild) track.removeChild(track.firstChild);
    track.appendChild(makeSeg(scene));
  }

  function fitToWidth(el, maxW, maxPx) {
    if (!el) return;
    var isMid = el.classList.contains('mid-chip');
    el.style.letterSpacing = '0.02em';
    el.style.fontSize = maxPx + 'px';
    el.style.transform = isMid ? 'translateY(-3px)' : 'none';
    el.style.width = 'auto';
    el.style.maxWidth = 'none';
    el.style.flex = '0 0 auto';
    var w = el.offsetWidth;
    if (w > maxW && w > 0) {
      el.style.fontSize = Math.max(8, (maxW / w) * maxPx) + 'px';
      w = el.offsetWidth;
    }
    if (w > maxW) {
      el.style.letterSpacing = '0';
      w = el.offsetWidth;
    }
    if (w > maxW && w > 0) {
      el.style.fontSize = Math.max(7, (maxW / w) * parseFloat(el.style.fontSize)) + 'px';
    }
    el.style.maxWidth = maxW + 'px';
    el.style.overflow = 'hidden';
  }

  function fitBot(el, maxW, maxH) {
    if (!el) return;
    el.style.whiteSpace = 'normal';
    el.style.width = maxW + 'px';
    el.style.maxWidth = maxW + 'px';
    el.style.flex = '0 0 auto';
    var size = 16;
    el.style.fontSize = size + 'px';
    el.style.lineHeight = '1.15';
    var guard = 20;
    while (el.scrollHeight > maxH && size > 10 && guard-- > 0) {
      size -= 0.5;
      el.style.fontSize = size + 'px';
    }
  }

  function prepareTrack(track) {
    var first = track.children[0];
    if (!first) return 0;
    var innerW = UNIT_W - 16;
    var mid = first.querySelector('.mid-chip');
    var bot = first.querySelector('.bot-txt');
    var top = first.querySelector('.top-label');
    if (bot) fitBot(bot, innerW, 36);
    if (top) fitToWidth(top, 160, 20);
    var loopW = UNIT_W;
    if (mid) {
      var maxMid = 500;
      mid.style.fontSize = '36px';
      mid.style.letterSpacing = '0.04em';
      mid.style.width = 'auto';
      mid.style.maxWidth = 'none';
      mid.style.flex = '0 0 auto';
      mid.style.transform = 'translateY(-3px)';
      var mw = mid.offsetWidth || 0;
      var guard = 24;
      while (mw > maxMid && guard-- > 0) {
        var fs = parseFloat(mid.style.fontSize) || 36;
        mid.style.fontSize = Math.max(14, fs - 1) + 'px';
        mw = mid.offsetWidth || 0;
      }
      var w = Math.max(UNIT_W, Math.min(maxMid, mw + 16));
      first.style.width = w + 'px';
      first.style.minWidth = w + 'px';
      first.style.maxWidth = w + 'px';
      first.style.flex = '0 0 ' + w + 'px';
      loopW = w;
    } else {
      first.style.width = UNIT_W + 'px';
      first.style.minWidth = UNIT_W + 'px';
      first.style.maxWidth = UNIT_W + 'px';
      first.style.flex = '0 0 ' + UNIT_W + 'px';
    }
    while (track.children.length > 1) track.removeChild(track.lastChild);
    for (var i = 1; i < 6; i++) track.appendChild(first.cloneNode(true));
    return loopW;
  }

  function createPlayer(opts) {
    var hero = opts.hero;
    var topTrack = opts.topTrack;
    var midTrack = opts.midTrack;
    var botTrack = opts.botTrack;
    var onItem = opts.onItem || function () {};
    var onCycleEnd = opts.onCycleEnd || null;
    var items = (opts.items || []).slice();
    var itemIndex = 0;
    var playGen = 0;
    var rafId = 0;
    var cycles = Math.max(1, Number(opts.cycles) || 1);
    var cycleCount = 0;

    function startSharedScroll(gen, loopWs) {
      if (rafId) cancelAnimationFrame(rafId);
      var scrollX = 0;
      var lastTs = 0;
      var switched = false;
      var oneLoop = loopWs[1] || UNIT_W;
      var step = function (ts) {
        if (gen !== playGen) return;
        if (!lastTs) lastTs = ts;
        var dt = Math.min(0.05, (ts - lastTs) / 1000);
        lastTs = ts;
        scrollX += SPEED * dt;
        [topTrack, midTrack, botTrack].forEach(function (track, i) {
          var w = loopWs[i];
          if (w < 1) return;
          track.style.transform = 'translate3d(' + (-(scrollX % w)) + 'px,0,0)';
        });
        if (!switched && oneLoop > 0 && scrollX >= oneLoop) {
          switched = true;
          nextItem();
          return;
        }
        rafId = requestAnimationFrame(step);
      };
      rafId = requestAnimationFrame(step);
    }

    function renderItem(index) {
      if (!items.length) return;
      var gen = ++playGen;
      itemIndex = ((index % items.length) + items.length) % items.length;
      var scene = items[itemIndex];
      hero.className = 'hero is-' + scene.cls + (scene.demo ? ' is-demo' : '');
      fillTrack(topTrack, makeTopSeg, scene);
      fillTrack(midTrack, makeMidSeg, scene);
      fillTrack(botTrack, makeBotSeg, scene);
      onItem(scene, itemIndex);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          if (gen !== playGen) return;
          var loopWs = [prepareTrack(topTrack), prepareTrack(midTrack), prepareTrack(botTrack)];
          startSharedScroll(gen, loopWs);
        });
      });
    }

    function nextItem() {
      var next = itemIndex + 1;
      if (next >= items.length) {
        cycleCount += 1;
        if (onCycleEnd && cycleCount >= cycles) {
          onCycleEnd();
          return;
        }
        next = 0;
      }
      renderItem(next);
    }

    return {
      setItems: function (next) { items = (next || []).slice(); itemIndex = 0; cycleCount = 0; },
      play: function (index) { cycleCount = 0; renderItem(index || 0); },
      stop: function () { playGen += 1; if (rafId) cancelAnimationFrame(rafId); rafId = 0; },
      items: function () { return items; }
    };
  }

  global.WarningHero = {
    KINDS: KINDS,
    LEVELS: LEVELS,
    EVAC_ITEMS: EVAC_ITEMS,
    GROUPS: [
      { id: 'l2', label: '注意報', lv: 2 },
      { id: 'l3', label: '警報', lv: 3 },
      { id: 'l4', label: '危険警報', lv: 4 },
      { id: 'l5', label: '特別警報', lv: 5 },
      { id: 'evac', label: '避難情報' }
    ],
    warnItems: warnItems,
    levelDemoItems: levelDemoItems,
    demoItems: demoItems,
    itemFromLive: itemFromLive,
    parseLiveEntries: parseLiveEntries,
    fetchLive: fetchLive,
    createPlayer: createPlayer
  };
})(typeof window !== 'undefined' ? window : this);
