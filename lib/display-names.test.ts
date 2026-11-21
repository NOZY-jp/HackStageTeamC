import { describe, expect, it } from "vitest";
import { HAL_NAME } from "@/lib/discord-like/data/names";
import { fbUsers } from "@/lib/facebook-like/data/users";
import { twitterUsers } from "@/lib/twitter-like/data/twitter";

/**
 * #209: SNS の表示名は Discord と同じ正本（HAL_NAME）を使う。
 * 各SNSのデータに表示名を直書きしない。
 */

describe("表示名の統一（#209）", () => {
  it("Twixer の自分は「琥珀」で、handle は変えない", () => {
    const me = twitterUsers.find((user) => user.id === "tw-hal");
    expect(me?.displayName).toBe(HAL_NAME);
    expect(me?.handle).toBe("kohakunchos0117");
  });

  it("Talkup の自分は「琥珀」", () => {
    const me = fbUsers.find((user) => user.id === "u1");
    expect(me?.displayName).toBe(HAL_NAME);
  });

  it("どちらのデータにも「Hal」「メンバー01」が残っていない", () => {
    const names = [
      ...twitterUsers.map((user) => user.displayName),
      ...fbUsers.map((user) => user.displayName),
    ];
    expect(names).not.toContain("Hal");
    expect(names).not.toContain("メンバー01");
    expect(names.filter((name) => name === HAL_NAME).length).toBeGreaterThanOrEqual(2);
  });
});
