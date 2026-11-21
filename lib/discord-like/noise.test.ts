import { describe, expect, it } from "vitest";
import { channelMessages, dmMessages } from "./data/messages";
import { NOISE_LIMITS as L } from "./test-thresholds";

/**
 * 人が書いた会話の痕跡。件数はノルマにせず（水増しの動機になる）、
 * 「存在すること」だけを必須にする。既読スルーと連投は多すぎないことだけを見る。
 */
const messages = [...Object.values(channelMessages).flat(), ...Object.values(dmMessages).flat()];
const spoken = messages.filter((message) => message.system !== true);
// 既読スルー・連投は会話だけを数える（通話の開始/終了などのシステム行は除く）
const byChannel = new Map<string, typeof messages>();
for (const message of messages.filter((item) => item.system !== true)) {
  byChannel.set(message.channelId, [...(byChannel.get(message.channelId) ?? []), message]);
}

const stamps = spoken.filter((message) =>
  /^[\p{Emoji_Presentation}\p{Extended_Pictographic}]+$/u.test(message.body.trim()),
);
const mediaOnly = spoken.filter((message) =>
  (message.attachments?.length ?? 0) > 0
    ? message.body.trim().length === 0
    : /^https?:\/\/\S+$/.test(message.body.trim()),
);
const nightShort = spoken.filter((message) => {
  const hour = Number(message.sentAt.slice(11, 13));
  return hour <= 3 && message.body.length <= 10;
});
const typos = spoken.filter((message) =>
  /誤字|言い直|いや、|間違えた|打ち間違|\*/.test(message.body),
);

const readThrough = [...byChannel.values()].reduce((sum, list) => {
  let count = 0;
  for (let i = 0; i < list.length - 1; i += 1) {
    const next = list.slice(i + 1).find((message) => message.authorId !== list[i].authorId);
    const minutes = next
      ? (Date.parse(next.sentAt) - Date.parse(list[i].sentAt)) / 60000
      : Infinity;
    if (minutes > 30) count += 1;
  }
  return sum + count;
}, 0);
const consecutive = [...byChannel.values()].reduce(
  (sum, list) =>
    sum +
    list.filter((message, index) => index > 0 && message.authorId === list[index - 1].authorId)
      .length,
  0,
);

describe("人間らしさの痕跡（存在は必須・件数はノルマにしない）", () => {
  it("スタンプ（絵文字だけ）の発言が存在する", () => {
    expect(stamps.length).toBeGreaterThan(0);
  });

  it("画像・リンクだけの発言が存在する", () => {
    expect(mediaOnly.length).toBeGreaterThan(0);
  });

  it("深夜0〜3時の10文字以下の短文が存在する", () => {
    expect(nightShort.length).toBeGreaterThan(0);
  });

  it("誤字または言い直し（訂正）が存在する", () => {
    expect(typos.length).toBeGreaterThan(0);
  });

  it("既読スルーと連投が多すぎない（上限だけ）", () => {
    expect(readThrough / messages.length).toBeLessThanOrEqual(L.readThroughRatioMax);
    expect(consecutive / messages.length).toBeLessThanOrEqual(L.consecutivePostsRatioMax);
  });
});
