import { describe, expect, it } from "vitest";
import {
  getPost,
  getProfile,
  getUserByHandle,
  isProtected,
  listPosts,
  listReplies,
  listUsers,
  searchPosts,
  searchUsers,
} from "./index";

/** 旧アカウントの今の handle（改名後）。旧 @hunter_denden0102 はもう誰も使っていない。 */
const RENAMED_HANDLE = "maimai_mhw";
const OLD_HANDLE = "hunter_denden0102";
const KANON_HANDLE = "kanon__dayo";
// 段階2の返信者（まいのリア友とみられる人物。表示名・handle は #76 未確定の仮決め）
const FRIEND_HANDLE = "tomo-0718";
const ARTICLE_TITLE = "写真コンテストで賞をもらいました！";

// 検査する語そのものをリポジトリに残さない（文字コードで組み立てる）
const word = (...codePoints: number[]) => String.fromCodePoint(...codePoints);
const BLOG_NAME = word(0x3067, 0x3093, 0x3067, 0x3093, 0x306e, 0x72e9, 0x731f, 0x65e5, 0x8a18);
const DEN = word(0x3067, 0x3093, 0x3061, 0x3083, 0x3093);
const FAMILY_NAME = word(0x670d, 0x90e8);
const GIVEN_NAME = word(0x7531, 0x6bd4);

const kanon = getUserByHandle(KANON_HANDLE);
const friend = getUserByHandle(FRIEND_HANDLE);

/** ユーザーとプロフィール（bio・joinedAt）を合わせた一覧。 */
const accounts = () =>
  listUsers().map((user) => ({
    ...user,
    bio: getProfile(user.id)?.bio ?? "",
    joinedAt: getProfile(user.id)?.joinedAt ?? "",
  }));

describe("第三章 Twitter 側（#94）", () => {
  it("順序2: 攻略の投稿に、リア友とみられる人物がブログ名を挙げて「にも書いてたよな」とリプライしている", () => {
    const strategyPost = listPosts().find((post) => post.id === "post-101");
    expect(strategyPost).toBeDefined();
    expect(strategyPost?.body).toContain("双剣");
    // 2018〜2020年ごろ（クラッチクローは2019年のアイスボーン）
    const year = strategyPost?.postedAt.slice(0, 4) ?? "";
    expect(year >= "2018").toBe(true);
    expect(year <= "2020").toBe(true);

    const replies = listReplies("post-101");
    const fromFriend = replies.filter((reply) => reply.authorId === friend?.id);
    expect(fromFriend).toHaveLength(1);
    // 「別の場所にも」の含み ＋ ブログ名そのもの（順序3 でそのまま検索語になる）
    expect(fromFriend[0].body).toContain("ブログ");
    expect(fromFriend[0].body).toContain("にも書いて");
    expect(fromFriend[0].body).toContain(BLOG_NAME);
    // Twixer 内の検索でもブログ名からこのリプライに辿れる
    expect(searchPosts(BLOG_NAME).map((post) => post.id)).toEqual(["post-102"]);
    expect(strategyPost?.authorId).not.toBe(friend?.id);
    // 返信者はかのんではない（かのんは旧アカウントの bio の BFF 行から見つける）
    expect(replies.some((reply) => reply.authorId === kanon?.id)).toBe(false);
  });

  it("8b: 記事名で検索すると、改名して鍵垢になった旧アカウントが出る", () => {
    const results = searchUsers(ARTICLE_TITLE);
    expect(results.map((user) => user.handle)).toContain(RENAMED_HANDLE);

    const old = results.find((user) => user.handle === RENAMED_HANDLE);
    expect(isProtected(old)).toBe(true);
    // 今の表示名は「まいまい」（改名後）
    expect(old?.displayName).toBe("まいまい");

    // 旧ハンドルは誰の handle でもない（改名済みで、リンクは 404 になる）
    expect(accounts().some((account) => account.handle === OLD_HANDLE)).toBe(false);
    expect(accounts().every((account) => !account.handle.includes("hunter_denden"))).toBe(true);

    // 旧名は bio から直接読める（handle の先頭一致では通らない形で検査する）
    const profile = accounts().find((candidate) => candidate.handle === RENAMED_HANDLE);
    expect(profile?.bio).toContain(OLD_HANDLE);
    // 旧表示名は旧ハンドルの部分文字列としてではなく、独立した要素として bio に残す
    const bioWithoutOldHandle = (profile?.bio ?? "").replaceAll(OLD_HANDLE, "");
    expect(bioWithoutOldHandle).toContain("hunter_denden");
    // 記事名も bio にあり、記事名検索でこのアカウントに届く
    expect(profile?.bio).toContain(ARTICLE_TITLE);
    expect(old?.handle).not.toBe("maimaimaimai");
    expect(old?.handle).not.toContain("hunter_denden");

    // 鍵垢なので投稿本文は読めない（プロフィールだけ）
    expect(listPosts().some((post) => post.authorId === old?.id)).toBe(false);
    expect(getPost("post-103")).toBeDefined();
  });

  it("旧アカウントは旧ブログの最古記事より前から存在する（2017-12-01）", () => {
    const old = accounts().find((account) => account.handle === RENAMED_HANDLE);
    expect(old?.joinedAt).toBe("2017-12-01");
    // 旧ブログの最古記事（2018-01-27）より前
    expect((old?.joinedAt ?? "") < "2018-01-27").toBe(true);
  });

  it("現在のアカウントの handle は正本どおり mai2mai2", () => {
    const mai = accounts().find((account) => account.handle === "mai2mai2");
    expect(mai?.id).toBe("tw-mai");
    expect(accounts().some((account) => account.handle === "mai")).toBe(false);
    // メンションの表示も新しい handle に揃っている
    const mentions = listPosts().filter((post) => post.body.includes("@mai"));
    expect(mentions.length).toBeGreaterThan(0);
    for (const post of mentions) {
      expect(post.body).toContain("@mai2mai2");
    }
  });

  it("8b: 旧アカウントの作者が2019年の投稿を書いている（現在のアカウントで読める）", () => {
    const post = getPost("post-101");
    expect(post?.authorId).toBe("tw-mai");
    const mai = accounts().find((account) => account.handle === "mai2mai2");
    expect(mai).toBeDefined();
    // アカウント作成が投稿日より前（投稿できない矛盾を作らない）
    expect((mai?.joinedAt ?? "") < (post?.postedAt ?? "")).toBe(true);
    expect(mai?.joinedAt.startsWith("2019")).toBe(true);
  });

  it("8c: 旧アカウントの Bio に BFF かのんのアカウントがある", () => {
    const result = searchUsers(`@${KANON_HANDLE}`).map((user) => user.handle);
    expect(result).toContain(RENAMED_HANDLE);
    const old = searchUsers(ARTICLE_TITLE).find((user) => user.handle === RENAMED_HANDLE);
    expect(old).toBeDefined();
  });

  it("8d: かのんの写真つき投稿が複数あり、人物の名前を断定しない", () => {
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
    // 投稿は撮影者の普通の思い出。名前（本名・呼び名）は書かない
    expect(text).not.toContain(FAMILY_NAME);
    expect(text).not.toContain(GIVEN_NAME);
    expect(text).not.toContain(DEN);
    // 同じ写真を2つの投稿で使い回さない
    const sources = photoPosts.flatMap((post) => (post.media ?? []).map((media) => media.src));
    expect(new Set(sources).size).toBe(sources.length);
  });

  it("リプライはブログ名を出すが、本名・家族内の呼び名は出さない", () => {
    const replies = listPosts()
      .filter((post) => post.replyToId === "post-101")
      .map((post) => post.body);
    expect(replies.length).toBeGreaterThan(0);
    // ブログ名は順序3の検索語なのでリプライに必須
    expect(replies.join("\n")).toContain(BLOG_NAME);
    for (const body of replies) {
      expect(body).not.toContain(FAMILY_NAME);
      expect(body).not.toContain(GIVEN_NAME);
      expect(body).not.toContain(DEN);
    }
  });
});
