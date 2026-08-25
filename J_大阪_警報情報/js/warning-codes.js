/**
 * 気象庁 令和8年体系（警戒レベル対応）
 * 河川氾濫・大雨・土砂災害・高潮は名称に「レベル」を付記
 */
export const WARNING_CODES = {
  /* 河川氾濫（指定河川洪水予報／水位周知） */
  "51": { name: "レベル５氾濫特別警報", category: "特別警報", level: 5, short: "氾濫特別", hazard: "河川氾濫" },
  "53": { name: "レベル５氾濫特別警報", category: "特別警報", level: 5, short: "氾濫特別", hazard: "河川氾濫" },
  "40": { name: "レベル４氾濫危険警報", category: "危険警報", level: 4, short: "氾濫危険", hazard: "河川氾濫" },
  "41": { name: "レベル４氾濫危険警報", category: "危険警報", level: 4, short: "氾濫危険", hazard: "河川氾濫" },
  "30": { name: "レベル３氾濫警報", category: "警報", level: 3, short: "氾濫警報", hazard: "河川氾濫" },
  "31": { name: "レベル３氾濫警報", category: "警報", level: 3, short: "氾濫警報", hazard: "河川氾濫" },
  "04": { name: "レベル３氾濫警報", category: "警報", level: 3, short: "氾濫警報", hazard: "河川氾濫" },
  "18": { name: "レベル２氾濫注意報", category: "注意報", level: 2, short: "氾濫注意", hazard: "河川氾濫" },

  /* 大雨 */
  "33": { name: "レベル５大雨特別警報", category: "特別警報", level: 5, short: "大雨特別", hazard: "大雨" },
  "43": { name: "レベル４大雨危険警報", category: "危険警報", level: 4, short: "大雨危険", hazard: "大雨" },
  "03": { name: "レベル３大雨警報", category: "警報", level: 3, short: "大雨警報", hazard: "大雨" },
  "10": { name: "レベル２大雨注意報", category: "注意報", level: 2, short: "大雨注意", hazard: "大雨" },

  /* 土砂災害 */
  "39": { name: "レベル５土砂災害特別警報", category: "特別警報", level: 5, short: "土砂特別", hazard: "土砂災害" },
  "49": { name: "レベル４土砂災害危険警報", category: "危険警報", level: 4, short: "土砂危険", hazard: "土砂災害" },
  "09": { name: "レベル３土砂災害警報", category: "警報", level: 3, short: "土砂警報", hazard: "土砂災害" },
  "29": { name: "レベル２土砂災害注意報", category: "注意報", level: 2, short: "土砂注意", hazard: "土砂災害" },

  /* 高潮 */
  "38": { name: "レベル５高潮特別警報", category: "特別警報", level: 5, short: "高潮特別", hazard: "高潮" },
  "48": { name: "レベル４高潮危険警報", category: "危険警報", level: 4, short: "高潮危険", hazard: "高潮" },
  "08": { name: "レベル３高潮警報", category: "警報", level: 3, short: "高潮警報", hazard: "高潮" },
  "19": { name: "レベル２高潮注意報", category: "注意報", level: 2, short: "高潮注意", hazard: "高潮" },

  /* その他（レベル付記なし） */
  "32": { name: "暴風雪特別警報", category: "特別警報", level: 5, short: "暴風雪特", hazard: "暴風雪" },
  "02": { name: "暴風雪警報", category: "警報", level: 3, short: "暴風雪警", hazard: "暴風雪" },
  "13": { name: "風雪注意報", category: "注意報", level: 2, short: "風雪注意", hazard: "風雪" },
  "35": { name: "暴風特別警報", category: "特別警報", level: 5, short: "暴風特別", hazard: "暴風" },
  "05": { name: "暴風警報", category: "警報", level: 3, short: "暴風警報", hazard: "暴風" },
  "15": { name: "強風注意報", category: "注意報", level: 2, short: "強風注意", hazard: "強風" },
  "36": { name: "大雪特別警報", category: "特別警報", level: 5, short: "大雪特別", hazard: "大雪" },
  "06": { name: "大雪警報", category: "警報", level: 3, short: "大雪警報", hazard: "大雪" },
  "12": { name: "大雪注意報", category: "注意報", level: 2, short: "大雪注意", hazard: "大雪" },
  "37": { name: "波浪特別警報", category: "特別警報", level: 5, short: "波浪特別", hazard: "波浪" },
  "07": { name: "波浪警報", category: "警報", level: 3, short: "波浪警報", hazard: "波浪" },
  "16": { name: "波浪注意報", category: "注意報", level: 2, short: "波浪注意", hazard: "波浪" },
  "14": { name: "雷注意報", category: "注意報", level: 2, short: "雷注意報", hazard: "雷" },
  "17": { name: "融雪注意報", category: "注意報", level: 2, short: "融雪注意", hazard: "融雪" },
  "20": { name: "濃霧注意報", category: "注意報", level: 2, short: "濃霧注意", hazard: "濃霧" },
  "21": { name: "乾燥注意報", category: "注意報", level: 2, short: "乾燥注意", hazard: "乾燥" },
  "22": { name: "なだれ注意報", category: "注意報", level: 2, short: "なだれ", hazard: "なだれ" },
  "23": { name: "低温注意報", category: "注意報", level: 2, short: "低温注意", hazard: "低温" },
  "24": { name: "霜注意報", category: "注意報", level: 2, short: "霜注意報", hazard: "霜" },
  "25": { name: "着氷注意報", category: "注意報", level: 2, short: "着氷注意", hazard: "着氷" },
  "26": { name: "着雪注意報", category: "注意報", level: 2, short: "着雪注意", hazard: "着雪" },
  "27": { name: "その他の注意報", category: "注意報", level: 2, short: "その他", hazard: "その他" },
};

/** 避難情報（警戒レベル）に対応する行動目安 */
export const EVAC_BY_LEVEL = {
  5: { label: "緊急安全確保", action: "命の危険　直ちに安全確保" },
  4: { label: "避難指示", action: "危険な場所から全員避難" },
  3: { label: "高齢者等避難", action: "避難に時間を要する人は早めに避難" },
  2: { label: "注意喚起", action: "避難行動を確認" },
  1: { label: "早期注意情報", action: "災害への心構えを高める" },
};

export function resolveWarning(code) {
  const normalized = String(code).padStart(2, "0");
  return (
    WARNING_CODES[normalized] ||
    WARNING_CODES[code] || {
      name: `気象情報(${code})`,
      category: "注意報",
      level: 2,
      short: "気象情報",
      hazard: "気象",
    }
  );
}

/** 警戒レベルに応じた表示テーマ */
export function themeForLevel(level) {
  if (level >= 5) return "special";
  if (level >= 4) return "danger";
  if (level >= 3) return "warning";
  if (level >= 2) return "advisory";
  return "idle";
}

export function evacForLevel(level) {
  return EVAC_BY_LEVEL[level] || EVAC_BY_LEVEL[1];
}
