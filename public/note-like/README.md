# Note風UI（leaf）の画像素材

仮の素材。すべて SVG の平塗りイラストで、差し替え前提。データからは `/note-like/...` のパスで参照する。

| 置き場     | 用途             | サイズ             | 指定する場所                     |
| ---------- | ---------------- | ------------------ | -------------------------------- |
| `covers/`  | 記事の見出し画像 | 1280×670（1.91:1） | `Article.cover`                  |
| `avatars/` | 書き手のアイコン | 256×256            | `Creator.avatar`                 |
| `photos/`  | 本文中の画像     | 1200×800 ほか      | 本文ブロック `{ kind: "image" }` |

- `covers/`: `blue` `closet` `coffee` `controller` `desk-lamp` `headset` `moon-castle` `moving-boxes` `night-room` `notes` `snowfield` `station` `talk`
- `avatars/`: `shiro`（彼女の高校生のころのアカウント）`kanade` `yakusou`、未設定用の `default`
- `photos/`: `game-screen` `meeting-spot` `cafe-counter`、寸法だけ入った仮置き `placeholder-wide` `placeholder-square` `placeholder-tall`

見出し画像とアバターは省略できる（見出し画像なしの記事、頭文字のアバターになる）。
写真や PNG に差し替えるときは、同じ縦横比にすればレイアウトは変わらない。
