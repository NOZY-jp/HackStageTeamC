import { describe, expect, it } from "vitest";
import { messagesByDMThread } from "@/lib/discord-like/data/messages/dm";
import { twitterPosts } from "@/lib/twitter-like/data/twitter";
import { linesOf } from "./engine";
import { beats } from "./scenario";

/**
 * #248: True End の手がかりの因果。
 * カイの助言（11/13 18:19）→ まいまいが言い回しを目にする（post-019）→ 失踪（11/19 21:47）の順で、
 * post-019 を助言より前へ動かしたり、失踪後へ動かしたりすると落ちる。
 */

const ADVICE_ID = "dm-kai-nickname-advice";
const ADVICE_AT = "2026-11-13T18:19:00+09:00";
const DISAPPEARANCE_AT = "2026-11-19T21:47:00+09:00";

const advice = messagesByDMThread["dm-kai"]?.find((message) => message.id === ADVICE_ID);
const post = twitterPosts.find((candidate) => candidate.id === "post-019");

describe("True End の因果（#248）", () => {
  it("カイの助言 → post-019 → 失踪 の順に並ぶ", () => {
    expect(advice?.sentAt).toBe(ADVICE_AT);
    expect(post?.postedAt).toBe("2026-11-15T23:12:00+09:00");
    if (!advice || !post) throw new Error("手がかりが見つかりません");

    expect(Date.parse(advice.sentAt)).toBeLessThan(Date.parse(post.postedAt));
    expect(Date.parse(post.postedAt)).toBeLessThan(Date.parse(DISAPPEARANCE_AT));
  });

  it("post-019 の「きのうから」は、助言の翌日以降になる", () => {
    if (!advice || !post) throw new Error("手がかりが見つかりません");
    const yesterday = Date.parse(post.postedAt) - 24 * 60 * 60 * 1000;
    expect(yesterday).toBeGreaterThanOrEqual(Date.parse(advice.sentAt));
  });

  it("True End の台詞の日付が post-019 の日付と一致する", () => {
    if (!post) throw new Error("post-019 がありません");
    const month = Number(post.postedAt.slice(5, 7));
    const day = Number(post.postedAt.slice(8, 10));
    const branch = beats.find((beat) => beat.id === "ch6-branch");
    if (!branch) throw new Error("ch6-branch がありません");
    expect(
      linesOf(branch)
        .map((line) => line.text)
        .join("\n"),
    ).toContain(`${month}月${day}日に、まいまいはTwixerで`);
  });
});
