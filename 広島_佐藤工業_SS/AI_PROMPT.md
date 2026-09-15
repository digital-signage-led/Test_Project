# 佐藤工業 WBGTサイネージ — AI向け作業プロンプト

以下を前提として作業してください。勝手に範囲を広げず、指示された箇所だけ直してください。

---

## プロジェクト

- 場所（作業ルート）: `広島_佐藤工業_SS/`（ローカル開発用。ここに全部ある）
- 本番表示: GitHub Pages（リポジトリ `digital-signage-led/wbgt-cube`）
- 本番の最上位フォルダ名は必ず **`広島_佐藤工業_SS`**（ローマ字の `hiroshima_sato_kogyo` は使わない）

---

## GitHub に上げる形（重要）

作業ルートの直下に、**同名の本番用サブフォルダ** `広島_佐藤工業_SS/` を置く（**削除しない**）。  
編集は作業ルート直下の HTML。デプロイ前に `deploy-github.bat` がパッケージへコピーする。

```
広島_佐藤工業_SS/                    ← 作業ルート（開発・編集）
  index-5face.html / index-4face.html
  assets/ data/ config/ scripts/ …
  └─ 広島_佐藤工業_SS/              ← GitHub / Pages 用パッケージ（残す）
        index-5face.html
        index-4face.html
        package.json
        assets/
          signage-news.js
          sato_kogyo_logo_*.png
        data/news.json
        config/news.config.json
        scripts/fetch-homepage-news.mjs
```

### 上げてよいもの
- 上記パッケージ内のファイル
- Actions用: 作業ルートの `github/workflows/update-hiroshima-sato-news.yml`  
  → リポジトリ直下の `.github/workflows/` に置く（パッケージの中ではない）

### 上げてはいけないもの
- `node_modules/`
- 作業ルートの開発用一式を丸ごと
- `scripts/signage-server.mjs` / `news-watch.mjs`（ローカル用）
- 参考画像・不要スクリプト・巨大フォルダ

### アップロード手順
- 原則 `deploy-github.bat` を使う（パッケージ `広島_佐藤工業_SS\` を更新 → `wbgt-cube/広島_佐藤工業_SS/` へ copy → push）
- 手動コピーする場合も、フォルダ名と中身は上記どおりにする
- **GitHub 用の同名サブフォルダ `広島_佐藤工業_SS/` は削除しない**

### 本番URL（5面）
`https://digital-signage-led.github.io/wbgt-cube/広島_佐藤工業_SS/index-5face.html?native640=1`

---

## ニュース自動更新（本番）

- ローカルの `:3002` プレビューだけでは、GitHub Actions の更新は効かない（別物）
- 本番: Actions が約30分ごとに公式サイトを取得 → `広島_佐藤工業_SS/data/news.json` を更新
- 画面は最新 **3件** を NEWS シーンで流す
- 公式: https://www.satokogyo.co.jp/ ／ 新着: https://www.satokogyo.co.jp/news/

---

## 再生順（フルループ）

1. 時刻＋WBGT下帯  
2. 気象観測＋末尾紋章  
3. ブランド面（正立→揃え→転がる → 直後に次へ）  
4. WBGT表示  
5. 4日予報  
6. NEWS（最新3件）  
7. 作業工程表（週間・右→左スクロール。単体確認は `?only=kotei`）  
8. 横長ロゴ（上下黒帯。帯だけ出現／ロゴは縮小しない）  
9. 多言語WBGT  
10.（あれば）熱中症アラート → 大雨警報 → 1へ  

シーン切替は右→左スライド。5面の右端ロゴ回転は**時計回り**（スライド512pxで1回転）。

---

## 修正の仕方

- **ピンポイント**: 指定されたコンテンツ・タイミングだけ変更する  
- 例: 「ブランド面の転がった直後だけ」→ 他のホールドや90°揃えは触らない  
- 横長ロゴの黒帯: 帯のみ出し入れ。帯ONで文字・ロゴを小さくしない  
- 4面・5面の両方がある変更は、原則どちらも直す  

---

## いま頼みたいこと

（ここに具体的な指示を書く）
