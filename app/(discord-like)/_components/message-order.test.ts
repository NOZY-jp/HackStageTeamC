import { describe, expect, it } from "vitest";
import { dmMessages } from "@/lib/discord-like/data/messages";
import type { Message } from "@/lib/discord-like/types";
import { chapter2 } from "@/lib/story/scenario/ch02-disappearance";
import { mergeMessages } from "./local-messages-context";

/**
 * 物語で流れたメッセージ（#116 の第二章は 11/20 12:52）と、過去ログ（11/19 21:48 まで進んでいる）を
 * 連結したときに、時刻が逆転しないことを固定する（#159 レビュー指摘）。
 */
const storyMessages = (): Message[] =>
  chapter2.flatMap((beat) =>
    (beat.script ?? []).flatMap((cue) =>
      cue.type === "chat"
        ? [
            {
              id: `story-${cue.channel}-${cue.at}`,
              channelId: "dm-maimai",
              authorId: "hal",
              sentAt: cue.at,
              body: cue.text,
            } satisfies Message,
          ]
        : [],
    ),
  );

describe("DM の表示順（物語のメッセージと過去ログ）", () => {
  it("連結しても時刻の昇順になる", () => {
    const merged = mergeMessages(storyMessages(), dmMessages["dm-maimai"] ?? []);
    for (let i = 1; i < merged.length; i += 1) {
      expect(
        merged[i].sentAt >= merged[i - 1].sentAt,
        `${merged[i - 1].id} -> ${merged[i].id}`,
      ).toBe(true);
    }
  });

  it("第二章の 11/20 12:52 は、11/19 の最後と 11/20 19:37 のあいだに入る", () => {
    const merged = mergeMessages(storyMessages(), dmMessages["dm-maimai"] ?? []);
    const index = merged.findIndex((message) => message.id.startsWith("story-"));
    expect(index).toBeGreaterThan(0);
    expect(merged[index - 1].id).toBe("dm-maimai-0431");
    expect(merged[index].sentAt).toBe("2026-11-20T12:52:00+09:00");
    expect(merged[index + 1].id).toBe("dm-maimai-0432");
  });
});
