# アラートキューブ V2.0（320共通）

開くファイルは `index.html` だけです。現場の名前・位置・ロゴは `config/site-config.js` だけ書き換えます。

```
index.html     サイネージ本体（これを開く）
sw.js          オフライン用キャッシュ
config/        現場設定（ここだけ触る）
scripts/       動き
styles/        色と文字
images/        ロゴと気象庁の天気アイコン
```

## 起動

```
npx --yes serve -l 3200
```

`http://127.0.0.1:3200/`

## 現場追加

1. `config/site-config.template.js` を `config/site-config.js` に複製
2. 社名、地域名、観測点、警報区域を入れる
3. ロゴを `images/logo.svg` に置く

## モード

- **WBGT期間中**: 環境省5段階色（青→水色→黄→橙→赤）
- **WBGT期間外**: 実気温9段階色
- **防災**: 通年監視。発表時のみ割込。解除後は保存した再生位置へ戻る
