import { describe, expect, it } from "vitest";
import { getUserByHandle, listPostsByAuthor, listReplies } from "./index";

const OLD_HANDLE = "hunter_denden0102";
const KANON_HANDLE = "kanon__dayo";

// 検査する語そのものをリポジトリに残さない（文字コードで組み立てる）
const word = (...codePoints: number[]) => String.fromCodePoint(...codePoints);
const BLOG_NAME = word(0x3067, 0x3093, 0x3067, 0x3093, 0x306e, 0x72e9, 0x731f, 0x65e5, 0x8a18);
const DEN = word(0x3067, 0x3093, 0x3061, 0x3083, 0x3093);
const FAMILY_NAME = word(0x670d, 0x90e8);
const GIVEN_NAME = word(0x7531, 0x6bd4);

const oldUser = getUserByHandle(OLD_HANDLE);
const kanon = getUserByHandle(KANON_HANDLE);

describe("順序2: 旧アカウントへのリア友リプライ（#94）", () => {
  it("旧アカウントが台帳に居て、表示名は hunter_denden", () => {
    expect(oldUser).toBeDefined();
    expect(oldUser?.displayName).toBe("hunter_denden");
    expect(kanon?.displayName).toBe("かのん");
    // 今のアカウント（Discord の maimaimaimai）とは別物
    expect(oldUser?.handle).not.toBe("maimaimaimai");
  });

  it("旧アカウントの投稿は 2018〜2020年（今のアカウントとは時期が離れている）", () => {
    const posts = listPostsByAuthor(oldUser?.id ?? "missing");
    expect(posts.length).toBeGreaterThanOrEqual(2);
    for (const post of posts) {
      expect(post.postedAt.slice(0, 4) >= "2018").toBe(true);
      expect(post.postedAt.slice(0, 4) <= "2020").toBe(true);
    }
  });

  it("かのんが旧アカウントの投稿に「書いてた」とリプライしている", () => {
    const posts = listPostsByAuthor(oldUser?.id ?? "missing");
    const replies = posts.flatMap((post) =>
      listReplies(post.id).filter((reply) => reply.authorId === kanon?.id),
    );
    expect(replies.length).toBeGreaterThan(0);
    for (const reply of replies) {
      expect(reply.body).toContain("書いて");
    }
  });

  it("リプライにも旧アカウントの投稿にも、ブログ名・本名・家族内の呼び名を出さない", () => {
    const posts = listPostsByAuthor(oldUser?.id ?? "missing");
    const texts = [
      ...posts.map((post) => post.body),
      ...posts.flatMap((post) => listReplies(post.id).map((reply) => reply.body)),
    ];
    for (const text of texts) {
      expect(text).not.toContain(BLOG_NAME);
      expect(text).not.toContain(FAMILY_NAME);
      expect(text).not.toContain(GIVEN_NAME);
      expect(text).not.toContain(DEN);
    }
  });
});
