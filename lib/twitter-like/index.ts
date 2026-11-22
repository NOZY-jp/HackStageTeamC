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
 * タイムラインに出す「物語の現在」の下限。ここより前の投稿は、2019年の攻略投稿
 * （post-101 など）のような答えに直結する古い話なので、ホーム・おすすめのどちらにも
 * 出さない。検索・プロフィール・個別投稿ページからは従来どおり辿れる。
 */
const TIMELINE_SINCE = "2026-08-01T00:00:00+09:00";

/**
 * ホームの「フォロー中」タイムライン。返信を除くトップレベルの投稿を新しい順で返す。
 * 出るのは「フォロー中のアカウントと自分が、物語の現在（{@link TIMELINE_SINCE}）以降に
 * 書いた投稿」だけ — フォローしていない人（かのん）の投稿と、2019年の攻略投稿の
 * ような古い投稿は出さない。
 *
 * #241: 以前は viewer の参加日（joinedAt）で切っていたが、参加した直後は投稿が
 * 数件しか残らず「フォロー中」が空に見えた。参加日はプロフィールの事実として残し、
 * フィードの窓はおすすめと同じ「物語の現在」に揃える（参加前の投稿が見えるのは
 * 実際の SNS のフィードと同じ挙動）。
 */
export function listHomePosts(viewerId: string): Post[] {
  const follows = new Set([viewerId, ...(twitterFollows[viewerId] ?? [])]);
  return copyOf(
    twitterPosts
      .filter(isVisiblePost)
      .filter(
        (post) => !post.replyToId && follows.has(post.authorId) && post.postedAt >= TIMELINE_SINCE,
      )
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
  return copyOf(
    twitterPosts
      .filter(isVisiblePost)
      .filter(
        (post) => !post.replyToId && !hidden.has(post.authorId) && post.postedAt >= TIMELINE_SINCE,
      )
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

type SearchOptions = { foundBff?: boolean };

const searchUsersById = new Map(twitterUsers.map((user) => [user.id, user]));
const searchBiosById = new Map(twitterProfiles.map((profile) => [profile.userId, profile.bio]));
const publicSearchPosts = twitterPosts.filter(isVisiblePost).sort(byPostedAtDesc);
const searchPostDocuments = publicSearchPosts.map((post) => {
  const author = searchUsersById.get(post.authorId);
  return {
    post,
    text: [post.body, author?.displayName, author?.handle].join("\n").toLowerCase(),
  };
});

function canSearchAccount(id: string, options: SearchOptions): boolean {
  return id !== "tw-kanon" || options.foundBff === true;
}

/** 本文・投稿者名・handle の検索。鍵垢の投稿は検索対象外。 */
export function searchPosts(query: string, options: SearchOptions = {}): Post[] {
  const terms = toTerms(query);
  if (terms.length === 0) return [];
  return copyOf(
    searchPostDocuments
      .filter(
        ({ post, text }) =>
          canSearchAccount(post.authorId, options) && matchesAllTerms(text, terms),
      )
      .map(({ post }) => post),
  );
}

/** 公開プロフィールと公開投稿本文で検索し、公開アカウントを先に並べる。 */
export function searchUsers(query: string, options: SearchOptions = {}): TwitterUser[] {
  const terms = toTerms(query);
  if (terms.length === 0) return [];

  const matchingAuthors = new Set(
    publicSearchPosts
      .filter((post) => matchesAllTerms(post.body, terms))
      .map((post) => post.authorId),
  );
  const matches = twitterUsers.filter((user) => {
    if (!canSearchAccount(user.id, options)) return false;
    const profile = [user.displayName, user.handle, searchBiosById.get(user.id)].join("\n");
    return matchingAuthors.has(user.id) || matchesAllTerms(profile, terms);
  });

  const exactAccount = (user: TwitterUser) =>
    terms.length === 1 &&
    [user.displayName, user.handle].some((label) => label.toLowerCase() === terms[0]);
  return copyOf(
    matches.sort(
      (a, b) =>
        Number(exactAccount(b)) - Number(exactAccount(a)) ||
        Number(isProtected(a)) - Number(isProtected(b)),
    ),
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
