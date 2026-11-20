import { describe, expect, it } from "vitest";
import {
  getPost,
  getUserByHandle,
  isProtected,
  listPosts,
  listReplies,
  searchUsers,
} from "./index";

const OLD_HANDLE = "hunter_denden0102";
const KANON_HANDLE = "kanon__dayo";
const ARTICLE_TITLE = "写真コンテストで賞をもらいました！";

// 検査する語そのものをリポジトリに残さない（文字コードで組み立てる）
const word = (...codePoints: number[]) => String.fromCodePoint(...codePoints);
const BLOG_NAME = word(0x3067, 0x3093, 0x3067, 0x3093, 0x306e, 0x72e9, 0x731f, 0x65e5, 0x8a18);
const DEN = word(0x3067, 0x3093, 0x3061, 0x3083, 0x3093);
const FAMILY_NAME = word(0x670d, 0x90e8);
const GIVEN_NAME = word(0x7531, 0x6bd4);

const _oldUser = getUserByHandle(OLD_HANDLE);
const kanon = getUserByHandle(KANON_HANDLE);

describe("第三章 Twitter 側（#94）", () => {
  it("順序2: 攻略の投稿に、かのんの「前にも書いてたよな」リプライが読める", () => {
    const strategyPost = listPosts().find((post) => post.id === "post-101");
    expect(strategyPost).toBeDefined();
    expect(strategyPost?.body).toContain("双剣");

    const replies = listReplies("post-101");
    const fromKanon = replies.filter((reply) => reply.authorId === kanon?.id);
    expect(fromKanon).toHaveLength(1);
    expect(fromKanon[0].body).toContain("書いて");
    // 誰の投稿かを限定しない（投稿者はかのん本人ではない）
    expect(strategyPost?.authorId).not.toBe(kanon?.id);
  });

  it("8b: 記事名で検索すると、改名して鍵垢になった旧アカウントが出る", () => {
    const results = searchUsers(ARTICLE_TITLE);
    expect(results.map((user) => user.handle)).toContain(OLD_HANDLE);

    const old = results.find((user) => user.handle === OLD_HANDLE);
    expect(isProtected(old)).toBe(true);
    // 旧名（ハンドル）が読める。現在のアカウントとは別物
    expect(old?.handle).toBe("hunter_denden0102");
    expect(old?.handle).not.toBe("maimaimaimai");

    // 鍵垢なので投稿本文は読めない（プロフィールだけ）
    expect(listPosts().some((post) => post.authorId === old?.id)).toBe(false);
    expect(getPost("post-103")).toBeDefined();
  });

  it("8c: 旧アカウントの Bio に BFF かのんのアカウントがある", () => {
    const result = searchUsers(`@${KANON_HANDLE}`).map((user) => user.handle);
    expect(result).toContain(OLD_HANDLE);
    const old = searchUsers(ARTICLE_TITLE).find((user) => user.handle === OLD_HANDLE);
    expect(old).toBeDefined();
  });

  it("8d: かのんの写真つき投稿が複数あり、断定しない語彙で仲が良さそうと読める", () => {
    const photoPosts = listPosts().filter(
      (post) => post.authorId === kanon?.id && (post.media?.length ?? 0) > 0,
    );
    expect(photoPosts.length).toBeGreaterThanOrEqual(2);
    for (const post of photoPosts) {
      expect(post.media?.length).toBeGreaterThan(0);
      for (const media of post.media ?? []) {
        expect(media.alt.length).toBeGreaterThan(0);
        expect(media.src.startsWith("/twitter-like/")).toBe(true);
      }
    }
    const text = photoPosts.map((post) => post.body).join("\n");
    expect(text).toMatch(/仲良さそう/);
    expect(text).toMatch(/分からない/);
  });

  it("リプライの本文にブログ名・本名・家族内の呼び名を出さない", () => {
    const replies = listPosts()
      .filter((post) => post.replyToId === "post-101")
      .map((post) => post.body);
    expect(replies.length).toBeGreaterThan(0);
    for (const body of replies) {
      expect(body).not.toContain(BLOG_NAME);
      expect(body).not.toContain(FAMILY_NAME);
      expect(body).not.toContain(GIVEN_NAME);
      expect(body).not.toContain(DEN);
    }
  });
});
