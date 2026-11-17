import { twitterPosts, twitterProfiles, twitterTrends, twitterUsers } from "./data/twitter";
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

/** 全投稿（返信を含む）を新しい順で返す。 */
export function listPosts(): Post[] {
  return copyOf([...twitterPosts].sort(byPostedAtDesc));
}

export function getPost(id: string): Post | undefined {
  const post = twitterPosts.find((candidate) => candidate.id === id);
  return post ? copyOf(post) : undefined;
}

/** authorId は TwitterUser.id。返信も含め新しい順。 */
export function listPostsByAuthor(authorId: string): Post[] {
  return copyOf(twitterPosts.filter((post) => post.authorId === authorId).sort(byPostedAtDesc));
}

/** 指定投稿への返信を古い順で返す。 */
export function listReplies(postId: string): Post[] {
  return copyOf(
    twitterPosts.filter((post) => post.replyToId === postId).sort((a, b) => -byPostedAtDesc(a, b)),
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

export {
  getTwitterConversation,
  lastTwitterMessage,
  listTwitterConversations,
  peerIdOf,
  TWITTER_ME_ID,
  type TwitterConversation,
};
