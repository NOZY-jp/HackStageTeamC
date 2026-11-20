import { describe, expect, it } from "vitest";
import { getUserById, listPosts, listPostsByAuthor, searchFacebook } from "./index";

// 検査する語そのものをリポジトリに残さない（文字コードで組み立てる）
const word = (...codePoints: number[]) => String.fromCodePoint(...codePoints);
const FAMILY_NAME = word(0x670d, 0x90e8);
const GIVEN_NAME = word(0x7531, 0x6bd4);
const REAL_NAME = `${FAMILY_NAME} ${GIVEN_NAME}`;
const REGION = word(0x795e, 0x5948, 0x5ddd, 0x770c); // 神奈川県

/** 住所らしき表記（番地・建物名・最寄駅）が無いことを検査する。 */
const ADDRESS_PATTERN = /丁目|番地|号室|マンション|アパート|団地|\d+階|最寄り?駅/;

describe("第五章: 本名で見つかる TalkUp アカウント（#95）", () => {
  it("本名で検索すると、その本名のアカウントが結果に出る", () => {
    const result = searchFacebook(REAL_NAME);
    const target = result.users.find((user) => user.displayName === REAL_NAME);
    expect(target).toBeDefined();
    // 照合相手（BFF）のアカウントではなく、本人のアカウント
    expect(target?.id).toBe("u40");
    expect(result.users.some((user) => user.handle === "kanon__dayo")).toBe(false);
  });

  it("入学式の写真つき投稿がある", () => {
    const posts = listPostsByAuthor("u40");
    const entrance = posts.filter(
      (post) =>
        post.attachment?.kind === "photo" &&
        (post.body.includes("入学式") || (post.attachment?.title ?? "").includes("入学式")),
    );
    expect(entrance.length).toBeGreaterThanOrEqual(1);
    expect(entrance[0].attachment?.src?.startsWith("/talkup/")).toBe(true);
    expect(entrance[0].attachment?.alt?.length).toBeGreaterThan(0);
  });

  it("プライベートな写真つき投稿が複数ある", () => {
    const photoPosts = listPostsByAuthor("u40").filter(
      (post) => post.attachment?.kind === "photo" && Boolean(post.attachment.src),
    );
    expect(photoPosts.length).toBeGreaterThanOrEqual(2);
    // 友達限定の投稿も含む（公開だけではない）
    expect(photoPosts.some((post) => post.audience === "friends")).toBe(true);
  });

  it("説明から出身地域（都道府県）が分かる", () => {
    const user = getUserById("u40");
    expect(user?.location).toBe(REGION);
    const text = listPostsByAuthor("u40")
      .map((post) =>
        [post.body, post.attachment?.title, post.attachment?.subtitle, post.attachment?.alt].join(
          " ",
        ),
      )
      .join("\n");
    expect(text).toContain(REGION);
    // 湘南（神奈川の地域名）でも補強している
    expect(text).toContain(word(0x6e58, 0x5357));
  });

  it("住所（番地・建物名・最寄駅）はデータに存在しない", () => {
    const user = getUserById("u40");
    const posts = listPosts().filter((post) => post.authorId === "u40");
    const text = [
      user?.bio,
      user?.location,
      user?.workplace,
      ...posts.map((post) =>
        [
          post.body,
          post.attachment?.title,
          post.attachment?.subtitle,
          post.attachment?.alt,
          ...post.comments.map((comment) => comment.body),
        ].join(" "),
      ),
    ]
      .filter(Boolean)
      .join("\n");
    expect(text).not.toMatch(ADDRESS_PATTERN);
  });
});
