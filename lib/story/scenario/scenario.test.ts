import { describe, expect, it } from "vitest";
import { characters, FORBIDDEN_WORDS, nicknames } from "../characters";
import {
  completeBeat,
  completedChats,
  initialState,
  nextBeat,
  setFlag,
  transcript,
} from "../engine";
import { EXTRA_FLAGS, type FlagId } from "../flags";
import { chatsOf, say, textsOf, validateBeat } from "../stage";
import { STEP_IDS } from "../steps";
import type { Beat, Line } from "../types";
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
        text: "ありがとう、その線で探してみる",
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
});
