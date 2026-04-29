const C = {
  ms: 30 * 60 * 1000,
  holdMs: 8000,
  rotateMs: 1000,
  retryMs: 15000,
  lat: 34.6937,
  lon: 135.5023,
  // 基本は環境省のオープンデータを参照する
  region: "07",
  prefecture: "62",
  point: "62078",
  // CORS回避のため read-only proxy 経由で環境省ページを取得
  proxy: "https://api.allorigins.win/raw?url=",
  moePageBase: "https://www.wbgt.env.go.jp/wbgt_data.php"
};

const L = [
  {
    min: 31,
    key: "danger",
    bg: "#EC3817",
    tbg: "#EC3817",
    tbar: "#EE6145",
    face: "./images/face-danger.png",
    n: ["危険", "Danger", "Nguy hiểm", "危险"],
    a: ["作業を直ちに中止", "Stop work immediately", "Dừng công việc ngay", "立即停止作业"]
  },
  {
    min: 28,
    key: "severe",
    bg: "#FD871A",
    tbg: "#FD871A",
    tbar: "#FCA633",
    face: "./images/face-severe.png",
    n: ["厳重警戒", "Severe Warning", "Cảnh báo nghiêm trọng", "严重警戒"],
    a: ["激しい作業は中止", "Stop intense work", "Ngừng làm việc nặng", "停止剧烈作业"]
  },
  {
    min: 25,
    key: "warning",
    bg: "#FFC700",
    tbg: "#FFC700",
    tbar: "#FFD84D",
    face: "./images/face-warning.png",
    n: ["警戒", "Warning", "Cảnh báo", "警戒"],
    a: ["定期的に休憩", "Take regular breaks", "Nghỉ ngơi định kỳ", "定时休息"]
  },
  {
    min: 21,
    key: "caution",
    bg: "#2BB3E0",
    tbg: "#2BB3E0",
    tbar: "#5FC7E8",
    face: "./images/face-caution.png",
    n: ["注意", "Caution", "Chú ý", "注意"],
    a: ["積極的に水分補給", "Actively hydrate", "Uống nước thường xuyên", "及时补水"]
  },
  {
    min: -Infinity,
    key: "safe",
    bg: "#0289DE",
    tbg: "#0289DE",
    tbar: "#319EE3",
    face: "./images/face-safe.png",
    n: ["ほぼ安全", "Safe", "An toàn", "基本安全"],
    a: ["適宜水分補給", "Stay hydrated", "Bổ sung nước", "注意补水"]
  }
];

const tr = document.getElementById("tr");
const facePanel = document.getElementById("face");
const faceRotator = document.getElementById("face-rotator");
const faceImage = document.getElementById("face-image");
const slideArea = document.getElementById("slide-area");
const errorArea = document.getElementById("e");

for (let i = 0; i < 8; i++) {
  const d = document.createElement("div");
  d.className = "c";
  d.dataset.l = i % 4;
  d.innerHTML = '<div class="tb"></div><div class="wb"></div><div class="t"></div><div class="w"></div><div class="dvd"></div><div class="n"></div><div class="a"></div>';
  tr.appendChild(d);
}
tr.style.width = "1024px";

let step = 0;
function moveConveyorAndFace() {
  step += 1;
  tr.style.transition = `transform ${C.rotateMs}ms ease-in-out`;
  faceRotator.style.transition = `transform ${C.rotateMs}ms ease-in-out`;
  tr.style.transform = `translateX(-${step * 128}px)`;
  faceRotator.style.transform = `rotate(${step * 90}deg)`;
}

function startSynchronizedLoop() {
  function nextStep() {
    moveConveyorAndFace();
    if (step >= 4) {
      setTimeout(() => {
        // 4ステップ完了後、左コンベアと右回転を同時に初期化して次サイクルへ。
        tr.style.transition = "none";
        faceRotator.style.transition = "none";
        step = 0;
        tr.style.transform = "translateX(0)";
        faceRotator.style.transform = "rotate(0deg)";
        setTimeout(nextStep, C.holdMs);
      }, C.rotateMs);
      return;
    }
    setTimeout(nextStep, C.holdMs + C.rotateMs);
  }
  setTimeout(nextStep, C.holdMs);
}
startSynchronizedLoop();

function parseMoeObservation(payload) {
  if (Array.isArray(payload?.actual?.data)) {
    const now = payload.actual.data.find((row) => row && row.wbgt !== undefined) || payload.actual.data[0];
    return {
      wbgt: now && isFinite(Number(now.wbgt)) ? Number(now.wbgt) : null,
      temp: now && isFinite(Number(now.temp)) ? Number(now.temp) : null
    };
  }
  if (Array.isArray(payload?.data)) {
    const now = payload.data.find((row) => row && row.wbgt !== undefined) || payload.data[0];
    return {
      wbgt: now && isFinite(Number(now.wbgt)) ? Number(now.wbgt) : null,
      temp: now && isFinite(Number(now.temp)) ? Number(now.temp) : null
    };
  }
  return {
    wbgt: isFinite(Number(payload?.wbgt)) ? Number(payload.wbgt) : null,
    temp: isFinite(Number(payload?.temp)) ? Number(payload.temp) : null
  };
}

async function fetchMoeWbgt() {
  const pageUrl = `${C.moePageBase}?region=${C.region}&prefecture=${C.prefecture}&point=${C.point}`;
  const r = await fetch(`${C.proxy}${encodeURIComponent(pageUrl)}`, { cache: "no-store" });
  if (!r.ok) throw new Error("MOE API error");
  const text = await r.text();

  // 指定観測点のブロックから WBGT を抽出
  const pointPattern = new RegExp(
    `submitMapGraph\\([^\\)]*'${C.region}'\\s*,\\s*'${C.prefecture}'\\s*,\\s*'${C.point}'[^\\)]*\\)[\\s\\S]*?<div class=\"value[^\\\"]*\">\\s*([-+]?\\d+(?:\\.\\d+)?)\\s*</div>`,
    "i"
  );
  const matchedPoint = text.match(pointPattern);
  const wbgt = matchedPoint && matchedPoint[1] ? Number(matchedPoint[1]) : null;

  // 気温は取得できなければ "--.-℃" のまま表示
  const tempMatch = text.match(/気温[^0-9-+]*([-+]?\d+(?:\.\d+)?)/i);
  const temp = tempMatch && tempMatch[1] ? Number(tempMatch[1]) : null;

  return {
    wbgt: Number.isFinite(wbgt) ? wbgt : null,
    temp: Number.isFinite(temp) ? temp : null
  };
}

async function fetchTempFallback() {
  try {
    const r = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${C.lat}&longitude=${C.lon}&current=temperature_2m&timezone=Asia%2FTokyo`,
      { cache: "no-store" }
    );
    if (!r.ok) return null;
    const d = await r.json();
    const t = d?.current?.temperature_2m;
    return Number.isFinite(Number(t)) ? Number(t) : null;
  } catch (_) {
    return null;
  }
}

function upd(temp, wbgt) {
  const hasWbgt = typeof wbgt === "number" && Number.isFinite(wbgt);
  const lv = hasWbgt ? L.find((l) => wbgt >= l.min) : L[L.length - 1];
  const wi = hasWbgt ? String(Math.round(wbgt)) : "--";
  const ts = temp == null ? "--.-℃" : `${temp.toFixed(1)}℃`;

  slideArea.style.display = "block";
  facePanel.style.display = "flex";
  errorArea.style.display = "none";

  tr.querySelectorAll(".c").forEach((c) => {
    const i = Number(c.dataset.l);
    c.style.background = lv.tbg;
    c.querySelector(".tb").style.background = lv.tbar;
    c.querySelector(".t").textContent = ts;
    c.querySelector(".w").textContent = wi;
    c.querySelector(".n").textContent = lv.n[i];
    c.querySelector(".a").textContent = lv.a[i];
  });

  facePanel.style.background = lv.bg;
  faceImage.src = lv.face;
}

function showNormalDisplay() {
  slideArea.style.display = "block";
  facePanel.style.display = "flex";
  errorArea.style.display = "none";
}

async function fetchWithRetry(attempts = 3, waitMs = C.retryMs) {
  let lastError = null;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fetchMoeWbgt();
    } catch (e) {
      lastError = e;
      if (i < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }
    }
  }
  throw lastError || new Error("環境省WBGT取得失敗");
}

async function go() {
  showNormalDisplay();
  try {
    const [obs, fallbackTemp] = await Promise.all([fetchWithRetry(3, C.retryMs), fetchTempFallback()]);
    const resolvedTemp = obs.temp ?? fallbackTemp;
    upd(resolvedTemp, obs.wbgt);
  } catch (e) {
    // 取得失敗時はエラー画面にせず、WBGT値のみ "--" 表示にする。
    const fallbackTemp = await fetchTempFallback();
    upd(fallbackTemp, null);
    console.error(e);
  }
}

go();
setInterval(go, C.ms);
