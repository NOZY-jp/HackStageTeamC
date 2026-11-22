import { describe, expect, it } from "vitest";
import { characters, FORBIDDEN_WORDS, nicknames } from "../characters";
import {
  availableBeats,
  choose,
  completeBeat,
  completedChats,
  initialState,
  linesOf,
  nextBeat,
  remainingChoices,
  setFlag,
  transcript,
} from "../engine";
import { EXTRA_FLAGS, type FlagId } from "../flags";
import { chatsOf, say, textsOf, validateBeat } from "../stage";
import { STEP_IDS } from "../steps";
import { parseState } from "../storage";
import type { Beat, Line, StoryState } from "../types";
import { beats } from "./index";

/** 場面に出てくる全部の行（チャットに流す文と、選択肢の文＝リョウの発言も数える） */
const allLines = (beat: Beat): Line[] => [
  ...textsOf(beat.script),
  ...chatsOf(beat.id, beat.script).map((message) => say(message.from, message.text)),
  ...(beat.choices ?? []).flatMap((choice) => [
    say("ryo", choice.label),
    ...textsOf(choice.reply ?? []),
  ]),
];

describe("台本の整合性", () => {
  it("場面IDは重複せず、章番号から始まる（見本は sample-）", () => {
    const ids = beats.map((beat) => beat.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const beat of beats) {
      const prefix = beat.previewOnly ? "sample-" : `ch${beat.chapter}-`;
      expect(beat.id.startsWith(prefix), beat.id).toBe(true);
    }
  });

  it("命令の書き間違い（出していない立ち絵の操作・未登録の背景など）が無い", () => {
    for (const beat of beats) {
      expect(validateBeat(beat), beat.id).toEqual([]);
    }
  });

  it("after に書いた場面は実在し、自分より前に並んでいる", () => {
    for (const [index, beat] of beats.entries()) {
      for (const id of beat.after ?? []) {
        const before = beats.findIndex((candidate) => candidate.id === id);
        expect(before, `${beat.id} の after ${id}`).toBeGreaterThanOrEqual(0);
        expect(before, `${beat.id} の after ${id}`).toBeLessThan(index);
      }
    }
  });

  it("発言する人は台帳にいる", () => {
    for (const beat of beats) {
      for (const line of allLines(beat)) {
        if (line.from) {
          expect(characters[line.from], `${beat.id}: ${line.from}`).toBeDefined();
        }
      }
    }
  });

  it("場面の条件のフラグは、どこかで立つ（ゲーム開始・段階・場面の sets）", () => {
    const settable = new Set<FlagId>([
      ...(Object.keys(EXTRA_FLAGS) as FlagId[]),
      ...STEP_IDS,
      ...beats.flatMap((beat) => [
        ...(beat.sets ?? []),
        ...(beat.choices ?? []).flatMap((choice) => choice.sets ?? []),
      ]),
    ]);
    for (const beat of beats) {
      for (const flag of beat.when) {
        expect(settable.has(flag), `${beat.id} の条件 ${flag}`).toBe(true);
      }
    }
  });

  it("選択肢のIDは場面の中で重複しない", () => {
    for (const beat of beats) {
      const ids = (beat.choices ?? []).map((choice) => choice.id);
      expect(new Set(ids).size, beat.id).toBe(ids.length);
    }
  });

  it("作中に出してはいけない語（本名・「ゆい」「ゆっちゃん」）が台本に無い", () => {
    for (const beat of beats) {
      for (const line of allLines(beat)) {
        for (const word of FORBIDDEN_WORDS) {
          expect(line.text.includes(word), `${beat.id}: 「${word}」`).toBe(false);
        }
      }
    }
  });

  it("呼び名は、台帳で使ってよいと決めた人だけが使う", () => {
    for (const nickname of nicknames) {
      for (const beat of beats) {
        for (const line of allLines(beat)) {
          if (line.from && line.text.includes(nickname.text)) {
            expect(nickname.usedBy, `${beat.id}: ${line.from} が「${nickname.text}」`).toContain(
              line.from,
            );
          }
        }
      }
    }
  });

  /**
   * #174 レビュー P2（呼称）の回帰防止。
   * 「でんちゃん」は旧ブログのコメント欄に祖母が一度だけ残した昔の呼び方で（#79）、
   * リョウが普段から使う呼び名ではない（#76）。第一〜三章では、まだその手がかりが無いので
   * 「まいまい」と呼ぶ。第一章だけは「でんちゃん」の由来を語る場面なので例外
   * （由来が #76 と違う点は ch01-prologue.ts のコメントどおり清書で確認する）。
   */
  it("第二・三章では、リョウは「まいまい」と呼ぶ（「でんちゃん」は旧ブログの手がかり後）", () => {
    for (const beat of beats.filter(
      (candidate) => candidate.chapter === 2 || candidate.chapter === 3,
    )) {
      for (const line of allLines(beat)) {
        expect(line.text.includes("でんちゃん"), `${beat.id}: ${line.text}`).toBe(false);
      }
    }
  });

  /**
   * 上のテストを章ではなく手がかりの位置で押さえ直したもの。
   * 第一章の由来の場面より後でも、旧ブログの手がかり（ch4-old-blog）より前の場面では
   * 「でんちゃん」を出さない。第四〜六章に足した場面が手がかりを飛び越えないようにする。
   */
  it("「でんちゃん」は、第一章の由来の場面か、旧ブログの手がかり（ch4-old-blog）より後の場面にだけ出る", () => {
    const clueIndex = beats.findIndex((beat) => beat.id === "ch4-old-blog");
    expect(clueIndex, "旧ブログの手がかりの場面 ch4-old-blog").toBeGreaterThanOrEqual(0);

    for (const [index, beat] of beats.entries()) {
      if (beat.previewOnly || beat.chapter === 1) continue;
      if (!allLines(beat).some((line) => line.text.includes("でんちゃん"))) continue;
      expect(index, `${beat.id}: 旧ブログの手がかりより前の「でんちゃん」`).toBeGreaterThan(
        clueIndex,
      );
    }
  });

  it("第一章〜第六章の場面に未定の行（todo）が無い", () => {
    for (const beat of beats) {
      if (beat.previewOnly) continue;
      for (const line of allLines(beat)) {
        expect(line.todo, `${beat.id}: ${line.text}`).toBeUndefined();
      }
    }
  });
});

describe("ゲームでの場面の進行", () => {
  it("序章で通話を終える選択をすると第二章が始まる", () => {
    expect(nextBeat(initialState)).toBeUndefined();

    const started = setFlag(initialState, "started");
    const prologue = nextBeat(started);
    expect(prologue?.id).toBe("ch1-prologue");
    if (!prologue) throw new Error("序章が始まりません");
    expect(() => completeBeat(started, prologue)).toThrow("選択肢が必要です");

    const afterCall = completeBeat(started, prologue, "leave-call");
    expect(afterCall.choices[prologue.id]).toEqual(["leave-call"]);
    // 選択でフラグが立ち、そのフラグが次場面の条件になっている（#81 の受入条件）
    expect(afterCall.flags).toContain("leftCall");
    const withoutChoice = setFlag(started, "started");
    expect(nextBeat(withoutChoice)?.id).toBe("ch1-prologue");
    expect(transcript(afterCall)[0]?.lines.at(-1)?.text).toBe(
      "明日は遅れるわけにはいかないし、今日はもう寝るか",
    );

    const disappearance = nextBeat(afterCall);
    expect(disappearance?.id).toBe("ch2-disappearance");
    if (!disappearance) throw new Error("第二章が始まりません");

    const afterDisappearance = completeBeat(afterCall, disappearance);
    expect(completedChats(afterDisappearance)).toMatchObject([
      {
        channel: "discord:dm-maimai",
        from: "ryo",
        text: "こっちはもう着いたけどゆっくり来ていいよ",
      },
    ]);
  });

  it("第三章〜第六章は、謎解きの段階に着くたびに順に始まり、悪い結末で終わる", () => {
    let state = setFlag(initialState, "started");
    const play = (expected: string) => {
      const beat = nextBeat(state);
      expect(beat?.id).toBe(expected);
      if (!beat) throw new Error(`${expected} が始まりません`);
      state = completeBeat(state, beat, beat.choices?.[0]?.id);
    };
    play("ch1-prologue");
    play("ch2-disappearance");
    play("ch3-ask-kai");
    expect(completedChats(state)).toContainEqual(
      expect.objectContaining({
        channel: "discord:dm-kai",
        from: "kai",
        text: "え、連絡取れなくなったってほんと？",
      }),
    );
    expect(state.flags).toContain("askedKai");
    expect(state.flags).toContain("s01-blog-talk");
    play("ch3-kai-twixer-lead");
    expect(nextBeat(state)).toBeUndefined();

    state = setFlag(state, "s03-blog-found");
    play("ch3-blog-found");
    expect(nextBeat(state)).toBeUndefined();

    state = setFlag(state, "s04-old-id-screenshot");
    play("ch4-leaf");
    expect(completedChats(state)).toContainEqual(
      expect.objectContaining({
        channel: "discord:dm-kai",
        from: "ryo",
        text: "話せて少し落ち着いた。ありがとう。",
      }),
    );
    expect(nextBeat(state)).toBeUndefined();

    state = setFlag(state, "s05-old-discord-user");
    play("ch4-old-account");
    expect(nextBeat(state)).toBeUndefined();

    state = setFlag(state, "s06-old-profile-link");
    play("ch4-old-blog");
    expect(nextBeat(state)).toBeUndefined();

    state = setFlag(state, "s08-real-name");
    play("ch4-real-name");

    const kaiContact = nextBeat(state);
    expect(kaiContact?.id).toBe("ch5-kai-contact");
    expect(kaiContact?.place).toBe("discord:dm-kai");
    play("ch5-kai-contact");
    expect(state.flags).toContain("s09-kai-contact");
    expect(completedChats(state)).toContainEqual(
      expect.objectContaining({ channel: "discord:dm-kai", from: "kai", text: "今の進捗どう？" }),
    );
    expect(nextBeat(state)).toBeUndefined();

    state = setFlag(state, "foundBff");
    play("ch4-bff");
    expect(nextBeat(state)).toBeUndefined();

    state = setFlag(state, "s10-talkup-match");
    play("ch5-talkup");
    expect(state.flags).toContain("s11-address");
    // カイの助言どおり「でんちゃん」と呼ぶと誤認結末へ（#120）
    expect(state.flags).toContain("kaiToldDenchan");
    play("ch6-call-name");
    expect(state.flags).toContain("usedDenchan");

    play("ch6-bad-end");
    expect(nextBeat(state)).toBeUndefined();
  });

  const playBeat = (state: StoryState, expectedId: string, choiceId?: string): StoryState => {
    const beat = nextBeat(state);
    expect(beat?.id).toBe(expectedId);
    if (!beat) throw new Error(`${expectedId} が始まりません`);
    return completeBeat(state, beat, choiceId);
  };

  /** ch5-talkup 完了直前（s10-talkup-match まで到達済み）の状態を作る。 */
  const reachBeforeCh5Talkup = () => {
    let state = setFlag(initialState, "started");
    const play = (expected: string) => {
      const beat = nextBeat(state);
      expect(beat?.id).toBe(expected);
      if (!beat) throw new Error(`${expected} が始まりません`);
      state = completeBeat(state, beat, beat.choices?.[0]?.id);
    };
    play("ch1-prologue");
    play("ch2-disappearance");
    play("ch3-ask-kai");
    play("ch3-kai-twixer-lead");
    state = setFlag(state, "s03-blog-found");
    play("ch3-blog-found");
    state = setFlag(state, "s04-old-id-screenshot");
    play("ch4-leaf");
    state = setFlag(state, "s05-old-discord-user");
    play("ch4-old-account");
    state = setFlag(state, "s06-old-profile-link");
    play("ch4-old-blog");
    state = setFlag(state, "s08-real-name");
    play("ch4-real-name");
    play("ch5-kai-contact");
    state = setFlag(state, "foundBff");
    play("ch4-bff");
    state = setFlag(state, "s10-talkup-match");
    return state;
  };

  const TE_FLAGS = [
    "te01-kai-nickname",
    "te02-kai-joined-mhc",
    "te03-talkup-kai-follower",
    "te04-kanon-stalker-post",
  ] as const;

  it("カイとのDMを時刻順に表示すると、旧アカウントの報告に続いて進捗確認の会話が並ぶ", () => {
    const dm = completedChats(reachBeforeCh5Talkup())
      .filter((message) => message.channel === "discord:dm-kai")
      .sort((a, b) => Date.parse(a.at) - Date.parse(b.at));

    const reports = dm.filter((message) => message.id.startsWith("ch4-old-account:"));
    const checkIns = dm.filter((message) => message.text === "今の進捗どう？");
    expect(reports.map((message) => message.from)).toEqual(["ryo", "kai"]);
    expect(checkIns).toHaveLength(1);
    const report = dm.findLastIndex((message) => message.id.startsWith("ch4-old-account:"));
    const checkIn = dm.findIndex((message) => message.id === checkIns[0]?.id);
    const reply = dm.findIndex(
      (message) => message.id.startsWith("ch5-kai-contact:") && message.from === "ryo",
    );
    expect(report).toBeGreaterThanOrEqual(0);
    expect(checkIn).toBeGreaterThan(report);
    expect(reply).toBeGreaterThan(checkIn);
  });

  it("場面を完了済みの旧セーブでも手がかりの起点を復元し、分岐を開ける", () => {
    const base = playBeat(reachBeforeCh5Talkup(), "ch5-talkup", "visit-house");
    const restored = parseState({
      ...base,
      flags: base.flags.filter((flag) => flag !== "toldKaiOldAccount" && flag !== "kaiToldDenchan"),
      completed: [...base.completed, "ch6-bad-end"],
    });

    expect(restored.flags).toEqual(
      expect.arrayContaining(["toldKaiOldAccount", "kaiToldDenchan", "reachedBadEnd"]),
    );
    expect(parseState(restored)).toEqual(restored);
    expect(nextBeat(restored)).toBeUndefined();

    const investigated = TE_FLAGS.reduce(setFlag, restored);
    const branch = nextBeat(investigated);
    expect(branch?.id).toBe("ch6-branch");
    if (!branch) throw new Error("ch6-branch missing");
    expect(remainingChoices(investigated, branch).map((choice) => choice.id)).toEqual([
      "confront-kai",
      "go-to-house-again",
    ]);
  });

  it("4つのTEフラグのうち1つでも欠けていれば、Bad End後の再調査でも分岐・True Endは開かない", () => {
    let base = reachBeforeCh5Talkup();
    base = playBeat(base, "ch5-talkup", "visit-house");
    base = playBeat(base, "ch6-call-name", "denden");
    const badEnd = nextBeat(base);
    expect(badEnd?.id).toBe("ch6-bad-end");
    if (!badEnd) throw new Error("ch6-bad-end missing");
    expect(remainingChoices(base, badEnd).map((c) => c.id)).toEqual(["reinvestigate"]);
    base = completeBeat(base, badEnd, "reinvestigate");
    expect(base.flags).toContain("reachedBadEnd");
    expect(nextBeat(base)).toBeUndefined();

    // 4通りの「3/4だけ集めた状態」すべてで ch6-branch も True End も始まらない
    for (const missing of TE_FLAGS) {
      let partial = base;
      for (const flag of TE_FLAGS) {
        if (flag !== missing) partial = setFlag(partial, flag);
      }
      expect(nextBeat(partial), `missing ${missing}`).toBeUndefined();
    }
  });

  it("Bad End後に4つすべて集めると分岐が開き、再度の誤選択からやり直してTrue Endへ到達できる", () => {
    let state = reachBeforeCh5Talkup();
    state = playBeat(state, "ch5-talkup", "visit-house");
    state = playBeat(state, "ch6-call-name", "denden");
    state = playBeat(state, "ch6-bad-end", "reinvestigate");
    expect(state.flags).toContain("reachedBadEnd");

    for (const flag of TE_FLAGS) {
      state = setFlag(state, flag);
    }

    const branch = nextBeat(state);
    expect(branch?.id).toBe("ch6-branch");
    if (!branch) throw new Error("ch6-branch missing");
    // Bad End 後なので go-to-house-first ではなく go-to-house-again が出る
    expect(remainingChoices(state, branch).map((c) => c.id)).toEqual([
      "confront-kai",
      "go-to-house-again",
    ]);

    state = choose(state, branch, "go-to-house-again");
    expect(state.flags).toContain("choseBadEndAgain");

    state = playBeat(state, "ch6-bad-end-repeat", "reconsider-after-repeat");
    expect(state.flags).toContain("reconsiderBranch");

    state = playBeat(state, "ch6-branch-retry", "confront-kai-retry");
    expect(state.flags).toContain("choseTrueEnd");

    state = playBeat(state, "ch6-confront-kai");
    state = playBeat(state, "ch6-maimai-reply");
    state = playBeat(state, "ch6-true-end");
    expect(nextBeat(state)).toBeUndefined();
  });

  it("初回探索で4つのTEフラグを集めきっていれば、ch5-talkup直後に分岐が開き両方のルートへ進める", () => {
    let base = reachBeforeCh5Talkup();
    for (const flag of TE_FLAGS) {
      base = setFlag(base, flag);
    }
    base = playBeat(base, "ch5-talkup", "visit-house");

    // (A) 分岐で真相を確かめる -> ch6-bad-end を飛ばして直接 True End へ
    const branchA = nextBeat(base);
    expect(branchA?.id).toBe("ch6-branch");
    if (!branchA) throw new Error("ch6-branch missing");
    expect(remainingChoices(base, branchA).map((c) => c.id)).toEqual([
      "confront-kai",
      "go-to-house-first",
    ]);

    let pathA = choose(base, branchA, "confront-kai");
    expect(pathA.flags).toContain("choseTrueEnd");
    pathA = playBeat(pathA, "ch6-confront-kai");
    pathA = playBeat(pathA, "ch6-maimai-reply");
    pathA = playBeat(pathA, "ch6-true-end");
    expect(pathA.completed).not.toContain("ch6-bad-end");
    expect(nextBeat(pathA)).toBeUndefined();

    // (B) 分岐で家へ向かう選択 -> ch6-bad-end (reconsider) -> ch6-branch-retry -> True End
    let pathB = choose(base, branchA, "go-to-house-first");
    expect(pathB.flags).toContain("choseBadEnd");
    pathB = playBeat(pathB, "ch6-call-name", "denden");
    const badEnd = nextBeat(pathB);
    expect(badEnd?.id).toBe("ch6-bad-end");
    if (!badEnd) throw new Error("ch6-bad-end missing");
    expect(remainingChoices(pathB, badEnd).map((c) => c.id)).toEqual(["reconsider"]);
    pathB = completeBeat(pathB, badEnd, "reconsider");
    expect(pathB.flags).toContain("reconsiderBranch");

    pathB = playBeat(pathB, "ch6-branch-retry", "confront-kai-retry");
    pathB = playBeat(pathB, "ch6-confront-kai");
    pathB = playBeat(pathB, "ch6-maimai-reply");
    pathB = playBeat(pathB, "ch6-true-end");
    expect(nextBeat(pathB)).toBeUndefined();
  });

  it("分岐で家を訪れ表示名で呼んだ場合も、判断をやり直せる", () => {
    let state = TE_FLAGS.reduce(setFlag, reachBeforeCh5Talkup());
    state = playBeat(state, "ch5-talkup", "visit-house");
    state = playBeat(state, "ch6-branch", "go-to-house-first");
    state = playBeat(state, "ch6-call-name", "name");
    state = playBeat(state, "ch6-wait-end", "reconsider");
    state = playBeat(state, "ch6-branch-retry", "confront-kai-retry");
    expect(nextBeat(state)?.id).toBe("ch6-confront-kai");
  });

  it("表示名で呼んだ後に手がかりを集めた場合も、True End の分岐が開く", () => {
    let state = playBeat(reachBeforeCh5Talkup(), "ch5-talkup", "visit-house");
    state = playBeat(state, "ch6-call-name", "name");
    state = playBeat(state, "ch6-wait-end");
    state = TE_FLAGS.reduce(setFlag, state);

    const branch = nextBeat(state);
    expect(branch?.id).toBe("ch6-branch");
    if (!branch) throw new Error("ch6-branch missing");
    expect(remainingChoices(state, branch).map((choice) => choice.id)).toEqual(["confront-kai"]);
    expect(nextBeat(choose(state, branch, "confront-kai"))?.id).toBe("ch6-confront-kai");
  });
});

describe("第五章の写真の描写（#244）", () => {
  const talkup = beats.find((beat) => beat.id === "ch5-talkup");
  if (!talkup) throw new Error("ch5-talkup がありません");
  const before: StoryState = {
    flags: ["s08-real-name", "s09-kai-contact", "s10-talkup-match"],
    completed: ["ch5-kai-contact"],
    choices: {},
  };
  const texts = () => textsOf(talkup.script).map((line) => line.text);

  it("BFF の写真を見ていなくても場面は始まり、TalkUp の写真だけを指す", () => {
    expect(availableBeats(before).map((beat) => beat.id)).toContain("ch5-talkup");
    expect(texts()).toContain("自己紹介の写真から、この人の日常がそのまま伝わってくる。");
    expect(texts().join("\n")).not.toMatch(/前に見た写真|同じ二人/);
  });

  it("BFF の写真を見ていても、前に見た写真の話にはしない", () => {
    expect(texts().join("\n")).not.toMatch(/前に見た写真|同じ二人/);
    expect(texts()).toContain("自己紹介の写真から、この人の日常がそのまま伝わってくる。");
  });
});
