import { describe, expect, it } from "vitest";
import { characters, FORBIDDEN_WORDS, nicknames } from "../characters";
import { EXTRA_FLAGS, type FlagId } from "../flags";
import { STEP_IDS } from "../steps";
import type { Beat, Line } from "../types";
import { beats } from "./index";

/** 場面に出てくる全部の行（選択肢の文はリョウの発言として数える） */
const allLines = (beat: Beat): Line[] => [
  ...beat.lines,
  ...(beat.choices ?? []).flatMap((choice) => [
    { from: "ryo" as const, text: choice.label },
    ...(choice.reply ?? []),
  ]),
];

describe("台本の整合性", () => {
  it("場面IDは重複せず、章番号から始まる", () => {
    const ids = beats.map((beat) => beat.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const beat of beats) {
      expect(beat.id.startsWith(`ch${beat.chapter}-`), beat.id).toBe(true);
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

  it("発言する人と DM の相手は台帳にいる", () => {
    for (const beat of beats) {
      if (beat.channel.kind === "discord-dm") {
        expect(characters[beat.channel.with], beat.id).toBeDefined();
      }
      for (const line of allLines(beat)) {
        if (line.from !== "system") {
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
          if (line.from !== "system" && line.text.includes(nickname.text)) {
            expect(nickname.usedBy, `${beat.id}: ${line.from} が「${nickname.text}」`).toContain(
              line.from,
            );
          }
        }
      }
    }
  });
});
