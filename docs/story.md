# シナリオの進め方（人と AI 向けの手引き）

シナリオの台本・登場人物・謎解きの段階を、コードでどう持つかの決まりです。シナリオや手がかりを足すときは、人も AI もこの手順に従ってください。

## 正本はどこか

| 何を                                               | 正本                                                   | コードの置き場所                                |
| -------------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------- |
| 謎解きの順序（段階1〜11）・名前・呼称              | GitHub Issue #76「spec: 謎解きの順序と手がかりの配分」 | `lib/story/steps.ts`、`lib/story/characters.ts` |
| 台本の文面（章ごとの会話・地の文）                 | Google Docs「HackStageTeamC」の箱書き                  | `lib/story/scenario/chNN-*.ts`                  |
| 各プラットフォームの過去のデータ（手がかりの実物） | 各プラットフォームの Issue                             | `lib/<platform>/data/`                          |

食い違ったら **#76 を優先**します（#76 の訂正が新しい）。コードは正本の写しなので、正本が変わったらコードを合わせて直します。

## 守ること

- **本名は作中に出さない**。`lib/story` にも置かない（到達するのは段階8・10だけ）
- **「ゆい」「ゆっちゃん」は作中のテキストに出さない**。彼女は「MaiMai」、リョウの呼び方は「まいまい」
- **答え（黒幕の正体・BFF の正体）を作中で直接書かない**。プレイヤーが突き合わせて気づける形にする
- **同時に複数のプラットフォームを触らない**（#76「触る範囲」）。`lib/story` から他の名前空間を import してよいのは、名前の定数（`lib/<platform>/data/names.ts`。#76 で名前の置き場は1か所と決めている）と、`lib/story/progression.test.ts` だけ
- 進行チェックの画面 `/story` は答えの道筋が全部見えるので、本番では開けない（`NEXT_PUBLIC_STORY_CONSOLE=1` のときだけ）

## 仕組み

```
lib/story/
  characters.ts   人物の台帳（作中の名前・アカウント・呼び名と使ってよい人・出してはいけない語）
  steps.ts        謎解きの段階1〜11（#76 の写し）。各段階の手がかりの場所と、実装済みかどうか
  flags.ts        フラグ = 段階のID ＋ 場面の進み具合（started, askedKai など）
  scenario/       台本。章ごとのファイルに場面（beat）を書き、index.ts に並べる
  engine.ts       進行のロジック（純関数）。次の場面・場面を終える・会話の履歴の組み立て直し
  progression.test.ts  進行チェック。段階の手がかりが各プラットフォームのデータに本当にあるか
components/common/story/
  story-provider.tsx  進行状態（全プラットフォームで共有、localStorage に保存）
  story-trigger.tsx   画面を開いたらフラグを立てる部品
app/(story)/story/    進行チェックの画面（開発用）
```

## よくある作業

### 台本の場面を足す

1. Google Docs の該当する章を読む
2. `lib/story/scenario/chNN-<名前>.ts` に場面を書く（無ければファイルを作り、`scenario/index.ts` に並べる）
3. 名前は #76 に合わせて直す（「ゆい」→「まいまい」など）。直したことはファイルのコメントに書く
4. 資料に文面がまだ無い行は `todo("kai", "何を言うか")` で仮置きする（勝手に作文しない）

```ts
beat({
  id: "ch3-ask-kai",           // 「ch章番号-」で始める
  chapter: 3,
  channel: dm("kai"),          // カイとの DM。独り言・地の文なら monologue
  when: ["started"],           // このフラグがそろったら始まる
  after: ["ch3-who-to-ask"],   // この場面が終わってから
  source: "Google Docs 箱書き 第三章",
  lines: [
    say("ryo", "最近まいまいと連絡が取れないのだけど、何か知ってたりする？"),
    todo("kai", "カイの返事"),
  ],
  sets: ["askedKai"],          // 終わったら立つフラグ
}),
```

### 段階の手がかりを各プラットフォームに入れた

1. `lib/story/steps.ts` のその段階の `status` を `{ done: true }` にし、`places` に場所（`href`）を書く
2. `lib/story/progression.test.ts` に、データに手がかりがあることの確認を足す（`it.todo` があれば置き換える）
3. その画面に `<StoryTrigger flag="s07-contest-entry" />` を置くと、開いたときに段階に着いたことになる

### 人物・名前が変わった

1. #76 を確認する
2. `lib/story/characters.ts` と、各プラットフォームの名前の定数（例: `lib/discord-like/data/names.ts`）を直す
3. 出してはいけない語が増えたら `FORBIDDEN_WORDS` に足す（台本のテストが確認する）

## 確認のしかた

```bash
npx vitest run lib/story   # 台本の整合性・進行のロジック・進行チェック
npm run dev                # http://localhost:3000/story で通しで確認
```

`/story` では、左で謎解きの段階に「着いた」ことにし、真ん中で台本を1行ずつ流せます。始まらない場面には、足りないフラグが表示されます。
