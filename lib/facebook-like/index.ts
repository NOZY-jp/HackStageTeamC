import { fbPosts } from "./data/posts";
import { FB_SELF_USER_ID, fbUsers } from "./data/users";
import type { FbPost, FbUser } from "./types";

const copyOf = <T>(value: T): T => structuredClone(value);

/** 順序10で本名から捜す相手（u40）。検索前の「連絡先」には出さない。 */
const SPOILER_USER_ID = "u40";

const byCreatedAtDesc = (a: { createdAt: string }, b: { createdAt: string }): number =>
  b.createdAt.localeCompare(a.createdAt);

export function getSelfUser(): FbUser {
  const self = fbUsers.find((user) => user.id === FB_SELF_USER_ID);
  if (!self) {
    throw new Error(`Self user not found: ${FB_SELF_USER_ID}`);
  }
  return copyOf(self);
}

export function listUsers(): FbUser[] {
  return copyOf(fbUsers);
}

export function getUserById(id: string): FbUser | undefined {
  const user = fbUsers.find((candidate) => candidate.id === id);
  return user ? copyOf(user) : undefined;
}

export function getUserByHandle(handle: string): FbUser | undefined {
  const user = fbUsers.find((candidate) => candidate.handle === handle);
  return user ? copyOf(user) : undefined;
}

export function listFriends(userId: string): FbUser[] {
  const user = fbUsers.find((candidate) => candidate.id === userId);
  if (!user) {
    return [];
  }
  const friendSet = new Set(user.friendIds);
  return copyOf(fbUsers.filter((candidate) => friendSet.has(candidate.id)));
}

export function listPosts(): FbPost[] {
  return copyOf([...fbPosts].sort(byCreatedAtDesc));
}

/**
 * 通常のフィードに出す投稿だけを残す。
 * 本名で捜す相手（u40）の投稿は検索結果とプロフィールからだけ見せ、
 * 検索前のフィードで本名が先に見えないようにする。
 */
export function filterFeedPosts(posts: FbPost[]): FbPost[] {
  return posts.filter((post) => post.authorId !== SPOILER_USER_ID);
}

/** 通常のフィード（新着順）。u40 の投稿は含めない。 */
export function listFeedPosts(): FbPost[] {
  return copyOf(filterFeedPosts(fbPosts).sort(byCreatedAtDesc));
}

export function getPostById(postId: string): FbPost | undefined {
  const post = fbPosts.find((candidate) => candidate.id === postId);
  return post ? copyOf(post) : undefined;
}

export function listPostsByAuthor(authorId: string): FbPost[] {
  return copyOf(fbPosts.filter((post) => post.authorId === authorId).sort(byCreatedAtDesc));
}

/**
 * 検索語の正規化。空白（半角・全角）を落として照合する。
 * 「服部 由比」と「服部由比」のどちらでも同じ相手に届くようにするため。
 */
export function normalizeSearchText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s　]+/g, "");
}

/**
 * 順序10の対象ユーザー（SPOILER_USER_ID）を検索に出してよい語かを判定する。
 * 一般語・1文字・姓や名だけの部分一致で検索前に露出しないよう、
 * フルネーム（空白有無）またはハンドルの完全一致だけを許可する。
 */
function matchesSpoilerUserQuery(normalizedQuery: string): boolean {
  if (!normalizedQuery) {
    return false;
  }
  const spoilerUser = fbUsers.find((u) => u.id === SPOILER_USER_ID);
  if (!spoilerUser) {
    return false;
  }
  const fullName = normalizeSearchText(spoilerUser.displayName);
  const handle = normalizeSearchText(spoilerUser.handle);
  return normalizedQuery === fullName || normalizedQuery === handle;
}

/** 検索語に一致する投稿だけを残す（本文・投稿者名・ハンドル）。 */
export function filterPostsByQuery(posts: FbPost[], query: string): FbPost[] {
  const normalized = normalizeSearchText(query);
  if (!normalized) {
    // 空検索は通常フィードと同じ扱いにする。ここでも u40 を除き、
    // 呼び出し側がフィード用の事前フィルタを忘れても本名が露出しないようにする。
    return filterFeedPosts(posts);
  }
  return posts.filter((post) => {
    if (post.authorId === SPOILER_USER_ID) {
      return matchesSpoilerUserQuery(normalized);
    }
    const author = fbUsers.find((user) => user.id === post.authorId);
    return (
      normalizeSearchText(post.body).includes(normalized) ||
      normalizeSearchText(author?.displayName ?? "").includes(normalized) ||
      normalizeSearchText(author?.handle ?? "").includes(normalized)
    );
  });
}

/** 連絡先（右サイドバー）に出すユーザー。本名で捜す相手は検索前に見せない。 */
export function listContactUsers(): FbUser[] {
  return copyOf(fbUsers.filter((user) => user.id !== SPOILER_USER_ID));
}

export function searchFacebook(query: string): { users: FbUser[]; posts: FbPost[] } {
  const normalized = normalizeSearchText(query);
  if (!normalized) {
    return { users: [], posts: [] };
  }
  const matchedUsers = fbUsers.filter((user) => {
    if (user.id === SPOILER_USER_ID) {
      return matchesSpoilerUserQuery(normalized);
    }
    return (
      normalizeSearchText(user.displayName).includes(normalized) ||
      normalizeSearchText(user.handle).includes(normalized) ||
      normalizeSearchText(user.bio).includes(normalized)
    );
  });
  // 投稿は本文だけでなく投稿者名・ハンドルでも当てる（本名検索で本人の投稿が出る）
  const matchedPosts = filterPostsByQuery(fbPosts, query).sort(byCreatedAtDesc);

  return {
    users: copyOf(matchedUsers),
    posts: copyOf(matchedPosts),
  };
}
