/**
 * 台風情報（通年監視）
 * 気象庁 targetTc（発表中の熱帯低気圧・台風）を表示する。
 * spec.json が無い報は forecast.json を使う。無い情報は作らない。
 */
(function (global) {
  'use strict';

  var JMA_TYPHOON_BASE = 'https://www.jma.go.jp/bosai/typhoon/data';
  var lastOk_ = { fetchOk: true, exists: false, affectsSite: false, items: [], updatedAt: 0 };
  var lastError_ = null;

  function fetchJson_(url) {
    return fetch(url, { cache: 'no-store' }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    });
  }

  function asArray_(x) {
    return Array.isArray(x) ? x : [];
  }

  function typhoonNo_(num) {
    var s = String(num || '').trim();
    if (!s || /[a-z]/i.test(s)) return '';
    if (/^\d{4}$/.test(s)) return String(Number(s.slice(2)));
    if (/^\d+$/.test(s)) return String(Number(s));
    return '';
  }

  function titleFrom_(rows) {
    return asArray_(rows).find(function (x) { return x && x.part === 'title'; }) || {};
  }

  function analysisFrom_(rows) {
    return asArray_(rows).find(function (x) {
      return x && x.part && (x.part.en === 'Analysis' || x.part.jp === '実況');
    }) || {};
  }

  function issueJst_(title) {
    if (title && title.issue && title.issue.JST) return title.issue.JST;
    return String((title && (title.datetime || title.reportDateTime)) || '');
  }

  function lastPoint_(analysis) {
    var track = (analysis && analysis.track) || {};
    var arr = track.preTyphoon || track.typhoon || track.points || [];
    if (!Array.isArray(arr) || !arr.length) return null;
    var p = arr[arr.length - 1];
    if (Array.isArray(p) && p.length >= 2) {
      return { lat: Number(p[0]), lon: Number(p[1]) };
    }
    if (p && p.lat != null && p.lon != null) {
      return { lat: Number(p.lat), lon: Number(p.lon) };
    }
    return null;
  }

  function categoryLabel_(cat, no, nameJp) {
    var c = String(cat || '').toUpperCase();
    var named = nameJp ? ' ' + nameJp : '';
    if (c === 'TY' || c === 'STS' || c === 'TS') {
      return (no ? '台風' + no + '号' : '台風') + named;
    }
    if (c === 'TD') return '熱帯低気圧' + named;
    if (c === 'LOW') return (no ? '台風' + no + '号' : '温帯低気圧') + named;
    return (no ? '台風' + no + '号' : '台風情報') + named;
  }

  function isSevere_(cat) {
    return /^(TY|STS|TS)$/i.test(String(cat || ''));
  }

  function summarizeRow_(rows, id, tc) {
    var title = titleFrom_(rows);
    var analysis = analysisFrom_(rows);
    var no = typhoonNo_(title.typhoonNumber || (tc && tc.typhoonNumber) || id);
    var nameJp = (title.name && title.name.jp) || '';
    var issued = issueJst_(title);
    var loc = analysis.location || '';
    var point = lastPoint_(analysis);
    if (!loc && point && isFinite(point.lat) && isFinite(point.lon)) {
      loc = point.lat.toFixed(1) + 'N ' + point.lon.toFixed(1) + 'E';
    }
    var cat = (tc && tc.category) || title.category || '';
    var label = categoryLabel_(cat, no, nameJp);
    var parts = [label];
    if (issued) parts.push(String(issued).replace('T', ' ').replace(/\+09:00$/, ''));
    if (loc) parts.push(loc);
    return {
      number: no,
      name: nameJp || '',
      category: cat,
      severe: isSevere_(cat),
      issuedAt: issued || '',
      location: loc || '',
      point: point,
      label: label,
      targetText: '',
      text: parts.filter(Boolean).join('　')
    };
  }

  function emptyOk_() {
    return { fetchOk: true, exists: false, affectsSite: false, items: [], updatedAt: Date.now() };
  }

  function loadTyphoon(siteCfg) {
    return fetchJson_(JMA_TYPHOON_BASE + '/targetTc.json').then(function (targets) {
      var list = Array.isArray(targets) ? targets : (targets && targets.tropicalCyclone ? [targets] : []);
      if (!list.length) {
        lastOk_ = emptyOk_();
        lastError_ = null;
        return lastOk_;
      }
      return Promise.all(list.map(function (tc) {
        var id = tc.tropicalCyclone || tc;
        if (typeof id !== 'string') return null;
        return Promise.all([
          fetchJson_(JMA_TYPHOON_BASE + '/' + id + '/forecast.json').catch(function () { return []; }),
          fetchJson_(JMA_TYPHOON_BASE + '/' + id + '/spec.json').catch(function () { return []; })
        ]).then(function (pair) {
          var forecast = asArray_(pair[0]);
          var spec = asArray_(pair[1]);
          var rows = forecast.length ? forecast : spec;
          if (!rows.length) return null;
          return summarizeRow_(rows, id, tc);
        });
      })).then(function (rows) {
        var items = (rows || []).filter(Boolean);
        lastOk_ = {
          fetchOk: true,
          exists: items.length > 0,
          affectsSite: items.length > 0,
          items: items,
          updatedAt: Date.now()
        };
        lastError_ = null;
        return lastOk_;
      });
    }).catch(function (err) {
      lastError_ = { fetchOk: false, message: String(err && err.message || err), at: Date.now() };
      return {
        fetchOk: false,
        exists: lastOk_.exists,
        affectsSite: lastOk_.affectsSite,
        items: lastOk_.items,
        updatedAt: lastOk_.updatedAt,
        held: true
      };
    });
  }

  function lastResult() {
    if (lastError_) {
      return {
        fetchOk: false,
        exists: lastOk_.exists,
        affectsSite: lastOk_.affectsSite,
        items: lastOk_.items,
        updatedAt: lastOk_.updatedAt,
        held: true
      };
    }
    return lastOk_;
  }

  global.AlertCubeTyphoon = {
    load: loadTyphoon,
    last: lastResult
  };
})(typeof window !== 'undefined' ? window : this);
