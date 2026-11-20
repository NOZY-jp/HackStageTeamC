# VC の UI 仕様（DM 通話・サーバー VC）

**状態: HackStage が 2026-11-20 夜に実装へ直接依頼済み（新規ブランチ・新規PR・マージ禁止）。PM は二重に割り当てない。この文書は受け入れ条件の正本として使う。**

## 1. 対象ファイル

- `app/(discord-like)/_components/voice-channel-view.tsx`（サーバー VC）
- `app/(discord-like)/_components/voice-context.tsx`（接続状態）
- `components/discord-like/*`（既存の部品。新規はここに足す）
- DM の通話画面（`dm` 配下の通話ビュー。現状は簡素）

## 2. 必須要件

1. **操作系 UI はホバー時だけ表示**し、外すと消える（対象: 参加者タイル上のメニュー、ミュート/ deafen /画面共有/退出、参加者一覧トグル、招待）
2. **マウスが乗っていないときは映像・アバターを隠さない**。タイルのサイズも動かさない（**レイアウト非移動**）
3. 操作系は `opacity` + `pointer-events` で出し入れし、`visibility` 切替で `transition` を殺さない
4. **キーボード操作で消えない**: `:focus-within` でも表示を維持（`tabindex` で操作系に入れる）
5. `prefers-reduced-motion` では transition を切る
6. タッチ端末（hover 不可）では**常時表示**にフォールバック（`@media (hover: hover)` で囲む）

## 3. 見た目の改善（DM 通話）

- 相手のアバターを大きく中央に、発話中は**リング/波形**で示す。自分の映像は右下の小窓
- 通話時間を `VoiceSession.startedAt` から算出して表示（`mm:ss`）
- 下部に**フローティングのコントロールバー**（ミュート/スピーカー/画面共有/終了）。バーはホバーで表示
- 不在着信・通話終了は**履歴カード**（「◯分」「不在着信」）として会話ログに出す

## 4. 見た目の改善（サーバー VC）

- 参加者を**グリッドのタイル**に（人数で 1/2/4/6 列）。アバター＋表示名＋ミュート/スピーカーアイコン
- 発話中は枠の色と軽いパルス（`prefers-reduced-motion` で停止）
- 画面共有中はメイン領域を大きく、参加者は右側の縦並びへ
- チャンネル名・人数・接続状態を上部に固定。退出ボタンは下部のバー
- 空のとき（誰もいない）は「まだ誰もいません」＋参加ボタン

## 5. 受け入れ条件（QA が見る形）

- ホバーを外した状態で、操作系の要素が `opacity: 0` かつ `pointer-events: none`、**タイルの矩形が変わらない**（スクショ比較・DOM の `getBoundingClientRect` で検証）
- `focus-within` で操作系が見えたまま
- サーバー VC と DM 通話の**両方**で同じ挙動
- 型・lint・build・テストが green。既存の `/dm`・`/channels` のルーティングを壊さない
- **Vercel のプレビューは使えない**（Hobby のデプロイ上限）。検証は `npm run build` + `next start` のローカル実測＋スクショ

## 6. 禁止

- データ（`lib/discord-like/data/*`）の変更を混ぜない（会話データの Issue と分ける）
- レイアウトの大幅な作り直し（`app-shell` / サイドバー）まで広げない。VC 画面の中に閉じる

## 7. 残る作業（PM 側）

- 動作確認用のスクショを `docs/screenshots/` に置くかは人が決める（現在 `docs/screenshots` あり）
- 会話データ側で `VoiceSession` を入れる Issue（**#129**）と**同じPRに混ぜない**
