import { describe, expect, it } from "vitest";
import {
  getUserById,
  listContactUsers,
  listPosts,
  listPostsByAuthor,
  listUsers,
  searchFacebook,
} from "./index";

// 検査する語そのものをリポジトリに残さない（文字コードで組み立てる）
const word = (...codePoints: number[]) => String.fromCodePoint(...codePoints);
const FAMILY_NAME = word(0x670d, 0x90e8);
const GIVEN_NAME = word(0x7531, 0x6bd4);
const REAL_NAME = `${FAMILY_NAME} ${GIVEN_NAME}`;
const REAL_NAME_NO_SPACE = `${FAMILY_NAME}${GIVEN_NAME}`;
const REAL_NAME_FULL_SPACE = `${FAMILY_NAME}　${GIVEN_NAME}`;
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
    expect(target?.handle).toBe("yui__photo");
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

  it("写真つき投稿が複数あり、当時そのまま公開設定になっている", () => {
    const photoPosts = listPostsByAuthor("u40").filter(
      (post) => post.attachment?.kind === "photo" && Boolean(post.attachment.src),
    );
    expect(photoPosts.length).toBeGreaterThanOrEqual(2);
    // 絞り忘れて公開のまま（新しい閲覧制御は作らない）
    for (const post of photoPosts) {
      expect(post.audience).toBe("public");
      // 投稿日時は2018〜2020年（2026年の失踪と矛盾させない）
      const year = post.createdAt.slice(0, 4);
      expect(year >= "2018").toBe(true);
      expect(year <= "2020").toBe(true);
    }
  });

  it("handle は本名ローマ字ではなく yui__photo、写真の題名は旧ブログの受賞作と別", () => {
    expect(getUserById("u40")?.handle).toBe("yui__photo");
    const titles = listPostsByAuthor("u40")
      .map((post) => post.attachment?.title ?? "")
      .filter(Boolean);
    expect(titles).toContain("冬の海");
    expect(titles).toContain("高校の友達と");
    expect(titles).not.toContain("帰り道");
    expect(titles).not.toContain("大学の友達と");
  });

  it("本名は空白の有無（半角・全角）どちらでも本人の投稿だけが返る", () => {
    for (const query of [REAL_NAME, REAL_NAME_NO_SPACE, REAL_NAME_FULL_SPACE]) {
      const result = searchFacebook(query);
      const users = result.users.filter((user) => user.id === "u40");
      expect(users, query).toHaveLength(1);
      // データが増えても、本名検索に乗るのは本人の投稿だけ
      expect(result.posts.length, query).toBeGreaterThanOrEqual(3);
      expect(result.posts.length, query).toBe(listPostsByAuthor("u40").length);
      expect(
        result.posts.every((post) => post.authorId === "u40"),
        query,
      ).toBe(true);
    }
  });

  it("検索前の「連絡先」に本名のアカウントは出さない", () => {
    const contacts = listContactUsers();
    expect(contacts.some((user) => user.id === "u40")).toBe(false);
    // 他の人物は残す
    expect(contacts.length).toBe(listUsers().length - 1);
    expect(contacts.length).toBeGreaterThan(0);
  });

  it("入学式の投稿はアカウント作成（joinedAt）より後にある", () => {
    const joinedAt = getUserById("u40")?.joinedAt ?? "";
    // 入学式は2018年4月（投稿日より前にアカウントがある）
    expect(joinedAt.slice(0, 10)).toBe("2018-04-01");
    for (const post of listPostsByAuthor("u40")) {
      expect(post.createdAt > joinedAt).toBe(true);
    }
  });

  it("説明から出身地域（都道府県）が分かる", () => {
    const user = getUserById("u40");
    expect(user?.location).toBe(REGION);
    const postsText = listPostsByAuthor("u40")
      .map((post) =>
        [
          post.body,
          post.attachment?.title,
          post.attachment?.subtitle,
          post.attachment?.alt,
          ...post.comments.map((comment) => comment.body),
        ].join(" "),
      )
      .join("\n");
    expect(postsText).toContain(REGION);
    const fullText = [user?.bio, user?.workplace, user?.location, postsText]
      .filter(Boolean)
      .join("\n");
    // 地名は都道府県まで（湘南などの地域名は使わない）
    expect(fullText).not.toContain(word(0x6e58, 0x5357));
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
