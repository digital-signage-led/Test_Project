/**
 * ホームページを定期取得して data/news.json だけ更新する（静的サーバー併用用）
 * Live Preview / 既存の :3002 はそのまま、このプロセスが裏でニュースを更新する。
 *
 * 起動: npm run news:watch
 */
import { fetchHomepageNews } from './fetch-homepage-news.mjs';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const cfg = JSON.parse(readFileSync(join(ROOT, 'config', 'news.config.json'), 'utf8'));
const minutes = Math.max(1, Number(cfg.refreshMinutes) || 10);

async function tick(reason) {
  try {
    const p = await fetchHomepageNews();
    console.log('[news:watch]', reason, p.items.length, 'items', new Date().toLocaleString('ja-JP'));
  } catch (err) {
    console.error('[news:watch]', reason, err.message || err);
  }
}

await tick('boot');
console.log('[news:watch] every', minutes, 'min — source:', cfg.homepageUrl);
setInterval(() => { tick('timer'); }, minutes * 60 * 1000);
