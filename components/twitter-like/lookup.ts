import { listUsers } from "@/lib/twitter-like";
import type { Post, TwitterUser } from "@/lib/twitter-like/types";

/** User.id → User。サーバー側で投稿に作者・返信先を結びつけるための小さな索引。 */
export function usersById(): Map<string, TwitterUser> {
  return new Map(listUsers().map((user) => [user.id, user]));
}

/** 返信先投稿の作者。返信でなければ undefined。 */
export function replyTargetAuthor(
  post: Post,
  findPost: (id: string) => Post | undefined,
  users: Map<string, TwitterUser>,
): TwitterUser | undefined {
  if (!post.replyToId) {
    return undefined;
  }
  const parent = findPost(post.replyToId);
  return parent ? users.get(parent.authorId) : undefined;
}
