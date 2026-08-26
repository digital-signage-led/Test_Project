export const CONFIG = {
  /** 大阪府（府県予報区） */
  areaCode: "270000",
  areaLabel: "大阪府",
  /** サイネージ上の地域表示 */
  displayArea: "大阪",
  /** 警報ポーリング間隔（ミリ秒）※ライブ固定モード用 */
  pollIntervalMs: 60_000,
  /** デモ（?demo=1） / ライブのみ（?live=1） / 地震デモ（?quake=1） */
  demoQuery: "demo",
  /**
   * 既定プレイリスト:
   * 本番（警報）10秒 → 警報デモ1周 → 地震デモ1周 → 繰り返し
   */
  playlistByDefault: true,
  /** 本番（ライブ）表示時間（ミリ秒） */
  livePhaseMs: 10_000,
  /** 警報デモ：テロップ1周。ただし上限を超えない */
  demoPhaseMaxMs: 18_000,
  /** 地震デモ：各震度シーンの表示時間（ミリ秒） */
  quakeSceneMs: 2_500,
  /** コンテンツ切替時の静止（ミリ秒） */
  phaseGapMs: 1_000,
  /** サイネージ: 物理ピクセル640×192に合わせる */
  signagePixelLock: true,
  /** 発表中として扱う status */
  activeStatuses: new Set(["発表", "継続", "警報から注意報", "注意報から警報"]),
  /** 流れ文字の速さ（px/秒） */
  marqueeSpeedPxPerSec: 78,
  /** 発表中チップは1件でも流す（発表中の情報カード内） */
  chipScrollMinCount: 1,
  /** 発表なしテロップ */
  idleMarqueeText:
    "現在、大阪府では警報・注意報は発表されていません　　気象情報をご確認ください　　",
};
