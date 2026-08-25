export const CONFIG = {
  /** 大阪府（府県予報区） */
  areaCode: "270000",
  areaLabel: "大阪府",
  /** サイネージ上の地域表示 */
  displayArea: "大阪",
  /** 警報ポーリング間隔（ミリ秒） */
  pollIntervalMs: 60_000,
  /** デモ（?demo=1） / ライブのみ（?live=1） */
  demoQuery: "demo",
  /** 既定: リアル＋デモを合流して流す */
  mixLiveAndDemoByDefault: true,
  /** サイネージ: 物理ピクセル640×192に合わせる */
  signagePixelLock: true,
  /** 発表中として扱う status */
  activeStatuses: new Set(["発表", "継続", "警報から注意報", "注意報から警報"]),
  /** 流れ文字の速さ（px/秒） */
  marqueeSpeedPxPerSec: 78,
};
