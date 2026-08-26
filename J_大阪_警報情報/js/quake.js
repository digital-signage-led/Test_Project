/** 販売機 地震緊急 640×192 · E.Q1.0（デモ） */

export const CONTENT_VERSION = "E.Q1.0";
export const LOCAL_CITY = "大阪市";

/** 気象庁震度階級カラー＋ゆれの状況（参考図準拠） */
export const INT_META = {
  0: { cls: "i0", label: "0", fg: "#212121", desc: "人はゆれを感じない" },
  1: { cls: "i1", label: "1", fg: "#212121", desc: "屋内にいる人の一部がわずかにゆれを感じる" },
  2: { cls: "i2", label: "2", fg: "#0D47A1", desc: "照明などのつり下げ物が、わずかにゆれる" },
  3: { cls: "i3", label: "3", fg: "#1565C0", desc: "棚にある食器類が音を立てることがある" },
  4: {
    cls: "i4",
    label: "4",
    fg: "#F9A825",
    desc: "つり下げ物は大きくゆれ、棚にある食器類は音を立てる",
  },
  5: {
    cls: "i5l",
    label: "5弱",
    fg: "#F9A825",
    desc: "耐震性の低い建物では壁などにひびが入ることがある",
  },
  "5u": {
    cls: "i5u",
    label: "5強",
    fg: "#EF6C00",
    desc: "耐震性の低い建物では壁などに大きなひび割れが生じることがある",
  },
  6: {
    cls: "i6l",
    label: "6弱",
    fg: "#E53935",
    desc: "耐震性の低い建物では、壁などのタイルが落下することがある",
  },
  "6u": {
    cls: "i6u",
    label: "6強",
    fg: "#B71C1C",
    desc: "耐震性の低い建物では、傾くものや倒れるものが多くなる",
  },
  7: {
    cls: "i7",
    label: "7",
    fg: "#9C27B0",
    desc: "耐震性の低い建物では、傾くものや倒れるものがさらに多くなる",
  },
};

/** デモシーン（本番の緊急地震速報ではありません） */
export const SCENES = [
  {
    severe: "",
    localInt: 1,
    epicenter: "大阪府北部",
    depth: 30,
    mag: 3.2,
    alert: "【デモ】緊急地震速報　揺れに注意",
  },
  {
    severe: "",
    localInt: 2,
    epicenter: "滋賀県北部",
    depth: 20,
    mag: 4.0,
    alert: "【デモ】緊急地震速報　強い揺れに警戒",
  },
  {
    severe: "",
    localInt: 3,
    epicenter: "京都府南部",
    depth: 15,
    mag: 4.4,
    alert: "【デモ】緊急地震速報　強い揺れに警戒",
  },
  {
    severe: "is-severe",
    localInt: 4,
    epicenter: "奈良県",
    depth: 12,
    mag: 5.0,
    alert: "【デモ】緊急地震速報　強い揺れが来ます",
  },
  {
    severe: "is-severe",
    localInt: 5,
    epicenter: "大阪府北部",
    depth: 10,
    mag: 5.4,
    alert: "【デモ】緊急地震速報　強い揺れが来ます",
  },
  {
    severe: "is-severe",
    localInt: "5u",
    epicenter: "兵庫県南東部",
    depth: 10,
    mag: 5.8,
    alert: "【デモ】緊急地震速報　強い揺れが来ます",
  },
  {
    severe: "is-extreme",
    localInt: 6,
    epicenter: "和歌山県北部",
    depth: 8,
    mag: 6.2,
    alert: "【デモ】緊急地震速報　ただちに身を守って",
  },
  {
    severe: "is-extreme",
    localInt: "6u",
    epicenter: "和歌山県北部",
    depth: 8,
    mag: 6.6,
    alert: "【デモ】緊急地震速報　ただちに身を守って",
  },
  {
    severe: "is-extreme",
    localInt: 7,
    epicenter: "和歌山県北部",
    depth: 5,
    mag: 7.0,
    alert: "【デモ】緊急地震速報　ただちに身を守って",
  },
];

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

let sceneIndex = 0;
let enterTimer = 0;
let cycleTimer = 0;
let cycleGen = 0;
let root = null;

function intMeta(v) {
  return INT_META[v] || INT_META[Number(v)] || INT_META[0];
}

function alertIconHtml() {
  return (
    '<span class="quake-alert-icon" aria-hidden="true">' +
    '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M12 2L22 20H2L12 2Z" fill="#fff" fill-opacity=".95"/>' +
    '<path d="M12 9v5" stroke="#C62828" stroke-width="2.4" stroke-linecap="round"/>' +
    '<circle cx="12" cy="17" r="1.3" fill="#C62828"/>' +
    "</svg></span>"
  );
}

function setTicker(text) {
  if (!root) return;
  const item =
    '<span class="quake-ticker-item">' +
    alertIconHtml() +
    '<span class="quake-alert-text">' +
    text +
    "</span></span>";
  const half = item + item + item;
  const track = $("#quakeTickerTrack", root);
  if (!track) return;
  track.innerHTML = half + half;
  track.style.animation = "none";
  void track.offsetWidth;
  track.style.animation = "";
}

function setFront(s) {
  if (!root) return;
  const meta = intMeta(s.localInt);
  const main = $("#quakeFrontMain", root);
  if (!main) return;
  const text = `${LOCAL_CITY} 震度${meta.label}（デモ）`;
  main.textContent = text;
  main.style.setProperty("--int-fg", meta.fg);
  main.classList.toggle("is-wide", text.length >= 8);
  const sub = $("#quakeFrontSub", root);
  if (sub) {
    sub.textContent = `【デモ】震源 ${s.epicenter} / M${s.mag}`;
  }
}

function setSideIntensity(v) {
  if (!root) return;
  const meta = intMeta(v);
  const label = String(meta.label);
  const wide = label.length > 1;
  $$(".quake-card-side", root).forEach((card) => {
    card.className = `quake-card quake-card-side ${meta.cls}`;
  });
  $$(".js-quake-side-int", root).forEach((el) => {
    el.classList.toggle("is-wide", wide);
    const m = label.match(/^(\d)(弱|強)$/);
    if (m) {
      el.innerHTML =
        `<span class="int-num">${m[1]}</span>` +
        `<span class="int-mod">${m[2]}</span>`;
    } else {
      el.textContent = label;
    }
  });
}

function setSideTicker(s) {
  if (!root) return;
  const meta = intMeta(s.localInt);
  const msg = `【デモ】${LOCAL_CITY}　身の安全を確保してください　／　${meta.desc}　／　これはデモ表示です`;
  const unit = `<span>${msg}</span>`;
  $$(".js-quake-side-ticker", root).forEach((track) => {
    track.innerHTML = unit + unit + unit + unit;
    track.style.animation = "none";
    void track.offsetWidth;
    track.style.animation = "";
  });
}

function playEnter() {
  if (!root) return;
  root.classList.add("is-enter");
  if (enterTimer) clearTimeout(enterTimer);
  enterTimer = setTimeout(() => {
    root?.classList.remove("is-enter");
  }, 520);
}

export function applyScene(idx) {
  if (!root) return;
  const s = SCENES[idx % SCENES.length];
  sceneIndex = idx % SCENES.length;
  const keepEnter = root.classList.contains("is-enter");
  root.classList.remove("is-severe", "is-extreme", "is-enter");
  if (s.severe) root.classList.add(s.severe);
  if (keepEnter) root.classList.add("is-enter");

  setTicker(s.alert);
  setFront(s);
  setSideIntensity(s.localInt);
  setSideTicker(s);
  playEnter();
}

export function initQuake(stageEl) {
  root = stageEl;
  sceneIndex = 0;
}

export function hideQuake() {
  stopQuakeCycle();
  document.body.classList.remove("is-quake");
  const machine = document.getElementById("machine");
  machine?.classList.remove("is-hidden");
  if (!root) return;
  root.classList.remove("is-visible", "is-severe", "is-extreme", "is-enter");
  root.setAttribute("hidden", "");
}

export function showQuake() {
  if (!root) return;
  root.removeAttribute("hidden");
  root.classList.add("is-visible");
  document.body.classList.add("is-quake");
  const machine = document.getElementById("machine");
  machine?.classList.add("is-hidden");
}

export function stopQuakeCycle() {
  cycleGen += 1;
  if (cycleTimer) {
    clearTimeout(cycleTimer);
    cycleTimer = 0;
  }
  if (enterTimer) {
    clearTimeout(enterTimer);
    enterTimer = 0;
  }
}

/**
 * デモシーンを1周（各 sceneMs）再生して完了する
 * シーン切替のあいだに gapMs 静止
 * @param {number} sceneMs
 * @param {number} gapMs
 */
export function runQuakeDemoCycle(sceneMs = 3500, gapMs = 1000) {
  const myGen = ++cycleGen;
  if (cycleTimer) {
    clearTimeout(cycleTimer);
    cycleTimer = 0;
  }
  showQuake();
  applyScene(0);

  return new Promise((resolve) => {
    let i = 0;
    const finish = () => {
      resolve();
    };
    const step = () => {
      if (myGen !== cycleGen) {
        finish();
        return;
      }
      i += 1;
      if (i >= SCENES.length) {
        finish();
        return;
      }
      applyScene(i);
      cycleTimer = setTimeout(step, sceneMs + Math.max(0, gapMs));
    };
    cycleTimer = setTimeout(step, sceneMs + Math.max(0, gapMs));
  });
}

/**
 * 地震デモのみ連続再生（?quake=1）
 * @param {number} sceneMs
 */
export function startQuakeLoop(sceneMs = 3500) {
  const gen = ++cycleGen;
  if (cycleTimer) {
    clearTimeout(cycleTimer);
    cycleTimer = 0;
  }
  showQuake();
  applyScene(0);

  const tick = () => {
    if (gen !== cycleGen) return;
    applyScene(sceneIndex + 1);
    cycleTimer = setTimeout(tick, sceneMs);
  };
  cycleTimer = setTimeout(tick, sceneMs);
}
