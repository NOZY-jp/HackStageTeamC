import {
  twitterFollows,
  twitterPosts,
  twitterProfiles,
  twitterTrends,
  twitterUsers,
} from "./data/twitter";
import {
  getTwitterConversation,
  lastTwitterMessage,
  listTwitterConversations,
  peerIdOf,
  TWITTER_ME_ID,
  type TwitterConversation,
} from "./data/twitter-messages";
import type { Post, Profile, Trend, TwitterUser } from "./types";

/**
 * Twitter-like SNS のダミーデータへのアクセサ。
 * Discord like UI とは名前空間を分ける（データの相互参照はしない）。
 * すべて同期・純関数で、返す値は毎回ディープコピーする。
 */
const copyOf = <T>(value: T): T => structuredClone(value);

const byPostedAtDesc = (a: Post, b: Post): number => b.postedAt.localeCompare(a.postedAt);

/**
 * 鍵アカウントの判定。プロフィール情報は公開のまま、投稿一覧だけを隠す。
 * 公開面のフィルタとプロフィールの非公開表示で共有する唯一の判定場所にし、
 * あとで閲覧可否（canView 相当）へ差し替えるときはこの関数だけを変える。
 */
export function isProtected(user: TwitterUser | undefined): boolean {
  return user?.protected === true;
}

/**
 * 鍵アカウントの投稿は公開面（タイムライン・返信・個別ページ）に出さない。
 * listPostsByAuthor だけは件数表示のためフィルタしない。
 */
const isVisiblePost = (post: Post): boolean => {
  const author = twitterUsers.find((candidate) => candidate.id === post.authorId);
  return !isProtected(author);
};

/** 全投稿（返信を含む）を新しい順で返す。鍵アカウントの投稿は除く。 */
export function listPosts(): Post[] {
  return copyOf([...twitterPosts].filter(isVisiblePost).sort(byPostedAtDesc));
}

/** viewer がフォローしているアカウントの id を返す（自分自身は含まない）。 */
export function listFollowingIds(viewerId: string): string[] {
  return [...(twitterFollows[viewerId] ?? [])];
}

/**
 * ホームのタイムライン（おすすめ・フォロー中で共通）。返信を除くトップレベルの
 * 投稿を新しい順で返す。出るのは「フォロー中のアカウントと自分が、自分の参加
 * 以降に書いた投稿」だけ — フォローしていない人（かのん）の投稿と、自分が
 * アカウントを開く前の古い投稿（2019年の攻略投稿など）はホームに出さない。
 * それらは検索・プロフィール・個別投稿ページから従来どおり辿れる。
 */
export function listHomePosts(viewerId: string): Post[] {
  const follows = new Set([viewerId, ...(twitterFollows[viewerId] ?? [])]);
  const joinedAt = twitterProfiles.find((profile) => profile.userId === viewerId)?.joinedAt ?? "";
  return copyOf(
    twitterPosts
      .filter(isVisiblePost)
      .filter((post) => !post.replyToId && follows.has(post.authorId) && post.postedAt >= joinedAt)
      .sort(byPostedAtDesc),
  );
}

/**
 * 「おすすめ」のタイムライン。フォローしていない人の投稿も含めるが、
 * 物語の順序を守るため、かのんと旧アカウントは出さない（#209/#212）。
 * 返信と、昔すぎる投稿は出さない。
 */
export function listRecommendedPosts(viewerId: string): Post[] {
  const hidden = new Set(["tw-kanon", "tw-old-denden"]);
  const since = "2026-08-01T00:00:00+09:00";
  return copyOf(
    twitterPosts
      .filter(isVisiblePost)
      .filter((post) => !post.replyToId && !hidden.has(post.authorId) && post.postedAt >= since)
      .sort(byPostedAtDesc),
  );
}

export function getPost(id: string): Post | undefined {
  const post = twitterPosts.find((candidate) => candidate.id === id);
  return post && isVisiblePost(post) ? copyOf(post) : undefined;
}

/** authorId は TwitterUser.id。返信も含め新しい順。鍵アカウント自身の投稿も含む。 */
export function listPostsByAuthor(authorId: string): Post[] {
  return copyOf(twitterPosts.filter((post) => post.authorId === authorId).sort(byPostedAtDesc));
}

/** 指定投稿への返信を古い順で返す。鍵アカウントの返信は除く。 */
export function listReplies(postId: string): Post[] {
  return copyOf(
    twitterPosts
      .filter((post) => post.replyToId === postId && isVisiblePost(post))
      .sort((a, b) => -byPostedAtDesc(a, b)),
  );
}

/** SNS 側のユーザー一覧。 */
export function listUsers(): TwitterUser[] {
  return copyOf(twitterUsers);
}

export function getUser(id: string): TwitterUser | undefined {
  const user = twitterUsers.find((candidate) => candidate.id === id);
  return user ? copyOf(user) : undefined;
}

export function getUserByHandle(handle: string): TwitterUser | undefined {
  const user = twitterUsers.find((candidate) => candidate.handle === handle);
  return user ? copyOf(user) : undefined;
}

export function getProfile(userId: string): Profile | undefined {
  const profile = twitterProfiles.find((candidate) => candidate.userId === userId);
  return profile ? copyOf(profile) : undefined;
}

export function listTrends(): Trend[] {
  return copyOf(twitterTrends);
}

/** 検索語を小文字の語に分ける。先頭の # と @ は無視する。 */
function toTerms(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .map((term) => term.replace(/^[#@]+/, ""))
    .filter(Boolean);
}

/** haystack がすべての語を含むか（大文字小文字は無視）。 */
function matchesAllTerms(haystack: string, terms: string[]): boolean {
  if (terms.length === 0) {
    return false;
  }
  const normalized = haystack.toLowerCase();
  return terms.every((term) => normalized.includes(term));
}

/**
 * 投稿を検索する（本文と投稿者の表示名・handleを対象・新しい順）。返信も対象に含める。
 * 鍵アカウントの投稿は除く。
 */
export function searchPosts(query: string): Post[] {
  const terms = toTerms(query);
  return copyOf(
    [...twitterPosts]
      .filter(isVisiblePost)
      .sort(byPostedAtDesc)
      .filter((post) => {
        const author = twitterUsers.find((user) => user.id === post.authorId);
        const haystack = [post.body, author?.displayName ?? "", author?.handle ?? ""].join("\n");
        return matchesAllTerms(haystack, terms);
      }),
  );
}

/**
 * 旧アカウントを過去ブログの記事タイトル等でも検索で見つけられるようにする補助キーワード。
 * 鍵垢のため投稿本文自体は検索に出さないが、旧記事タイトル等の特定語句でアカウント検索に載せる。
 * （「ブログ」単体のような一般語ではステップ2でネタバレしないよう除外する）
 */
const EXTRA_USER_SEARCH_KEYWORDS: Record<string, readonly string[]> = {
  "tw-old-denden": [
    "写真コンテストで賞をもらいました！",
    "【MHW】弓属性強化ガン積み構成まとめ",
    "ブログはじめました！",
    "hunter_denden0102",
  ],
};

/**
 * ユーザーを検索する。対象は displayName・handle・bio（および補助キーワード）。
 */
export function searchUsers(query: string): TwitterUser[] {
  const terms = toTerms(query);
  const normalizedQuery = query.trim().toLowerCase();
  return copyOf(
    twitterUsers.filter((user) => {
      const bio = twitterProfiles.find((profile) => profile.userId === user.id)?.bio ?? "";
      if (matchesAllTerms([user.displayName, user.handle, bio].join("\n"), terms)) {
        return true;
      }
      const extras = EXTRA_USER_SEARCH_KEYWORDS[user.id];
      if (!extras || normalizedQuery === "ブログ") {
        return false;
      }
      return extras.some((keyword) => matchesAllTerms(keyword, terms));
    }),
  );
}

export {
  getTwitterConversation,
  lastTwitterMessage,
  listTwitterConversations,
  peerIdOf,
  TWITTER_ME_ID,
  type TwitterConversation,
};
