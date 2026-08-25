import { CONFIG } from "./config.js";
import { resolveWarning, themeForLevel, evacForLevel } from "./warning-codes.js";

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
            short: meta.short,
            hazard: meta.hazard || "",
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

export async function fetchWarningData(areaCode = CONFIG.areaCode) {
  const res = await fetch(`/api/warning?code=${encodeURIComponent(areaCode)}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`警報データ取得失敗 (${res.status})`);
  }
  return res.json();
}

export async function fetchAreaNames() {
  const res = await fetch("/api/area", { cache: "no-store" });
  if (!res.ok) return new Map();
  const data = await res.json();
  const map = new Map();

  const class20 = data?.class20s || {};
  for (const [code, info] of Object.entries(class20)) {
    if (info?.name) map.set(code, info.name);
  }
  const class10 = data?.class10s || {};
  for (const [code, info] of Object.entries(class10)) {
    if (info?.name) map.set(code, info.name);
  }
  const offices = data?.offices || {};
  for (const [code, info] of Object.entries(offices)) {
    if (info?.name) map.set(code, info.name);
  }
  return map;
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
    const evac = evacForLevel(item.level || 1);
    return `<span class="tag">【${item.category}】</span>${item.name}（${areaText}）　<span class="tag">【避難】</span>${evac.label}／${evac.action}`;
  });

  const head = state.headline
    ? `<span class="tag">【気象情報】</span>${state.headline}　`
    : `<span class="tag">【気象情報】</span>警報・注意報が発表されています　`;
  const office = state.publishingOffice ? `　出典：${state.publishingOffice}` : "";
  return `${head}${parts.join("　　／　　")}　　気象情報にご注意ください${office}　　`;
}

/** デモ用（大阪）— 河川氾濫・大雨・土砂災害・高潮＋避難レベル */
export function buildDemoWarnings() {
  return {
    items: [
      {
        code: "33",
        name: "レベル５大雨特別警報",
        category: "特別警報",
        level: 5,
        short: "大雨特別",
        hazard: "大雨",
        areas: ["大阪"],
        status: "発表",
        theme: "special",
      },
      {
        code: "51",
        name: "レベル５氾濫特別警報",
        category: "特別警報",
        level: 5,
        short: "氾濫特別",
        hazard: "河川氾濫",
        areas: ["大阪"],
        status: "発表",
        theme: "special",
      },
      {
        code: "49",
        name: "レベル４土砂災害危険警報",
        category: "危険警報",
        level: 4,
        short: "土砂危険",
        hazard: "土砂災害",
        areas: ["大阪"],
        status: "発表",
        theme: "danger",
      },
      {
        code: "48",
        name: "レベル４高潮危険警報",
        category: "危険警報",
        level: 4,
        short: "高潮危険",
        hazard: "高潮",
        areas: ["大阪"],
        status: "発表",
        theme: "danger",
      },
      {
        code: "03",
        name: "レベル３大雨警報",
        category: "警報",
        level: 3,
        short: "大雨警報",
        hazard: "大雨",
        areas: ["大阪"],
        status: "発表",
        theme: "warning",
      },
      {
        code: "14",
        name: "雷注意報",
        category: "注意報",
        level: 2,
        short: "雷注意報",
        hazard: "雷",
        areas: ["大阪"],
        status: "発表",
        theme: "advisory",
      },
    ],
    headline:
      "大阪府にレベル５大雨特別警報・レベル５氾濫特別警報が発表されています。命の危険、直ちに安全を確保してください。",
    reportDatetime: new Date().toISOString(),
    publishingOffice: "大阪管区気象台（デモ）",
  };
}

/**
 * リアル発表とデモを合流（同一コードはリアル優先）
 * @param {{ items: any[], headline?: string, reportDatetime?: string, publishingOffice?: string }} live
 * @param {{ items: any[], headline?: string, reportDatetime?: string, publishingOffice?: string }} demo
 */
export function mergeLiveAndDemo(live, demo) {
  const byCode = new Map();
  for (const item of demo.items || []) {
    byCode.set(item.code, {
      ...item,
      areas: [CONFIG.displayArea],
      source: "demo",
    });
  }
  for (const item of live.items || []) {
    byCode.set(item.code, {
      ...item,
      areas: [CONFIG.displayArea],
      source: "live",
    });
  }

  const items = [...byCode.values()].sort(
    (a, b) => b.level - a.level || a.name.localeCompare(b.name, "ja"),
  );

  const liveCount = (live.items || []).length;
  const headline =
    live.headline ||
    demo.headline ||
    (liveCount
      ? "大阪府に警報・注意報が発表されています。"
      : "【デモ表示】大阪府の警報・注意報サンプルを表示しています。");

  return {
    items,
    headline,
    reportDatetime: live.reportDatetime || demo.reportDatetime || new Date().toISOString(),
    publishingOffice: live.publishingOffice
      ? `${live.publishingOffice}${liveCount ? "" : "／デモ併記"}`
      : demo.publishingOffice || "大阪管区気象台",
  };
}
