import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  filterFeedPosts,
  filterPostsByQuery,
  getPostById,
  getSelfUser,
  getUserByHandle,
  listFeedPosts,
  listFriends,
  listPosts,
  listPostsByAuthor,
  listUsers,
  searchFacebook,
} from "./index";

const word = (...codePoints: number[]) => String.fromCodePoint(...codePoints);
const FAMILY_NAME = word(0x670d, 0x90e8);
const GIVEN_NAME = word(0x7531, 0x6bd4);
const REAL_NAME = `${FAMILY_NAME} ${GIVEN_NAME}`;
const REAL_NAME_NO_SPACE = `${FAMILY_NAME}${GIVEN_NAME}`;
const REAL_NAME_FULL_SPACE = `${FAMILY_NAME}　${GIVEN_NAME}`;

const FORBIDDEN_WORDS = [
  FAMILY_NAME,
  GIVEN_NAME,
  word(0x3086, 0x3044), // ゆい
  word(0x3086, 0x3063, 0x3061, 0x3083, 0x3093), // ゆっちゃん
  word(0x5c0f, 0x8def), // 小路
  word(0x82b1, 0x97f3), // 花音
  word(0x304b, 0x306e, 0x3093), // かのん
  word(0x3067, 0x3093, 0x3061, 0x3083, 0x3093), // でんちゃん
  word(0x3067, 0x3093, 0x3067, 0x3093), // でんでん
  "hunter_denden",
  word(0x004d, 0x0061, 0x0069, 0x004d, 0x0061, 0x0069), // MaiMai
  word(0x307e, 0x3044, 0x307e, 0x3044), // まいまい
  word(0x84bc, 0x7a79), // 蒼穹
  word(0x5c3e, 0x5d0e), // 尾崎
  word(0x6d77, 0x6597), // 海斗
  word(0x30ab, 0x30a4), // カイ
  word(0x30ea, 0x30e7, 0x30a6), // リョウ
  word(0x307d, 0x3061, 0x30d6, 0x30ed), // ぽちブロ
  "pochiblo",
  word(0x6e58, 0x5357), // 湘南
];

const ADDRESS_PATTERN = /丁目|番地|号室|マンション|アパート|団地|\d+階|最寄り?駅/;

const FORBIDDEN_META_TERMS = [
  "hackstage",
  "teamc",
  "discord",
  "talkup",
  "vitest",
  "biome",
  "シナリオ",
  "ダミーデータ",
  "モック",
  "テストデータ",
  "マルチプラットフォーム",
  "ポータル画面",
  "デザイントークン",
  "リリースブランチ",
  "プルリク",
  "コミットログ",
  "検証環境",
  "中期デモ",
];

const isValidIsoUtcSeconds = (iso: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(iso)) {
    return false;
  }
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }
  return `${parsed.toISOString().slice(0, 19)}Z` === iso;
};

describe("lib/facebook-like", () => {
  it("returns self user (u1)", () => {
    const self = getSelfUser();
    expect(self.id).toBe("u1");
    expect(self.handle).toBe("member01");
  });

  it("lists posts sorted newest first and deep-clones results", () => {
    const posts = listPosts();
    expect(posts.length).toBeGreaterThanOrEqual(5);
    expect(posts[0].createdAt >= posts[1].createdAt).toBe(true);

    posts[0].body = "mutated";
    expect(listPosts()[0].body).not.toBe("mutated");
  });

  it("keeps u40 posts out of the normal feed but keeps them searchable and on the profile", () => {
    const feed = listFeedPosts();
    expect(feed).toHaveLength(65);
    expect(feed.every((post) => post.authorId !== "u40")).toBe(true);
    expect(feed[0].createdAt >= feed[1].createdAt).toBe(true);

    expect(listPosts().some((post) => post.authorId === "u40")).toBe(true);
    expect(listPostsByAuthor("u40")).toHaveLength(23);

    // 呼び出し元の配列は変更せず、戻り値は u40 を除いた 65 件になる
    const source = listPosts();
    const before = source.length;
    const filtered = filterFeedPosts(source);
    expect(filtered).toHaveLength(65);
    expect(filtered.every((post) => post.authorId !== "u40")).toBe(true);
    expect(source).toHaveLength(before);
  });

  it("matches u40 and all 23 posts only for full-name forms or exact handle", () => {
    for (const q of [REAL_NAME, REAL_NAME_NO_SPACE, REAL_NAME_FULL_SPACE, "yui__photo"]) {
      const result = searchFacebook(q);
      expect(
        result.users.map((u) => u.id),
        q,
      ).toEqual(["u40"]);
      expect(result.posts, q).toHaveLength(23);
      expect(
        result.posts.every((post) => post.authorId === "u40"),
        q,
      ).toBe(true);
    }
  });

  it("never exposes u40 or u40 posts for empty/whitespace or generic/single-char queries", () => {
    const feed = listFeedPosts();
    const allPosts = listPosts();

    for (const q of ["", " ", "　"]) {
      expect(searchFacebook(q), q).toEqual({ users: [], posts: [] });
      const filteredFeed = filterPostsByQuery(feed, q);
      expect(filteredFeed, q).toHaveLength(65);
      expect(
        filteredFeed.some((post) => post.authorId === "u40"),
        q,
      ).toBe(false);

      // フィード用の事前フィルタを通していない全投稿でも u40 を返さない
      const filteredAll = filterPostsByQuery(allPosts, q);
      expect(filteredAll, q).toHaveLength(65);
      expect(
        filteredAll.some((post) => post.authorId === "u40"),
        q,
      ).toBe(false);
    }

    for (const q of [
      "UI",
      "写真",
      "雨",
      "高校",
      "神奈川",
      "o",
      "の",
      "服",
      FAMILY_NAME,
      GIVEN_NAME,
    ]) {
      const result = searchFacebook(q);
      expect(
        result.users.some((u) => u.id === "u40"),
        q,
      ).toBe(false);
      expect(
        result.posts.some((p) => p.authorId === "u40"),
        q,
      ).toBe(false);

      const filtered = filterPostsByQuery(allPosts, q);
      expect(
        filtered.some((p) => p.authorId === "u40"),
        q,
      ).toBe(false);
    }
  });

  it("resolves user by handle and lists friends", () => {
    const user = getUserByHandle("member04");
    expect(user?.displayName).toBe("メンバー04");
    const friends = listFriends("u4");
    expect(friends.some((f) => f.id === "u1")).toBe(true);
  });

  it("finds post by id and filters posts by author", () => {
    const post = getPostById("fbp-101");
    expect(post?.authorId).toBe("u4");
    const authorPosts = listPostsByAuthor("u4");
    expect(authorPosts.some((p) => p.id === "fbp-101")).toBe(true);
  });

  it("searches users and posts case-insensitively", () => {
    const result = searchFacebook("espresso");
    expect(result.posts.some((p) => p.id === "fbp-105")).toBe(true);
    const botSearch = searchFacebook("notice-bot");
    expect(botSearch.users.some((u) => u.id === "u35")).toBe(true);
  });

  it("ensures unique user ids/handles and valid, symmetric, u40-isolated friendIds", () => {
    const users = listUsers();
    const userById = new Map(users.map((user) => [user.id, user]));
    expect(userById.size).toBe(users.length);
    expect(new Set(users.map((user) => user.handle)).size).toBe(users.length);

    const u40 = userById.get("u40");
    expect(u40).toBeDefined();
    expect(u40?.friendIds).toEqual([]);

    for (const user of users) {
      expect(new Set(user.friendIds).size, `${user.id} の friendIds に重複があります`).toBe(
        user.friendIds.length,
      );
      for (const friendId of user.friendIds) {
        expect(friendId, `${user.id} が自分自身を友達に含めています`).not.toBe(user.id);
        expect(friendId, `${user.id} が u40 を友達に含めています`).not.toBe("u40");
        const friend = userById.get(friendId);
        expect(
          friend,
          `${user.id} の friendIds が未定義の ${friendId} を参照しています`,
        ).toBeDefined();
        expect(
          friend?.friendIds.includes(user.id),
          `${user.id} -> ${friendId} の friendIds が非対称です`,
        ).toBe(true);
      }
    }
  });

  it("has exactly 88 posts with unique post and comment ids", () => {
    const posts = listPosts();
    expect(posts.length).toBe(88);

    const postIds = new Set(posts.map((post) => post.id));
    expect(postIds.size).toBe(posts.length);

    const commentIds = posts.flatMap((post) => post.comments.map((comment) => comment.id));
    expect(new Set(commentIds).size).toBe(commentIds.length);
  });

  it("ensures every post authorId and comment authorId/postId are valid", () => {
    const userIds = new Set(listUsers().map((user) => user.id));
    for (const post of listPosts()) {
      expect(
        userIds.has(post.authorId),
        `投稿 ${post.id} の authorId ${post.authorId} が未定義です`,
      ).toBe(true);
      for (const comment of post.comments) {
        expect(
          comment.postId,
          `コメント ${comment.id} の postId が投稿 ${post.id} と一致しません`,
        ).toBe(post.id);
        expect(
          userIds.has(comment.authorId),
          `コメント ${comment.id} の authorId ${comment.authorId} が未定義です`,
        ).toBe(true);
      }
    }
  });

  it("ensures real calendar UTC timestamps and chronological consistency across users, posts, and comments", () => {
    const userById = new Map(listUsers().map((user) => [user.id, user]));

    for (const user of userById.values()) {
      expect(
        isValidIsoUtcSeconds(user.joinedAt),
        `ユーザー ${user.id} の joinedAt が不正です`,
      ).toBe(true);
    }

    for (const post of listPosts()) {
      expect(isValidIsoUtcSeconds(post.createdAt), `投稿 ${post.id} の createdAt が不正です`).toBe(
        true,
      );
      const author = userById.get(post.authorId);
      expect(author, `投稿 ${post.id} の投稿者 ${post.authorId} が見つかりません`).toBeDefined();
      if (author) {
        expect(
          post.createdAt >= author.joinedAt,
          `投稿 ${post.id} (${post.createdAt}) が投稿者 ${author.id} の joinedAt (${author.joinedAt}) より前です`,
        ).toBe(true);
      }

      for (const comment of post.comments) {
        expect(
          isValidIsoUtcSeconds(comment.createdAt),
          `コメント ${comment.id} の createdAt が不正です`,
        ).toBe(true);
        expect(
          comment.createdAt >= post.createdAt,
          `コメント ${comment.id} (${comment.createdAt}) が投稿 ${post.id} (${post.createdAt}) より前です`,
        ).toBe(true);
        const commenter = userById.get(comment.authorId);
        expect(
          commenter,
          `コメント ${comment.id} の投稿者 ${comment.authorId} が見つかりません`,
        ).toBeDefined();
        if (commenter) {
          expect(
            comment.createdAt >= commenter.joinedAt,
            `コメント ${comment.id} (${comment.createdAt}) が投稿者 ${commenter.id} の joinedAt (${commenter.joinedAt}) より前です`,
          ).toBe(true);
        }
      }
    }
  });

  it("ensures all local /talkup/ attachment assets exist under public/", () => {
    for (const post of listPosts()) {
      const src = post.attachment?.src;
      if (src?.startsWith("/talkup/")) {
        const assetPath = join(process.cwd(), "public", src.replace(/^\//, ""));
        expect(
          existsSync(assetPath),
          `投稿 ${post.id} の画像 ${src} が public/ に存在しません`,
        ).toBe(true);
      }
    }
  });

  it("keeps spoiler words and address tokens out of new posts (fbp-3xx / fbp-4xx) and new users (u41..u48)", () => {
    const newPosts = listPosts().filter((post) => /^fbp-[34]\d\d$/.test(post.id));
    expect(newPosts.length).toBe(80);
    for (const post of newPosts) {
      const texts = [
        post.body,
        post.feeling,
        post.attachment?.title,
        post.attachment?.subtitle,
        post.attachment?.alt,
        post.attachment?.src,
        ...post.comments.map((c) => c.body),
      ].filter((value): value is string => Boolean(value));

      for (const text of texts) {
        for (const spoiler of FORBIDDEN_WORDS) {
          expect(text.includes(spoiler), `投稿 ${post.id} に禁止語が含まれています`).toBe(false);
        }
        expect(text, `投稿 ${post.id} に住所表現が含まれています`).not.toMatch(ADDRESS_PATTERN);
      }
    }

    const newUsers = listUsers().filter((user) => /^u4[1-8]$/.test(user.id));
    expect(newUsers.length).toBe(8);
    for (const user of newUsers) {
      const texts = [user.displayName, user.handle, user.bio, user.workplace, user.location].filter(
        (value): value is string => Boolean(value),
      );
      for (const text of texts) {
        for (const spoiler of FORBIDDEN_WORDS) {
          expect(text.includes(spoiler), `ユーザー ${user.id} に禁止語が含まれています`).toBe(
            false,
          );
        }
        expect(text, `ユーザー ${user.id} に住所表現が含まれています`).not.toMatch(ADDRESS_PATTERN);
      }
    }
  });

  it("keeps meta terms out of all users and posts (case-insensitive)", () => {
    for (const user of listUsers()) {
      const fields = [
        user.displayName,
        user.handle,
        user.bio,
        user.workplace,
        user.location,
      ].filter((value): value is string => Boolean(value));
      for (const field of fields) {
        const lower = field.toLowerCase();
        for (const term of FORBIDDEN_META_TERMS) {
          expect(
            lower.includes(term),
            `ユーザー ${user.id} にメタ語「${term}」が含まれています`,
          ).toBe(false);
        }
      }
    }

    for (const post of listPosts()) {
      const fields = [
        post.body,
        post.feeling,
        post.attachment?.title,
        post.attachment?.subtitle,
        post.attachment?.alt,
        post.attachment?.src?.replace(/^\/talkup\//, ""),
        ...post.comments.map((c) => c.body),
      ].filter((value): value is string => Boolean(value));
      for (const field of fields) {
        const lower = field.toLowerCase();
        for (const term of FORBIDDEN_META_TERMS) {
          expect(lower.includes(term), `投稿 ${post.id} にメタ語「${term}」が含まれています`).toBe(
            false,
          );
        }
      }
    }
  });

  it("lists 23 posts for author u40", () => {
    const posts = listPostsByAuthor("u40");
    expect(posts.length).toBe(23);
  });
});
