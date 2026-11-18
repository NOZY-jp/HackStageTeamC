# HackStageTeamC

Next.js (App Router) + TypeScript + Tailwind CSS のチーム開発リポジトリ。Lint/Format は Biome に一本化し、ESLint は使わない。

## セットアップ

Node.js 24（Krypton LTS）以上を使う（`.nvmrc` に `24`）。

```bash
npm ci
npm run dev   # http://localhost:3000
```

## スクリプト

| コマンド         | 内容                             |
| ---------------- | -------------------------------- |
| `npm run dev`    | 開発サーバー起動                 |
| `npm run build`  | 本番ビルド                       |
| `npm run start`  | ビルド済みアプリの起動           |
| `npm run lint`   | Biome でチェック（書き換えなし） |
| `npm run format` | Biome でフォーマット             |
| `npm run check`  | Biome でチェック＋自動修正       |

## CI

`.github/workflows/ci.yml` が `main` への push と `main` 向け PR で `npm ci` → `biome ci .` → `npm run build` を実行する。チェック名は `ci`。

## ボイスチャンネル（疑似）

ボイスチャンネルの参加・退出は UI だけの疑似実装で、**参加しても音は出ない**（実音声・マイク権限・WebRTC は使わない）。

## 構成

- `app/` … App Router のルート。`app/(discord-like)/` に Discord like UI の画面を置く（route group なので URL は `/dm` などのまま）。`app/(note-like)/` が Note like UI の画面（URL は `/note` 配下）
- `components/` … 画面横断の UI 部品。`components/discord-like/` が Discord like UI 用、`components/note-like/` が Note like UI 用
- `lib/` … ドメイン型とデータ。`lib/discord-like/` が Discord like UI 用、`lib/note-like/` が Note like UI 用
- `public/note-like/` … Note like UI の仮画像（見出し画像・アバター・本文用）。一覧は `public/note-like/README.md`
- `app/globals.css` … デザイントークンとレイアウトの共通テーマ（唯一の正本）
- `biome.json` … Biome 設定（`.next` / `node_modules` / `out` は除外）

## Note like UI（leaf）

`/note` 配下の、作中の架空ブログサービス。トップ（新着）・クリエイター・記事・検索の4画面。

- 動くのは検索（タイトル・要約・本文・タグ・書き手の名前とID）、タグからの検索、スキ（押した状態は保存しない）だけ。ログインや投稿は作っていない
- ライトテーマ。配色は `app/globals.css` の `.note-shell` の中だけで定義する
- 記事は `lib/note-like/data/articles.ts`、書き手は `lib/note-like/data/creators.ts`。記事はまだ空で、脚本が固まってから入れる

## ファイル配置（Discord like UI と新プラットフォーム）

Discord like UI は次の 3 つの名前空間にまとめている。名前だけで用途が分かるようにするための置き場で、機能ごとの分割ではない。

| 名前空間                   | 役割                                                                                        |
| -------------------------- | ------------------------------------------------------------------------------------------- |
| `app/(discord-like)/`      | 画面（ページ・レイアウト・その画面専用の `_components`）。route group なので URL は変えない |
| `components/discord-like/` | 画面をまたいで使う UI 部品                                                                  |
| `lib/discord-like/`        | ドメイン型（`types.ts`）・モックデータ（`index.ts` / `data/`）                              |

共通テーマは `app/globals.css` を正本として 1 か所に置く（CSS の分割はしない）。デザイントークン（色・余白・角丸・モーション）と 3 ペインの骨格はここだけで定義する。

別のプラットフォームを足すときは、同じ形で名前空間を分ける。

- 画面: `app/(<platform>)/`（route group。URL の接頭辞はルーティング側で扱う）
- 部品: `components/<platform>/`
- 複数プラットフォームで共有する部品: `components/common/`（共有するものが出た時点で作る）
- 型・データ: `lib/<platform>/`

Discord like UI のファイルから他プラットフォームの名前空間を import しない（逆向きも同じ）。共通化は `components/common/` と `app/globals.css` を経由する。
