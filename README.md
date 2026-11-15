# HackStageTeamC

Next.js (App Router) + TypeScript + Tailwind CSS のチーム開発リポジトリ。Lint/Format は Biome に一本化し、ESLint は使わない。

## 企画

- [シナリオ『きみの好きな、わたし。』](docs/scenario.md) — 導入、探索、再会時の分岐、Normal／True、後日談までの脚本。
- [探索資料・謎解き設計](docs/scenario-puzzles.md) — 実際の問題、解法、証拠と会話分岐の対応。ネタバレあり。
- [シナリオ推敲記録](docs/scenario-review.md) — 各稿の批評、改稿理由、保存した版の履歴。
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
