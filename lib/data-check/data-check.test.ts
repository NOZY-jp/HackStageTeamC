import { describe, expect, it } from "vitest";
import { LEAF_CREATOR_ID, OLD_TWIXER_HANDLE } from "@/lib/blog-like/data/names";
import {
  HAL_HANDLE,
  HAL_NAME,
  KAI_DISPLAY_NAME,
  KAI_HANDLE,
  MAIMAI_HANDLE,
  MAIMAI_NAME,
} from "@/lib/discord-like/data/names";
import { users as discordUsers } from "@/lib/discord-like/data/users";
import { creators } from "@/lib/note-like/data/creators";
import { twitterPosts, twitterProfiles, twitterUsers } from "@/lib/twitter-like/data/twitter";
import { collectCorpus } from "./corpus";
import { KNOWN_ISSUES } from "./known-issues";
import { checkAll, violationKey } from "./rules";

/**
 * 仮データの検査（npm run data:check）。データを足したり直したりしたら流す。CI でも毎回流れる。
 * 失敗したら、表示された違反を直す。直せない理由があるときだけ known-issues.ts に Issue つきで足す。
 */
describe("仮データの検査", () => {
  const violations = checkAll(collectCorpus());
  const known = new Set(KNOWN_ISSUES.map((issue) => issue.key));

  it("新しい違反がない（決まり: forbidden-word・本名の置き場所・プロフィールへの直接リンク・物語で届く文言・日時・ゲームのいま・ID の重複）", () => {
    const fresh = violations
      .filter((violation) => !known.has(violationKey(violation)))
      .map(violationKey);
    expect(fresh, "新しい違反（直すか、直す Issue があれば known-issues.ts に足す）").toEqual([]);
  });

  it("直った違反が、既知の問題の一覧に残っていない", () => {
    const current = new Set(violations.map(violationKey));
    const resolved = KNOWN_ISSUES.filter((issue) => !current.has(issue.key)).map(
      (issue) => `${issue.key}（${issue.issue}）`,
    );
    expect(resolved, "直ったので known-issues.ts から消す").toEqual([]);
  });
});

/** 主要人物の名前・ハンドルが、名前の定数（#76: 名前は1か所）とそろっているか */
describe("主要人物の名前", () => {
  it("Discord の表示名・ハンドルが、名前の定数と同じ", () => {
    const byId = new Map(discordUsers.map((user) => [user.id, user]));
    expect(byId.get("hal")).toMatchObject({
      displayName: HAL_NAME,
      handle: HAL_HANDLE,
    });
    expect(byId.get("maimai")).toMatchObject({
      displayName: MAIMAI_NAME,
      handle: MAIMAI_HANDLE,
    });
    expect(byId.get("kai")).toMatchObject({
      displayName: KAI_DISPLAY_NAME,
      handle: KAI_HANDLE,
    });
  });

  it("Twixer に、#76 で決めた主要人物のハンドルがある", () => {
    const handles = twitterUsers.map((user) => user.handle);
    // 自分は Discord と同じ ID。彼女・カイ・かのんは #76「名前とハンドルの確定」の値
    for (const handle of [HAL_HANDLE, "mai2mai2", "kaiser018023071", "kanon__dayo"]) {
      expect(handles, handle).toContain(handle);
    }
  });

  it("Twixer の古いハンドルは、アカウントとしては無く（改名済み）、プロフィールや投稿にだけ残る", () => {
    expect(twitterUsers.map((user) => user.handle)).not.toContain(OLD_TWIXER_HANDLE);
    const texts = [
      ...twitterProfiles.map((profile) => profile.bio),
      ...twitterPosts.map((post) => post.body),
    ];
    expect(texts.some((text) => text.includes(OLD_TWIXER_HANDLE))).toBe(true);
  });

  it("leaf に彼女の作者ページがある（旧ブログの「leaf に移行しました」の先）", () => {
    expect(creators.map((creator) => creator.id)).toContain(LEAF_CREATOR_ID);
  });
});
