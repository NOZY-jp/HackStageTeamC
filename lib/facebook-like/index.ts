import { fbPosts } from "./data/posts";
import { FB_SELF_USER_ID, fbUsers } from "./data/users";
import type { FbPost, FbUser } from "./types";

const copyOf = <T>(value: T): T => structuredClone(value);

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

export function searchFacebook(query: string): { users: FbUser[]; posts: FbPost[] } {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return { users: [], posts: [] };
  }
  const matchedUsers = fbUsers.filter(
    (user) =>
      user.displayName.toLowerCase().includes(normalized) ||
      user.handle.toLowerCase().includes(normalized) ||
      user.bio.toLowerCase().includes(normalized),
  );
  const matchedPosts = fbPosts
    .filter((post) => post.body.toLowerCase().includes(normalized))
    .sort(byCreatedAtDesc);

  return {
    users: copyOf(matchedUsers),
    posts: copyOf(matchedPosts),
  };
}
