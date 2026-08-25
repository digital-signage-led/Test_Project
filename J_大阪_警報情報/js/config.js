export const CONFIG = {
  /** 大阪府（府県予報区） */
  areaCode: "270000",
  areaLabel: "大阪府",
  /** サイネージ上の地域表示 */
  displayArea: "大阪",
  /** 警報ポーリング間隔（ミリ秒）※ライブ固定モード用 */
  pollIntervalMs: 60_000,
  /** デモ（?demo=1） / ライブのみ（?live=1） */
  demoQuery: "demo",
  /**
   * 既定プレイリスト:
   * ライブ（発表なし→約5秒 / 発表あり→テロップ1周）→ デモ1周 → 再取得して繰り返し
   */
  playlistByDefault: true,
  /** 発表なしテロップを流す時間（ミリ秒）→その後デモへ */
  idleBeforeDemoMs: 5_000,
  /** サイネージ: 物理ピクセル640×192に合わせる */
  signagePixelLock: true,
  /** 発表中として扱う status */
  activeStatuses: new Set(["発表", "継続", "警報から注意報", "注意報から警報"]),
  /** 流れ文字の速さ（px/秒） */
  marqueeSpeedPxPerSec: 78,
  /** 発表なしテロップ */
  idleMarqueeText:
    "現在、大阪府では警報・注意報は発表されていません　　気象情報をご確認ください　　",
};
