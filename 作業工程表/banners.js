const PLAY = `
<span class="play" aria-hidden="true">
  <svg viewBox="0 0 34 34">
    <circle cx="17" cy="17" r="17" fill="#4A913C"/>
    <polygon points="13,9 13,25 26,17" fill="#EDEEE9"/>
  </svg>
</span>`;

const FLOW = `
<span class="sep" aria-hidden="true"></span>`;

const DAYS = [
  { wareki: "令和8年8月31日", youbi: "月", work: "解体工事" },
  { wareki: "令和8年9月1日", youbi: "火", work: "鉄骨組立工事" },
  { wareki: "令和8年9月2日", youbi: "水", work: "型枠工事", current: true },
  { wareki: "令和8年9月3日", youbi: "木", work: "コンクリート打設" },
  { wareki: "令和8年9月4日", youbi: "金", work: "コンクリート打設" },
  { wareki: "令和8年9月5日", youbi: "土", work: "全休日" },
  { wareki: "令和8年9月6日", youbi: "日", work: "全休日" }
];

function item(day) {
  const workClass = day.current ? "main" : "next-work";
  return `
  <div class="item${day.current ? " is-now" : ""}">
    <span class="meta">
      <span class="wareki">${day.wareki}</span>
      <span class="youbi${day.youbi === "土" ? " youbi-sat" : day.youbi === "日" ? " youbi-sun" : ""}">${day.youbi}</span>
      <span class="colon">：</span>
    </span>
    <span class="work-line">
      ${day.current ? PLAY : ""}
      <span class="${workClass}">${day.work}</span>
    </span>
  </div>`;
}

function row(days) {
  return `
  <div class="row">
    ${days.map((day) => item(day) + FLOW).join("")}
  </div>`;
}

function renderBanner(_id, options = {}) {
  const solo = Number.isInteger(options.day) ? DAYS[options.day] : null;
  const extra = [];
  if (options.pause) extra.push("pause");
  if (solo) extra.push("solo");
  const days = solo ? [solo] : DAYS;
  const loop = !solo && options.loop !== false;
  return `
  <div class="banner ${extra.join(" ")}">
    <div class="track">
      ${row(days)}
      ${loop ? row(days) : ""}
    </div>
  </div>`;
}
