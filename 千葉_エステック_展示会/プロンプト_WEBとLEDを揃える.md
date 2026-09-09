# プロンプト：WEBプレビューとキューブLEDを同じ見た目・同じタイミングにする

次をそのまま新しいチャットに貼る。必要なら末尾に「今回の症状」を追記する。

---

## 依頼

千葉_エステック_展示会 の `index.html`（本番 640×128、5面＝本文512＋右端ロゴ128）について、**Webブラウザで見ているものとキューブ型LEDサイネージで見ているものを一致**させてください。デザインを新しく作らない。WEBで正しいなら、サイネージ側の描画・切替・計測をWEBに合わせる。

推測で終わらせない。コードを読んで原因を特定し、修正し、変更ファイルを列挙する。

## この案件で既に分かっている原因（先に疑う）

1. **シーン横スライド（450ms）**  
   1枚の640×128をハードが5面に切る。スライド中は左面に旧シーン・右面に新シーンが出る。ブラウザは1画面なので気づきにくい。LEDでは面ごとに色・内容が違う。  
   → LED（native-640）ではシーン切替を瞬間切替（スライド0）にする。PCの大きなプレビュー窓だけスライド可。

2. **中段黒縁 `-webkit-text-stroke: 3px`**  
   Chromeは `paint-order: stroke fill` で白字＋黒縁。LEDのWebViewは同じ3pxがドットで太く潰れる。  
   → **見た目用にWEBとLEDで別CSSを足さない。** 差が出るなら、両方同じ指定のままLEDで潰れる理由（二重縁、text-shadow併用、拡大、paint-order非対応）を潰す。サイネージ専用の細い縁にするとWEBとまた分かれる。

3. **ループ幅の計測**  
   クローンを `document.body` に置くと `#sceneWarnHero` 配下のCSSが当たらず、実寸より狭く測って文字が重なる。  
   → 計測は `#sceneWarnHero` 内のプローブ、または canvas `measureText`（Noto Sans JP 900 36px＋letter-spacing＋縁の余白）。`getBoundingClientRect` はCSS scaleの影響を受けるので使わない。

4. **viewport / 拡大**  
   窓が1800×360などだと「PCプレビュー」扱いで `transform: scale` がかかり、640用の3px縁が実機で太くなる。  
   → 高さ400px以下の横長は native-640（倍率100%、scaleなし）。大きなPC窓だけプレビュー拡大。コントローラが1800×360のときだけ `?out=1800`。

5. **LED非対応CSS**  
   `display:grid`、`mix-blend-mode: multiply`、`inset`、Googleフォント待ち、`will-change: transform`、`performance.now()` が進まない、rAFのdt=0。  
   → 3段は flex 列。ロゴは mix-blend しない。スクロールdtは `Date.now()`。背景は不透明色を明示。

## やってはいけないこと

- **「WEBでは出ていません」は禁止。** サイネージに出る差は、ブラウザで見えなくても直す。あってはならない。
- 白3段（`.hero.is-white` / `white-hero.css`）と色3段（`#sceneWarnHero`）を混ぜない。
- 解像度を勝手に1800×360に戻さない（明示の `?out=1800` 以外）。
- WEB用とLED用で中段の縁・フォント・字サイズを分岐しない（「LEDだけ細く」は禁止）。
- `paint-order` に頼らない。LEDは無視して縁が前に出る。縁は背面レイヤ、字は前面レイヤ。
- `replaceChildren`、`element.append(a,b)`、optional chainingなど古いWebViewが落ちる書き方を足さない。
- コミットしない。依頼がなければ git しない。

## 調査手順

1. WEB（localhost の大きな窓）とLED（native-640、640×128）で同じシーン（色3段デモ `?preview=demo`）を比較する想定でCSS/JSを読む。
2. `#sceneWarnHero .mid-chip` の stroke / shadow / font / transform が `html.native-640` で上書きされていないか。
3. `transitionToScene` の `SCENE_SLIDE_MS`。native で0か。
4. `prepareTrack` / `measureProbe` / `measureMidWidth`。body直下クローンになっていないか。
5. 先頭スクリプトの native 判定。`innerWidth > 660` だけでプレビュー拡大していないか。
6. `@media (min-width: 641px)` がLED窓で scale していないか。
7. 修正後、WEBプレビューの見た目は維持したまま、LED用分岐を増やしていないことを確認する。

## 完了条件

- ブラウザとサイネージで、色3段のフォント・黒縁・帯色・文字間隔が同じ指定である。
- キューブの上面・正面・側面が、切替瞬間に同じシーン・同じ背景色である。
- 中段の繰り返しが重ならない（シームレス）。
- 変更ファイルと、残った制約（ハードのドットピッチなどコードで消えない差）を短く報告する。

---

## 今回の症状（任意・追記欄）

- （例）縁がWEBより太い / 面ごとに色が違う / 文字が重なる / 正面だけ暗い
- （例）確認URL: `http://127.0.0.1:xxxx/index.html?preview=demo`
- （例）LED入力解像度: 640×128 / 1800×360 / 不明
