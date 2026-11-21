import { describe, expect, it } from "vitest";
import {
  getPost,
  getUser,
  getUserByHandle,
  isProtected,
  listFollowingIds,
  listHomePosts,
  listPosts,
  listPostsByAuthor,
  listReplies,
  listTrends,
  listUsers,
  searchPosts,
  searchUsers,
  TWITTER_ME_ID,
} from "./index";

describe("lib/twitter-like のアクセサ", () => {
  it("listPosts は postedAt 降順で返す", () => {
    const times = listPosts().map((post) => post.postedAt);
    expect(times).toEqual([...times].sort().reverse());
  });

  it("listPostsByAuthor は authorId の投稿だけを返す", () => {
    for (const user of listUsers()) {
      for (const post of listPostsByAuthor(user.id)) {
        expect(post.authorId).toBe(user.id);
      }
    }
  });

  it("存在しないIDでは undefined / 空配列を返す", () => {
    expect(getPost("missing-post")).toBeUndefined();
    expect(getUser("missing-user")).toBeUndefined();
    expect(getUserByHandle("missing-handle")).toBeUndefined();
    expect(listPostsByAuthor("missing-user")).toEqual([]);
    expect(listReplies("missing-post")).toEqual([]);
  });

  it("戻り値を書き換えても内部状態が変わらない（深いコピー）", () => {
    const before = getPost("post-002")?.body;
    const post = getPost("post-002");
    if (post) {
      post.body = "書き換え";
    }
    expect(getPost("post-002")?.body).toBe(before);
  });
});

describe("ホームのタイムライン（listHomePosts）", () => {
  it("フォロー中のアカウントと自分の投稿だけを新しい順で返す", () => {
    const home = listHomePosts(TWITTER_ME_ID);
    const authors = new Set(home.map((post) => post.authorId));
    // リョウ（tw-hal）がフォローしているのは Mai・ソウだけ
    expect(listFollowingIds(TWITTER_ME_ID).sort()).toEqual(["tw-mai", "tw-sou"]);
    expect([...authors].sort()).toEqual(["tw-hal", "tw-mai", "tw-sou"]);
    const times = home.map((post) => post.postedAt);
    expect(times).toEqual([...times].sort().reverse());
  });

  it("フォローしていない人の投稿と開設前の古い投稿はホームに出ないが他の面からは辿れる", () => {
    const ids = listHomePosts(TWITTER_ME_ID).map((post) => post.id);
    // フォローしていない人の投稿（リア友の返信・かのんの投稿）は出ない
    expect(ids).not.toContain("post-102");
    expect(ids).not.toContain("post-103");
    expect(ids).not.toContain("post-104");
    expect(ids).not.toContain("post-105");
    // フォロー中の Mai の投稿でも、リョウの開設（2026-11）前の2019年の投稿は出ない
    expect(ids).not.toContain("post-101");
    // それらは検索・個別ページから従来どおり辿れる（消してはいない）
    expect(getPost("post-101")).toBeDefined();
    expect(getPost("post-103")).toBeDefined();
    expect(listReplies("post-101").map((post) => post.id)).toEqual(["post-102"]);
    expect(searchPosts("スキル枠").map((post) => post.id)).toEqual(["post-101"]);
    // フォロー中・自分の近況の投稿は出る
    expect(ids).toContain("post-014");
    expect(ids).toContain("post-023");
  });

  it("返信はホームに出さない", () => {
    const home = listHomePosts(TWITTER_ME_ID);
    expect(home.every((post) => !post.replyToId)).toBe(true);
  });
});

describe("鍵アカウントの投稿の扱い", () => {
  it("isProtected は protected フラグのあるユーザーだけ true を返す", () => {
    const protectedHandles = listUsers()
      .filter((user) => isProtected(user))
      .map((user) => user.handle);
    // 旧アカウント（#94）は鍵垢
    expect(protectedHandles).toContain("maimai_mhw");
  });

  it("listPosts / getPost は鍵垢の投稿を公開面に出さない", () => {
    const lockedUser = listUsers().find((user) => isProtected(user));
    const lockedPostIds = listPostsByAuthor(lockedUser?.id ?? "missing-author").map(
      (post) => post.id,
    );
    expect(lockedPostIds.length).toBeGreaterThan(0);

    const visibleIds = listPosts().map((post) => post.id);
    for (const id of lockedPostIds) {
      expect(visibleIds).not.toContain(id);
      expect(getPost(id)).toBeUndefined();
    }
    // 公開アカウントの投稿は従来どおり取れる
    expect(getPost("post-002")).toBeDefined();
  });

  it("listReplies にも鍵垢の返信は混ざらない", () => {
    const protectedIds = new Set(
      listUsers()
        .filter((user) => isProtected(user))
        .map((user) => user.id),
    );
    expect(protectedIds.size).toBeGreaterThan(0);
    for (const post of listPosts()) {
      for (const reply of listReplies(post.id)) {
        expect(protectedIds.has(reply.authorId)).toBe(false);
      }
    }
    // 公開投稿への返信は公開アカウントの返信だけ
    const repliesToPublicPost = listReplies("post-003").map((reply) => reply.id);
    expect(repliesToPublicPost).toEqual(["post-004"]);
    // 鍵垢の投稿への返信（post-202、同じ鍵垢からの自己返信）は公開面に出ない
    expect(listReplies("post-201")).toEqual([]);
  });

  it("listPostsByAuthor は件数表示のため鍵垢の投稿も含める", () => {
    const lockedUser = listUsers().find((user) => isProtected(user));
    const own = listPostsByAuthor(lockedUser?.id ?? "missing-author");
    // 公開面では除外される同じ投稿が、本人の件数にはすべて含まれる
    expect(own.map((post) => post.id).sort()).toEqual(["post-201", "post-202", "post-203"]);
    for (const post of own) {
      expect(getPost(post.id)).toBeUndefined();
    }
  });
});

describe("searchPosts", () => {
  it("本文に語を含む投稿を新しい順で返す", () => {
    const posts = searchPosts("眠");
    expect(posts.map((post) => post.id)).toEqual(["post-023", "post-018"]);
  });

  it("空白区切りの語をすべて含む投稿だけに絞る", () => {
    const posts = searchPosts("kohakunchos0117 待ってる");
    expect(posts.map((post) => post.id)).toEqual(["post-011"]);
  });

  it("先頭の # と @ は検索語から外す", () => {
    expect(searchPosts("#紅葉").map((post) => post.id)).toEqual(
      searchPosts("紅葉").map((post) => post.id),
    );
    expect(searchPosts("@kohakunchos0117").map((post) => post.id)).toEqual(
      searchPosts("kohakunchos0117").map((post) => post.id),
    );
  });

  it("大文字小文字は区別しない", () => {
    expect(searchPosts("KOHAKUNCHOS0117").map((post) => post.id)).toEqual(
      searchPosts("kohakunchos0117").map((post) => post.id),
    );
  });

  it("空のクエリでは何も返さない", () => {
    expect(searchPosts("")).toEqual([]);
    expect(searchPosts("   ")).toEqual([]);
  });

  it("投稿者の表示名・handleも検索対象にする", () => {
    // displayName「Hal」とhandle「kohakunchos0117」が別文字列の fixture で、
    // 片方の経路が壊れても検出できるようにそれぞれ独立に検証する
    expect(searchPosts("Hal").map((post) => post.id)).toContain("post-002");
    expect(searchPosts("kohakunchos0117").map((post) => post.id)).toContain("post-002");
    // 本文に handle を含まない tw-hal 本人の投稿も返る
    expect(searchPosts("kohakunchos0117").map((post) => post.id)).toContain("post-014");
  });

  it("鍵アカウントの投稿は検索結果に出さない", () => {
    // 旧垢（tw-old-denden・鍵垢）の post-201〜203 の本文に一致する語で探しても出てこない
    expect(searchPosts("モンスターハンターワールド")).toEqual([]);
    expect(searchPosts("ブログもはじめてみた")).toEqual([]);
    // 「ブログ」で見つかるのは公開の返信（post-102）だけ。鍵垢の投稿（post-202/203）は出ない
    expect(searchPosts("ブログ").map((post) => post.id)).toEqual(["post-102"]);
  });
});

describe("twitterTrends（いま話題）", () => {
  it("どのトレンドも検索で1件以上見つかる（行き止まりにしない）", () => {
    const trends = listTrends();
    expect(trends.length).toBeGreaterThan(0);
    // トレンドを押すとその名前で検索されるので、0件になる名前は置かない
    const deadEnds = trends
      .filter((trend) => searchPosts(trend.name).length === 0)
      .map((trend) => trend.name);
    expect(deadEnds).toEqual([]);
  });

  it("どのトレンドもゲーム仲間の雑談にしか着弾しない（手がかりの投稿に直行させない）", () => {
    // リョウがこの SNS で知っているのは Hal・Mai・ソウだけ。
    // かのん・リア友・旧アカウントの投稿に着弾する名前はトレンドに置かない
    const smallTalkAuthors = new Set(["tw-hal", "tw-mai", "tw-sou"]);
    // 段階2の手がかり投稿。post-101 は Mai 本人の投稿なので authorId だけでは弾けない
    const cluePostIds = new Set(["post-101", "post-102"]);
    for (const trend of listTrends()) {
      const hits = searchPosts(trend.name);
      expect(hits.length).toBeGreaterThan(0);
      for (const hit of hits) {
        expect(smallTalkAuthors.has(hit.authorId)).toBe(true);
        expect(cluePostIds.has(hit.id)).toBe(false);
      }
    }
  });
});

describe("searchUsers", () => {
  it("handle・displayName・bio を対象に検索する", () => {
    expect(searchUsers("kohakunchos0117").map((user) => user.id)).toEqual(["tw-hal"]);
    expect(searchUsers("ソウ").map((user) => user.id)).toEqual(["tw-sou"]);
    const bioMatch = searchUsers("古い友達");
    expect(bioMatch.map((user) => user.id)).toEqual(["tw-kanon"]);
  });

  it("過去ブログの記事タイトル等で旧アカウントをユーザー検索できる（単体の一般語「ブログ」では出さない）", () => {
    expect(searchUsers("弓属性強化ガン積み構成").map((user) => user.handle)).toContain(
      "maimai_mhw",
    );
    expect(searchUsers("ブログはじめました！").map((user) => user.handle)).toContain("maimai_mhw");
    expect(searchUsers("ブログ")).toEqual([]);
  });

  it("空のクエリでは何も返さない", () => {
    expect(searchUsers("")).toEqual([]);
  });
});
