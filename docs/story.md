# シナリオと演出の作り方（人と AI 向けの手引き）

物語の場面（会話・独り言・地の文・背景・立ち絵・動き）を、コードでどう作るかの決まりです。場面や手がかりを足すときは、人も AI もこの手引きに従ってください。

## 正本はどこか

| 何を                                                                 | 正本                                                   | コードの置き場所                                |
| -------------------------------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------- |
| 謎解きの順序（段階1〜11）・名前・呼称                                | GitHub Issue #76「spec: 謎解きの順序と手がかりの配分」 | `lib/story/steps.ts`、`lib/story/characters.ts` |
| 場面の文章（章ごとの会話・地の文）                                   | Google Docs「HackStageTeamC」の箱書き                  | `lib/story/scenario/chNN-*.ts`                  |
| 演出の枠組み（このページ）                                           | Issue #83                                              | `lib/story/stage/`、`components/common/story/`  |
| 各プラットフォームの過去のデータ（手がかりの実物）                   | 各プラットフォームの Issue                             | `lib/<platform>/data/`                          |
| Discord の会話データの設計方針（自然さ・時間軸・人物・サーバー・DM） | `docs/discord/`（Issue #127）                          | `lib/discord-like/data/`                        |

食い違ったら **#76 を優先**します。コードは正本の写しなので、正本が変わったらコードを合わせます。

## 守ること

- **本名は作中に出さない**。`lib/story` にも置かない（到達するのは段階8・10だけ）
- **「ゆい」「ゆっちゃん」は作中のテキストに出さない**。彼女は「MaiMai」、リョウの呼び方は「まいまい」
- **答え（黒幕の正体・BFF の正体）を作中で直接書かない**。プレイヤーが突き合わせて気づける形にする
- **文章を勝手に作らない**。資料に無い文章は `todo(...)` で仮置きする
- **同時に複数のプラットフォームを触らない**（#76「触る範囲」）。`lib/story` から他の名前空間を import してよいのは、名前の定数（`lib/<platform>/data/names.ts`。#76 で名前の置き場は1か所と決めている）と、`lib/story/progression.test.ts` だけ
- 確認画面 `/story` と `/story/scene/<id>` は答えの道筋が見えるので、本番では開けない（`NEXT_PUBLIC_STORY_CONSOLE=1` のときだけ）

## 統一するもの・自由にするもの

見た目と操作感はそろえ、場面ごとの演出は自由にします。**まず統一の部品と型を使い、足りないときだけ自由に書く**。同じ自由な演出を2回以上使ったら、名前を付けて統一の型に足します。

### 統一するもの（名前で指定する）

| 何を           | 置き場所                                                                    | 中身                                                                                                                                                                    |
| -------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 文章の枠       | `stage/presets.ts` の `FRAMES`                                              | `talk`（対面）・`call`（通話）・`think`（心の声）・`narration`（地の文）・`title`（場面転換）・`system`（通知）。見た目は `app/globals.css` の `.sw-window[data-frame]` |
| 人物           | `characters.ts`（名前の色）、`stage/assets.ts` の `SPRITES` / `EXPRESSIONS` | 誰の・どの表情（`normal`・`smile`・`worried`・`surprised`・`sad`・`angry`・`thinking`）                                                                                 |
| 背景・小物     | `stage/assets.ts` の `BACKGROUNDS` / `PROPS`                                | 名前で指定。画像ファイルが無いあいだは名前入りの仮の板が出る                                                                                                            |
| 動きの型       | `stage/presets.ts` の `MOTIONS`                                             | 出る（`fade-in`・`slide-in-*`・`pop-in`・`zoom-in`）／消える（`fade-out`・`slide-out-*`）／目立たせる（`shake`・`nod`・`jump`・`pulse`・`tremble`・`float`・`spin`）    |
| 時間・緩急     | `DURATIONS`・`EASINGS`                                                      | `fast`・`normal`・`slow`・`slower` など                                                                                                                                 |
| 位置           | `POSITIONS`                                                                 | `far-left`・`left`・`center`・`right`・`far-right`                                                                                                                      |
| 背景の切り替え | `TRANSITIONS`                                                               | `cut`・`fade`・`black`・`white`・`slide-left`・`slide-right`・`zoom`                                                                                                    |
| 画面効果       | `EFFECTS`・`TINTS`                                                          | 揺れ・光る・暗転・色を重ねる（`night`・`sepia`・`memory`・`danger`）                                                                                                    |
| 進み方         | 土台が引き受ける                                                            | クリック／オート／スキップ、文字の速さ、ログ、たたむ、続きから。話している人以外の立ち絵は自動で少し暗くなる                                                            |

### 自由にするもの

- **位置・大きさ**: `at: { x: 30, y: 85 }`（画面に対する％。x は中心、y は下端）、`height`（画面の高さに対する％）、`z`（重なり順）、`flip`
- **動き**: `animate(id, { keyframes: { rotate: [0, -8, 8, 0] }, duration: 600 })` のように、Motion のキーフレームをそのまま書ける
- **画像**: 一覧に無い画像を `{ src: "/story/...", label: "..." }` で直接使える
- **カスタム演出**: React の部品を登録して `custom("名前", props)` で呼ぶ（スマホの画面を映す、など）

## 場面の書き方

場面（`Beat`）は「始まる条件」と「命令の並び」でできています。命令を上から実行し、**文章で止まって**プレイヤーが進めるのを待ちます。

```ts
import { show, say, think, animate, todo, portrait } from "../stage";

export const chapter4: Beat[] = [
  {
    id: "ch4-found-mylist", // 「ch章番号-」で始める
    chapter: 4,
    layout: "overlay", // overlay: SNS の上に窓だけ（基本）/ fullscreen: 背景で覆う（SNS の外の場面だけ）
    place: "discord", // この画面を開いたときに始まる（任意）
    when: ["s06-old-profile-link"], // このフラグがそろったら始まる（段階に着いたら、など）
    after: ["ch2-noticed"], // この場面が終わってから（任意）
    source: "Google Docs 箱書き 第四章",
    script: [
      todo(think(), "記事一覧が開いた。トップとは違う"),
      show("kai", portrait("kai", "smile"), { at: "right", enter: "slide-in-right" }),
      todo(say("kai"), "何か見つかった？"),
      animate("kai", "nod"),
    ],
    memo: "記事一覧を読む", // 探索に戻るときの「いまやること」（任意）
  },
];
```

`choices`（場面の最後の選択肢）、`sets`（終わったら立つフラグ）も書けます。見本は `lib/story/scenario/sample.ts`（全命令を一度ずつ使う）です。

### 選択肢

場面の最後に `choices` を書くと、文章の帯の上に選択肢が出ます。選んだ文はリョウの発言として会話に残り、`reply`（命令の並び）が続きます。

- `sets`: 選んだら立つフラグ
- `requires`: このフラグがそろうまで、その選択肢は出ない（手がかりを見つけた人だけが選べる、など）
- `completes: false`: **寄り道**。選んでも場面は終わらず、返事のあとにまた残りの選択肢が出る（同じ寄り道は二度出ない）。寄り道の発言と返事も、選んだ順にログに残る

```ts
choices: [
  { id: "search", label: "本名で検索する", sets: ["s10-talkup-match"] },
  {
    id: "ask",
    label: "カイに相談する",
    requires: ["s03-blog-found"],
    completes: false,
    reply: [todo(call("kai"), "カイの返事")],
  },
],
```

### 命令の一覧（`lib/story/stage/cues.ts`）

| 命令           | 書き方                                                                           | すること                                                                   |
| -------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 対面の会話     | `say("kai", "文", { expression: "smile" })`                                      | 名前つき。この行で表情を変えられる                                         |
| 通話           | `call("maimai", "文")`                                                           | 通話の枠（緑・「● 通話中」）                                               |
| 心の声         | `think("文")`                                                                    | リョウの独り言（括弧つき・斜体）                                           |
| 地の文         | `narrate("文")`                                                                  | 名前なし                                                                   |
| 場面転換       | `title("翌日")`                                                                  | 大きな文字                                                                 |
| システム表示   | `system("通話を開始しました")`                                                   | 小さな灰色                                                                 |
| 未定の行       | `todo(say("kai"), "何を言うか")`                                                 | 文面が無い行の仮置き（黄色で出る）                                         |
| 背景           | `background("room-night", { transition: "fade", duration: "slow" })`             | 名前か `{ color: "#000" }`                                                 |
| 出す           | `show("id", portrait("kai", "smile"), { at: "right", enter: "slide-in-right" })` | 立ち絵・小物（`{ prop: "smartphone" }`）                                   |
| 差し替え       | `change("id", portrait("kai", "sad"))`                                           | 表情などを変える                                                           |
| 移す           | `move("id", "center", { duration: "slow", wait: true })`                         | 位置を変える                                                               |
| 動かす         | `animate("id", "jump", { wait: true })`                                          | 立ち絵・小物か画面全体（`"screen"`）                                       |
| 消す           | `hide("id", "fade-out")`                                                         | 消える動きを付けられる                                                     |
| 全部消す       | `clear()`                                                                        | 立ち絵・小物を全部消す                                                     |
| 画面効果       | `effect("tint", { tint: "night" })`                                              | `shake`・`flash`・`fade-to-black`・`fade-from-black`・`tint`・`clear-tint` |
| 待つ           | `wait("normal")`                                                                 |                                                                            |
| チャット       | `chat("discord:dm-maimai", "ryo", "文", "2026-11-20T12:52:00+09:00")`            | その SNS の画面に本当にメッセージが流れる（下の「SNS の画面を使う」）      |
| 通話           | `voice("discord:mhc-vc-3", "maimai", "mute")`                                    | 通話の画面の様子を変える（`join`・`leave`・`mute`・`unmute`）              |
| カスタム演出   | `custom("phone-screen", { messages: [...] }, { wait: true })`                    | 登録した部品を出す                                                         |
| フラグ         | `flag("askedKai")`                                                               | 場面の途中でフラグを立てる                                                 |
| 窓を隠す・出す | `hideWindow()` / `showWindow()`                                                  | 演出だけ見せたいとき。次の文章で自動的に出る                               |
| 絵を見せる     | `background("manhole-street"), ...look()`                                        | 窓を隠して絵だけを見せ、押すまで待つ。手がかりの写真や風景に使う           |

### SNS の画面を使う

物語は、なるべく **実際の SNS の画面の上で** 進めます。

- **会話の背景は、基本は Discord の通話の画面**。人物どうしの会話は、ボイスチャンネルを `place` にして、`voice(...)` で入り、`call(...)` で話す（下の例）。選択肢もこの上に出せる
- **独り言・地の文**は、そのとき開いている SNS の画面の上（`layout: "overlay"`）
- **全画面の背景・立ち絵**は、SNS の外の場面だけに使う。待ち合わせ場所や、最後に人物と直接会う場面など。カイと対面で話すのは、最後に会う場面くらいの想定
- **SNS の上の場面でも、背景を出すと画面を覆う**。マップアプリで歩き回るなど、一時的に SNS の外を見せるときに使う。窓に隠れると困る絵（手がかり）は、背景の直後に `...look()` を置いて先に絵だけを見せる

```ts
// Discord の「深夜の集会」で通話する場面の例（文面は仮）
{
  id: "chN-call",
  chapter: N,
  layout: "overlay",
  place: "discord:vc-night", // この通話を開いたときに始まる
  when: ["started"],
  script: [
    voice("discord:mhc-vc-3", "ryo", "join"),
    voice("discord:mhc-vc-3", "maimai", "join"),
    call("maimai", "（仮）"), // 話している人の枠が光る
    voice("discord:mhc-vc-3", "maimai", "mute"),
    narrate("（仮）"),
    voice("discord:mhc-vc-3", "ryo", "leave"), // プレイヤーも切断される
  ],
}
```

- **場面の起きる画面**: 場面に `place: "discord"` のように書くと、その画面を開いたときに始まる。開いていなければ、画面の右下に「Discord を開く」と案内だけ出す（探索を邪魔しないよう、画面は勝手に移さない）。画面の一覧は `lib/story/places.ts` の `PLACES`
- **メッセージ**: `chat(...)` の命令で、Discord の DM などに本当にメッセージが流れる。場面が終わったあとも、進行状態から組み立て直して出し続ける。ほかの人からのメッセージは、その画面を開くまで右上に「◯◯ から新しいメッセージ」と知らせる
- **通話**: `voice(...)` の命令で、Discord のボイスチャンネルの参加者に物語の人物が出る。`call(...)` の行が出ているあいだは、その人の枠が光る（話している）。ミュートや退出も通話の画面で見せる。リョウが `leave` すると、プレイヤーも切断される。通話の様子は、その場面を流しているあいだだけ出る
- **読んでいるあいだ**: 場面を流しているあいだは、後ろの SNS の画面は操作できない（読ませる）。**プレイヤーに操作・探索させたいところでは、場面を終えて文章の窓を出さない**（`memo` で「いまやること」を出す）。場面の起きる画面の外に移ると、「◯◯を開く」の案内になる
- **たたむ**: 文章の窓だけを隠して、背景・立ち絵などの絵を見せる（操作させるためのものではない）。画面のどこかを押すか、Enter・Space・Esc で戻る
- **流せる場所を足す**: `stage/cues.ts` の `CHAT_CHANNELS` に足し、受け取る側の画面で `useStoryChats("<場所>")`（`components/common/story/story-provider.tsx`）を読んで、過去のデータの後ろに並べる。いまは Discord の MaiMai との DM だけ（`app/(discord-like)/_components/local-messages-context.tsx`）。通話は `VOICE_CHANNELS` と `useStoryVoice(...)`（`voice-channel-view.tsx`）
- 時刻は、そのプラットフォームの過去のデータとつじつまが合うように書く（`+09:00` 付き）

### サイトの開放（ブックマーク）

物語や謎解きの段階が進むと、行けるサイトが増えます。開放したサイトは、画面の左端の「ブックマーク」に並びます。新しく開放したときは、上に「ブックマークに追加しました」と短く知らせます。

- 開放の条件は `lib/story/sites.ts` の `SITES`（`unlockWith` のフラグが全部そろったら）。はじめは Discord だけ
- **締め出しはしない**。URL や検索でたどり着けたら、そのサイトはその時点で開放する
- 場面を流しているあいだは、ブックマークを出さない
- サイトを足すときは `SITES` に1行足す（並び順が開放される順）

### 組み合わせの注意

- `wait: true` を付けた命令は、終わるまで次へ進まない。付けなければ、動きと並行して次の命令が流れる
- 繰り返し続ける動き（`float`・`repeat: Infinity`）に `wait: true` を付けない（検査で見つかる）
- 出していない立ち絵を動かす・差し替える・消すと、検査で見つかる
- 文章が空でも動く。最後に文章を入れれば完成する

### 足すとき

| 何を                     | どうする                                                                                                                                                                                             |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 背景・小物               | `stage/assets.ts` に1行足す。画像は `public/story/` に置いて `src` を書く（無ければ仮の板）                                                                                                          |
| 立ち絵の画像             | `SPRITES` の人物に `src: { normal: "/story/...", smile: "..." }` を足す                                                                                                                              |
| 動きの型                 | `stage/presets.ts` の `MOTIONS` に名前と `keyframes` を足す                                                                                                                                          |
| カスタム演出             | `stage/custom.ts` に名前を足し、`components/common/story/stage/custom-cues.tsx` に部品を登録する（登録漏れは型エラー）。部品は `props`・`onDone`・`instant` を受け取り、終わったら `onDone()` を呼ぶ |
| 出し方（DM に流す など） | `Beat["presenter"]` に名前を足し、`components/common/story/story-stage.tsx` の `PRESENTERS` に部品を登録する                                                                                         |
| 手がかりを入れた         | `steps.ts` のその段階を `done: true` にし、`progression.test.ts` に確認を足す。画面に `<StoryTrigger flag="s07-contest-entry" />` を置くと、開いたときに段階に着く                                   |

## 仕組み

```
lib/story/
  characters.ts   人物の台帳（作中の名前・名前の色・アカウント・呼び名・出してはいけない語）
  steps.ts        謎解きの段階1〜11（#76 の写し）
  places.ts       場面の起きる画面（URL）。チャットの流し先
  flags.ts        フラグ = 段階のID ＋ 場面の進み具合
  stage/          演出の枠組み（統一の型・命令・舞台の状態・書き間違いの検査）
  scenario/       場面。章ごとのファイルに書き、index.ts に並べる
  engine.ts       進行のロジック（次の場面・場面を終える・ログの組み立て直し）
  playback.ts     進み方（クリック・オート・スキップ・文字の速さ）
components/common/story/
  story-provider.tsx  進行状態（全プラットフォームで共有、localStorage）
  story-stage.tsx     画面下の窓の土台（ルートレイアウト）。たたむ・ログ・いまやること
  stage/              舞台（背景・立ち絵・効果）と、1場面を流す ScenePlayer
  story-trigger.tsx   画面を開いたらフラグを立てる部品
app/(story)/          確認画面（開発用）
```

## 確認のしかた

```bash
npx vitest run lib/story components/common/story   # 書き間違いの検査・進行・再生
npm run dev
```

- `http://localhost:3000/story`: 場面の一覧（未記入の行・書き間違いの数）、謎解きの段階、統一の部品の一覧
- `http://localhost:3000/story/scene/<場面ID>`: 場面を1つだけ再生する（進行状態は変えない）。`place` のある場面は、その画面（Discord の通話など）に移って実物の上で流す。`sample-all-cues` が全命令の見本
- ゲームの中での流れ: `/story` で「ゲームを始めたことにする」を押してから各プラットフォームの画面を開くと、条件がそろった場面が画面下に流れる
- LAN の別端末から開発サーバーを開くときは `DEV_ALLOWED_ORIGINS=<IP>` を付けて起動する
