# Discord `#clips` の画像素材

モンハンコミュニティ `mhc` の `#clips` に貼られる動画サムネイル相当の画像。33点。

- 生成元: `Shared/Transfers/hackstage-images/batch3/clips/`（`clip-*.png` と同名の `.json` にプロンプト）
- 用途: `lib/discord-like/data/messages/mhc.ts` の添付（`kind: "image"`）
- パスの解決: `lib/discord-like/data/message-images.ts` の `MESSAGE_IMAGES` に1件ずつ登録する
- 画面: 文字・UIは描かない（本文やUIはHTML側で出す）。ダーク寄りのゲーム画面風

## ファイル名と寸法

- 寸法: **1200×675**（16:9）。リサイズしない
- 実体のファイル名: **`.webp`**（品質85を目安。PNGのままだと33点で40MB前後になるため）
- `MESSAGE_IMAGES` の `name` は **`.png` のまま**（`mhc.ts` の添付名と一致させる）、`src` だけ `/discord-like/clips/<name>.webp` にする
- `status` は実体を置いたものだけ `"ready"`。未着は `"pending"` のままで、`<Image>` を描かない（404を起こさない）

## 対象（33点）

`clip-0204-8` `clip-0211-1` `clip-0214-9` `clip-0312-2` `clip-0312-3` `clip-0318-4`
`clip-0418-5` `clip-0425-1` `clip-0529-6` `clip-0529-7` `clip-0602-1` `clip-0613-2`
`clip-0617-1` `clip-0617-2` `clip-0617-3` `clip-0619-3` `clip-0626-4` `clip-0715-4`
`clip-0724-5` `clip-0819-1` `clip-0820-2` `clip-0826-3` `clip-0905-1` `clip-0920-2`
`clip-0922-3` `clip-1004-4` `clip-1019-5` `clip-1025-5` `clip-1102-6` `clip-1103-6`
`clip-1109-7` `clip-1117-8` `clip-1208-7`

## 容量

`public/` に追加する画像の合計は **10MB以下**を目安にする（超える場合はWebPの品質を下げる。寸法は変えない）。
