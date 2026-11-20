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

/** 検索語に一致する投稿だけを残す（本文・投稿者名・ハンドル）。 */
export function filterPostsByQuery(posts: FbPost[], query: string): FbPost[] {
  const normalized = normalizeSearchText(query);
  if (!normalized) {
    return posts;
  }
  return posts.filter((post) => {
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
  const matchedUsers = fbUsers.filter(
    (user) =>
      normalizeSearchText(user.displayName).includes(normalized) ||
      normalizeSearchText(user.handle).includes(normalized) ||
      normalizeSearchText(user.bio).includes(normalized),
  );
  // 投稿は本文だけでなく投稿者名・ハンドルでも当てる（本名検索で本人の投稿が出る）
  const matchedPosts = filterPostsByQuery(fbPosts, query).sort(byCreatedAtDesc);

  return {
    users: copyOf(matchedUsers),
    posts: copyOf(matchedPosts),
  };
}
