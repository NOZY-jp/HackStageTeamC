import { listUsers } from "@/lib/mock";
import type { Post, User } from "@/lib/mock/types";

/** User.id → User。サーバー側で投稿に作者・返信先を結びつけるための小さな索引。 */
export function usersById(): Map<string, User> {
  return new Map(listUsers().map((user) => [user.id, user]));
}

/** 返信先投稿の作者。返信でなければ undefined。 */
export function replyTargetAuthor(
  post: Post,
  findPost: (id: string) => Post | undefined,
  users: Map<string, User>,
): User | undefined {
  if (!post.replyToId) {
    return undefined;
  }
  const parent = findPost(post.replyToId);
  return parent ? users.get(parent.authorId) : undefined;
}
