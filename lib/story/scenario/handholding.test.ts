import { describe, expect, it } from "vitest";
import { normalizeAppPath } from "@/lib/link-embed";
import { chatsOf, textsOf } from "../stage";
import { beats } from ".";
import { samples } from "./sample";

const storyBeats = beats.filter((beat) => !samples.includes(beat));
const steering =
  /見てみよう|で検索|検索してみよう|調べてみよう|散策してみる|するだけだ|調べるだけだ|ビンゴ|案の定|が気になった|ヒットするかも|一発で/;

const wordsIn = (beat: (typeof beats)[number]) => [
  beat.memo ?? "",
  ...textsOf(beat.script).map((line) => line.text),
  ...chatsOf(beat.id, beat.script).map((line) => line.text),
  ...(beat.choices ?? []).flatMap((choice) => [
    choice.label,
    ...textsOf(choice.reply ?? []).map((line) => line.text),
    ...chatsOf(choice.id, choice.reply ?? []).map((line) => line.text),
  ]),
];

describe("手がかりを探す場面の台本（#244）", () => {
  it("次の操作や答えを先回りする言葉を出さない", () => {
    for (const beat of storyBeats) {
      for (const phrase of wordsIn(beat)) expect(phrase, beat.id).not.toMatch(steering);
    }
  });

  it("3件のメモは気持ちを伝え、行き先や手段は示さない", () => {
    const memos = storyBeats.filter((beat) => beat.memo !== undefined);
    expect(memos).toHaveLength(3);
    for (const beat of memos) {
      expect(beat.memo, beat.id).toBeTruthy();
      expect(beat.memo, beat.id).not.toMatch(
        /Discord|Twixer|Talkup|leaf|DM|ブログ|アプリ|検索|記録|開いて|調べ|確かめ/i,
      );
    }
  });

  it("カイの助言は届くが、検索や閲覧操作は指定しない", () => {
    const ids = ["ch3-ask-kai", "ch3-kai-twixer-lead", "ch4-leaf", "ch5-kai-contact"];
    for (const id of ids) {
      const beat = storyBeats.find((candidate) => candidate.id === id);
      const messages = chatsOf(id, beat?.script ?? []).filter((message) => message.from === "kai");
      expect(messages.length, id).toBeGreaterThan(0);
      for (const message of messages) {
        expect(message.text, id).not.toMatch(/検索|調べて|見てみたら|を見て/);
      }
    }
  });

  it("カイが送るリンクは公開アカウントまでで、過去の発言の引用は一件", () => {
    const lead = storyBeats.find((beat) => beat.id === "ch3-kai-twixer-lead");
    const chats = chatsOf("ch3-kai-twixer-lead", lead?.script ?? []);
    const links = chats.filter((line) => /^https:\/\//.test(line.text)).map((line) => line.text);
    expect(links).toEqual(["https://twixer.com/mai2mai2"]);
    expect(normalizeAppPath(links[0])).toBe("/twitter/profile/mai2mai2");
    const advice = storyBeats.find((beat) => beat.id === "ch3-ask-kai");
    expect(
      textsOf(advice?.script ?? []).filter((line) =>
        line.text.startsWith("MaiMai（過去のチャット）"),
      ),
    ).toHaveLength(1);
  });

  it("記事一覧では特定の記事を選ばず、発見後に記事の見出しと日付を示す", () => {
    const listing = storyBeats.find((beat) => beat.id === "ch4-old-blog");
    const found = storyBeats.find((beat) => beat.id === "ch4-real-name");
    expect(
      textsOf(listing?.script ?? [])
        .map((line) => line.text)
        .join("\n"),
    ).not.toMatch(/コンテスト|優秀賞/);
    const text = textsOf(found?.script ?? [])
      .map((line) => line.text)
      .join("\n");
    expect(text).toContain("写真コンテストで賞をもらいました！");
    expect(text).toContain("2018年11月17日");
    expect(text).toContain("優秀賞をもらいました");
    expect(text).toContain("Twixerのリンク先は表示されなかった。");
  });
});
