# ホームページ → サイネージ ニュース自動更新

公式サイト: [https://www.satokogyo.co.jp/](https://www.satokogyo.co.jp/)  
新着一覧: [https://www.satokogyo.co.jp/news/](https://www.satokogyo.co.jp/news/)

サイネージは最新 **3件** を NEWS シーンで流します。ホームページ側が更新されると、以下の自動化で `data/news.json` が更新されます。

GitHub Pages 上の配置フォルダ名: **`広島_佐藤工業_SS`**

---

## 本番の前提（GitHub Pages + Actions）※推奨

表示URL（例・5面）:

https://digital-signage-led.github.io/wbgt-cube/広島_佐藤工業_SS/index-5face.html?native640=1

### 仕組み

1. **GitHub Actions**（約30分ごと）が公式サイトから新着を取得  
2. 内容が変わったときだけ `広島_佐藤工業_SS/data/news.json` をコミット  
3. **GitHub Pages** が静的配信  
4. サイネージ画面が起動時・約10分ごと・NEWS開始時に、`/api/news`・Pages・同梱 JSON を並列取得し、**fetchedAt が最も新しいもの**を表示  

現地PCは **ブラウザで Pages を開くだけ**（Node 不要）。ネット接続は必要です。

ローカル Live Preview のみ使う場合は、公式サイト反映のため `npm run news:watch`（または `npm run serve`）を並行起動してください。

### 初回セットアップ

1. 作業コピーを用意（未取得の場合）:

```bat
git clone https://github.com/digital-signage-led/wbgt-cube.git ..\_wbgt-cube-deploy
```

2. このフォルダで `deploy-github.bat` を実行  
   - HTML / assets / `data` / `config` / 取得スクリプト  
   - Actions 定義  
   を作業ルート内のパッケージ `広島_佐藤工業_SS/` に集め、`wbgt-cube/広島_佐藤工業_SS/` へ push します。  
   - **GitHub 用フォルダ `広島_佐藤工業_SS/` は削除しないこと**

3. GitHub の **Actions** タブで  
   `Update Hiroshima Sato Kogyo news` が動くことを確認  
   （初回は **Run workflow** で手動実行可）

4. サイネージブラウザで上記 Pages URL を全画面表示

### 手動で今すぐニュースだけ更新

- GitHub → Actions → `Update Hiroshima Sato Kogyo news` → Run workflow  
- またはローカル: `npm run news:fetch` のあと `deploy-github.bat`

---

## ローカル開発用（任意）

```bash
npm run serve
```

または:

```bash
npm run news:watch
```

---

## 設定

`config/news.config.json` … 取得先・件数  
画面側 `SIGNAGE_CONFIG.news` … `url` / `remoteUrl` / `apiUrl`

---

## 再生順

4日予報のあと → **NEWS（最新3件）** → 横長ロゴ → 多言語WBGT
