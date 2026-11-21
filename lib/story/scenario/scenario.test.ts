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
import { say, textsOf, validateBeat } from "../stage";
import { STEP_IDS } from "../steps";
import type { Beat, Line } from "../types";
import { beats } from "./index";

/** 場面に出てくる全部の行（選択肢の文はリョウの発言として数える） */
const allLines = (beat: Beat): Line[] => [
  ...textsOf(beat.script),
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
    // カイの助言で段階1に着く（Twixer が開放される）
    expect(state.flags).toContain("s01-blog-talk");
    // 段階に着くまでは次の場面は始まらない（プレイヤーが調べる番）
    expect(nextBeat(state)).toBeUndefined();
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
    // カイからの連絡（段階9）と結末の送信（段階11）は #159 の場面が立てる
    state = setFlag(state, "s09-kai-contact");
    expect(nextBeat(state)).toBeUndefined();
    state = setFlag(state, "s10-talkup-match");
    play("ch5-talkup");
    expect(nextBeat(state)).toBeUndefined();
    state = setFlag(state, "s11-address");
    play("ch6-bad-end");
    expect(nextBeat(state)).toBeUndefined();
  });
});
