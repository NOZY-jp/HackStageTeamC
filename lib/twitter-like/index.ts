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

export {
  getTwitterConversation,
  lastTwitterMessage,
  listTwitterConversations,
  peerIdOf,
  TWITTER_ME_ID,
  type TwitterConversation,
};
