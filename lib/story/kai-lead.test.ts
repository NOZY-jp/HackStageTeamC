import { describe, expect, it } from "vitest";
import { getPost } from "@/lib/twitter-like";
import { linesOf } from "./engine";
import { beats } from "./scenario";
import { steps } from "./steps";
import type { Beat } from "./types";

/**
 * #213: カイの第三章の誘導を弱める。投稿の直リンクは送らず、アカウントだけ。
 * アカウント → post-101 → post-102 → s02 の導線は成立したまま。
 */

const lead = beats.find((beat) => beat.id === "ch3-kai-twixer-lead");
const advice = beats.find((beat) => beat.id === "ch3-ask-kai");
const texts = (beat: typeof lead) => (beat ? linesOf(beat).map((line) => line.text) : []);
/** チャットとして送られる本文 */
const chats = (beat: Beat | undefined) =>
  (beat?.script ?? []).flatMap((cue) => (cue.type === "chat" ? [cue.text] : []));

describe("カイの第三章の誘導（#213）", () => {
  it("アカウントのURLだけを送り、投稿の直リンクは送らない", () => {
    const lines = chats(lead);
    expect(lines).toContain("https://twixer.com/mai2mai2");
    expect(lines.some((line) => line.includes("status/post-101"))).toBe(false);
  });

  it("次の操作を指示する文面を残していない", () => {
    const all = [...texts(lead), ...texts(advice)].join("\n");
    expect(all).not.toContain("他のプラットフォーム");
    expect(all).not.toContain("検索かけたら");
    expect(all).not.toContain("Discord だけじゃなくて他のとこ");
  });

  it("過去の発言の引用は1件まで", () => {
    const quotes = texts(advice).filter((line) => line.includes("MaiMai（過去のチャット）"));
    expect(quotes.length).toBeLessThanOrEqual(1);
  });

  it("段階2の行き先はアカウント、post-101・post-102 は不変", () => {
    const step = steps.find((candidate) => candidate.id === "s02-bff-reply");
    expect(step?.places[0]?.href).toBe("/twitter/profile/mai2mai2");
    expect(getPost("post-101")?.id).toBe("post-101");
    expect(getPost("post-102")?.replyToId).toBe("post-101");
  });
});
