export const CONFIG = {
  /** 気象庁JSON取得用（府県予報区：沖縄県） */
  areaCode: "471000",
  /** 画面表示名 */
  areaLabel: "久米島",
  /**
   * 抽出対象の地域コード
   * - class10: 471030 久米島
   * - class20: 4736100 久米島町
   */
  targetAreaCodes: new Set(["471030", "4736100"]),
  /** 警報ポーリング間隔（ミリ秒） */
  pollIntervalMs: 60_000,
  /** デモ（?demo=1） */
  demoQuery: "demo",
  /** 発表中として扱う status */
  activeStatuses: new Set(["発表", "継続", "警報から注意報", "注意報から警報"]),
  /** 流れ文字の速さ（px/秒） */
  marqueeSpeedPxPerSec: 78,
};
