import { getUser } from "./lookup";
import type { MessageAuthor, MessagePage, MessageView } from "./types";

/**
 * ページに、表示に必要な書き手情報だけを添えてクライアントへ渡す形にする。
 * メッセージ本文はこの時点で確定し、クライアントはデータ層を import しない。
 */
export function toMessageView(page: MessagePage): MessageView {
  const authors: Record<string, MessageAuthor> = {};
  for (const message of page.messages) {
    if (authors[message.authorId]) {
      continue;
    }
    const user = getUser(message.authorId);
    authors[message.authorId] = {
      id: message.authorId,
      displayName: user?.displayName ?? message.authorId,
      avatarColor: user?.avatarColor ?? "#5865f2",
      profileUrl: user?.profileUrl,
    };
  }
  return { ...page, authors };
}
