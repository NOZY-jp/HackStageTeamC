import { getGuild, getUser, listUsers } from "./lookup";
import type { MemberView, MessageAuthor, MessagePage, MessageView } from "./types";

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

/**
 * メンバー一覧（オンライン/オフラインの並びは表示側で分ける）。
 * そのギルドのメンバーだけを memberIds の順で返す（#163）。
 */
export function listMemberViews(guildId: string): MemberView[] {
  const guild = getGuild(guildId);
  if (!guild) {
    return [];
  }
  const byId = new Map(listUsers().map((user) => [user.id, user]));
  return guild.memberIds.flatMap((id) => {
    const user = byId.get(id);
    if (!user) {
      return [];
    }
    return [
      {
        id: user.id,
        displayName: user.displayName,
        handle: user.handle,
        avatarColor: user.avatarColor,
        status: user.status,
        profileUrl: user.profileUrl,
      },
    ];
  });
}
