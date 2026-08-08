/**
 * 気象庁 令和8年体系 警報・注意報コード
 * - level: 表示優先度（並び替え・画面色用）
 * - keikaiLevel: 公式の警戒レベル（該当するもののみ。波浪・暴風・雷などは null）
 */
export const WARNING_CODES = {
  "33": { name: "大雨特別警報", category: "特別警報", level: 5, keikaiLevel: 5, short: "大雨特別" },
  "43": { name: "大雨危険警報", category: "危険警報", level: 4, keikaiLevel: 4, short: "大雨危険" },
  "03": { name: "大雨警報", category: "警報", level: 3, keikaiLevel: 3, short: "大雨警報" },
  "10": { name: "大雨注意報", category: "注意報", level: 2, keikaiLevel: 2, short: "大雨注意" },
  "39": { name: "土砂災害特別警報", category: "特別警報", level: 5, keikaiLevel: 5, short: "土砂特別" },
  "49": { name: "土砂災害危険警報", category: "危険警報", level: 4, keikaiLevel: 4, short: "土砂危険" },
  "09": { name: "土砂災害警報", category: "警報", level: 3, keikaiLevel: 3, short: "土砂警報" },
  "29": { name: "土砂災害注意報", category: "注意報", level: 2, keikaiLevel: 2, short: "土砂注意" },
  "38": { name: "高潮特別警報", category: "特別警報", level: 5, keikaiLevel: 5, short: "高潮特別" },
  "48": { name: "高潮危険警報", category: "危険警報", level: 4, keikaiLevel: 4, short: "高潮危険" },
  "08": { name: "高潮警報", category: "警報", level: 3, keikaiLevel: 3, short: "高潮警報" },
  "19": { name: "高潮注意報", category: "注意報", level: 2, keikaiLevel: 2, short: "高潮注意" },
  "32": { name: "暴風雪特別警報", category: "特別警報", level: 5, keikaiLevel: null, short: "暴風雪特" },
  "02": { name: "暴風雪警報", category: "警報", level: 3, keikaiLevel: null, short: "暴風雪警" },
  "13": { name: "風雪注意報", category: "注意報", level: 2, keikaiLevel: null, short: "風雪注意" },
  "35": { name: "暴風特別警報", category: "特別警報", level: 5, keikaiLevel: null, short: "暴風特別" },
  "05": { name: "暴風警報", category: "警報", level: 3, keikaiLevel: null, short: "暴風警報" },
  "15": { name: "強風注意報", category: "注意報", level: 2, keikaiLevel: null, short: "強風注意" },
  "36": { name: "大雪特別警報", category: "特別警報", level: 5, keikaiLevel: null, short: "大雪特別" },
  "06": { name: "大雪警報", category: "警報", level: 3, keikaiLevel: null, short: "大雪警報" },
  "12": { name: "大雪注意報", category: "注意報", level: 2, keikaiLevel: null, short: "大雪注意" },
  "37": { name: "波浪特別警報", category: "特別警報", level: 5, keikaiLevel: null, short: "波浪特別" },
  "07": { name: "波浪警報", category: "警報", level: 3, keikaiLevel: null, short: "波浪警報" },
  "16": { name: "波浪注意報", category: "注意報", level: 2, keikaiLevel: null, short: "波浪注意" },
  "14": { name: "雷注意報", category: "注意報", level: 2, keikaiLevel: null, short: "雷注意報" },
  "17": { name: "融雪注意報", category: "注意報", level: 2, keikaiLevel: null, short: "融雪注意" },
  "20": { name: "濃霧注意報", category: "注意報", level: 2, keikaiLevel: null, short: "濃霧注意" },
  "21": { name: "乾燥注意報", category: "注意報", level: 2, keikaiLevel: null, short: "乾燥注意" },
  "22": { name: "なだれ注意報", category: "注意報", level: 2, keikaiLevel: null, short: "なだれ" },
  "23": { name: "低温注意報", category: "注意報", level: 2, keikaiLevel: null, short: "低温注意" },
  "24": { name: "霜注意報", category: "注意報", level: 2, keikaiLevel: null, short: "霜注意報" },
  "25": { name: "着氷注意報", category: "注意報", level: 2, keikaiLevel: null, short: "着氷注意" },
  "26": { name: "着雪注意報", category: "注意報", level: 2, keikaiLevel: null, short: "着雪注意" },
  "27": { name: "その他の注意報", category: "注意報", level: 2, keikaiLevel: null, short: "その他" },
};

export function resolveWarning(code) {
  const normalized = String(code).padStart(2, "0");
  return (
    WARNING_CODES[normalized] ||
    WARNING_CODES[code] || {
      name: `気象情報(${code})`,
      category: "注意報",
      level: 2,
      keikaiLevel: null,
      short: "気象情報",
    }
  );
}

/** 重要度に応じた表示テーマ（画面色用） */
export function themeForLevel(level) {
  if (level >= 5) return "special";
  if (level >= 4) return "danger";
  if (level >= 3) return "warning";
  return "advisory";
}
