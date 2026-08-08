import { CONFIG } from "./config.js";
import { resolveWarning, themeForLevel } from "./warning-codes.js";

/**
 * 令和8年体系 r8 JSON から発表中の警報・注意報を抽出する
 * @param {unknown} payload
 * @param {Map<string, string>} areaNames
 */
export function parseActiveWarnings(payload, areaNames = new Map()) {
  if (!Array.isArray(payload)) {
    return { items: [], headline: "", reportDatetime: "", publishingOffice: "" };
  }

  /** @type {Map<string, { code: string, name: string, category: string, level: number, short: string, areas: Set<string>, status: string }>} */
  const byCode = new Map();
  let headline = "";
  let reportDatetime = "";
  let publishingOffice = "";

  for (const entry of payload) {
    if (!entry || typeof entry !== "object") continue;
    const warning = entry.warning;
    if (!warning) continue;

    if (entry.headlineText) headline = entry.headlineText;
    if (entry.reportDatetime) reportDatetime = entry.reportDatetime;
    if (entry.publishingOffice) publishingOffice = entry.publishingOffice;

    const class20 = Array.isArray(warning.class20Items) ? warning.class20Items : [];
    const class10 = Array.isArray(warning.class10Items) ? warning.class10Items : [];
    const areas = class20.length ? class20 : class10;

    for (const area of areas) {
      const areaCode = String(area.areaCode || "");
      if (
        CONFIG.targetAreaCodes?.size &&
        !CONFIG.targetAreaCodes.has(areaCode)
      ) {
        continue;
      }
      const areaName = areaNames.get(areaCode) || areaCode;
      const kinds = Array.isArray(area.kinds) ? area.kinds : [];

      for (const kind of kinds) {
        if (!kind || !kind.code) continue;
        if (!CONFIG.activeStatuses.has(kind.status)) continue;

        const meta = resolveWarning(kind.code);
        const key = String(kind.code).padStart(2, "0");
        if (!byCode.has(key)) {
          byCode.set(key, {
            code: key,
            name: meta.name,
            category: meta.category,
            level: meta.level,
            keikaiLevel: meta.keikaiLevel ?? null,
            short: meta.short,
            areas: new Set(),
            status: kind.status,
          });
        }
        const item = byCode.get(key);
        item.areas.add(areaName);
        // より新しい status を優先（発表 > 継続）
        if (kind.status === "発表") item.status = kind.status;
      }
    }
  }

  const items = [...byCode.values()]
    .map((item) => ({
      ...item,
      areas: [...item.areas],
      theme: themeForLevel(item.level),
    }))
    .sort((a, b) => b.level - a.level || a.name.localeCompare(b.name, "ja"));

  return { items, headline, reportDatetime, publishingOffice };
}

const JMA_WARNING_URL = (code) =>
  `https://www.jma.go.jp/bosai/warning/data/r8/${encodeURIComponent(code)}.json`;
const JMA_AREA_URL = "https://www.jma.go.jp/bosai/common/const/area.json";

async function fetchJson(urls) {
  let lastError = null;
  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status}`);
        continue;
      }
      return await res.json();
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error("データ取得失敗");
}

function buildAreaNameMap(data) {
  const map = new Map();
  for (const group of ["class20s", "class10s", "offices"]) {
    for (const [code, info] of Object.entries(data?.[group] || {})) {
      if (info?.name) map.set(code, info.name);
    }
  }
  return map;
}

export async function fetchWarningData(areaCode = CONFIG.areaCode) {
  try {
    return await fetchJson([
      `/api/warning?code=${encodeURIComponent(areaCode)}`,
      JMA_WARNING_URL(areaCode),
    ]);
  } catch {
    throw new Error("警報データ取得失敗");
  }
}

export async function fetchAreaNames() {
  try {
    const data = await fetchJson(["/api/area", JMA_AREA_URL]);
    return buildAreaNameMap(data);
  } catch {
    return new Map();
  }
}

/**
 * 流れ文字用メッセージを組み立てる
 * @param {{ items: any[], headline: string, publishingOffice: string }} state
 */
export function buildMarqueeText(state) {
  if (!state.items.length) return "";

  const parts = state.items.map((item) => {
    const areaText =
      item.areas.length <= 3
        ? item.areas.join("・")
        : `${item.areas.slice(0, 3).join("・")}ほか${item.areas.length - 3}地域`;
    return `<span class="tag">【${item.category}】</span>${item.name}（${areaText}）`;
  });

  const head = state.headline
    ? `<span class="tag">【気象情報】</span>${state.headline}　`
    : `<span class="tag">【気象情報】</span>警報・注意報が発表されています　`;
  const office = state.publishingOffice ? `　出典：${state.publishingOffice}` : "";
  return `${head}${parts.join("　　／　　")}　　気象情報にご注意ください${office}　　`;
}

/** デモ用 */
export function buildDemoWarnings() {
  return {
    items: [
      {
        code: "48",
        name: "高潮危険警報",
        category: "危険警報",
        level: 4,
        keikaiLevel: 4,
        short: "高潮危険",
        areas: ["久米島町"],
        status: "発表",
        theme: "danger",
      },
      {
        code: "05",
        name: "暴風警報",
        category: "警報",
        level: 3,
        keikaiLevel: null,
        short: "暴風警報",
        areas: ["久米島"],
        status: "継続",
        theme: "warning",
      },
      {
        code: "07",
        name: "波浪警報",
        category: "警報",
        level: 3,
        keikaiLevel: null,
        short: "波浪警報",
        areas: ["久米島町"],
        status: "発表",
        theme: "warning",
      },
      {
        code: "14",
        name: "雷注意報",
        category: "注意報",
        level: 2,
        keikaiLevel: null,
        short: "雷注意報",
        areas: ["久米島"],
        status: "継続",
        theme: "advisory",
      },
    ],
    headline: "久米島では、高潮や暴風、高波に警戒してください。",
    reportDatetime: new Date().toISOString(),
    publishingOffice: "沖縄気象台（デモ）",
  };
}
