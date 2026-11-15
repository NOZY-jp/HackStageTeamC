# HackStageTeamC

Next.js (App Router) + TypeScript + Tailwind CSS のチーム開発リポジトリ。Lint/Format は Biome に一本化し、ESLint は使わない。

## 企画

- [シナリオ『お待たせ。』](docs/scenario.md) — SNSで消えた恋人と、待ち合わせのすり替えを追うARG。導入からNormal／Trueまでの脚本。
- [ARG制作資料](docs/scenario-puzzles.md) — 複数サイトの役割、投稿本文、固定URLと予約記録を使う調査、分岐。ネタバレあり。
- [改稿記録](docs/scenario-review.md) — 前稿を取り下げた理由と、新稿の会話・事件・導線を直した記録。
- [物語とエンディングの条件](docs/story-requirements.md) — 最新の必須条件。
- [初期企画書](docs/concept.md) — 企画の出発点。現在の脚本は上記を参照。

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

## 構成

- `app/` … App Router のページとレイアウト
- `biome.json` … Biome 設定（`.next` / `node_modules` / `out` は除外）
