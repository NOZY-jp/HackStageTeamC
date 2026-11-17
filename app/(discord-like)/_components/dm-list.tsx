import Link from "next/link";
import { SidebarPane } from "@/components/discord-like/sidebar-pane";
import { getUser, listDMMessages, listDMThreads } from "@/lib/discord-like";
import { dmThreadPath } from "@/lib/platform/app-prefix";
import { EmptyState } from "./empty-state";
import { SELF_USER_ID } from "./self-user";

const STATUS_LABELS: Record<string, string> = {
  online: "オンライン",
  idle: "離席中",
  dnd: "取り込み中",
  offline: "オフライン",
};

/**
 * DM一覧（中ペイン）。/<app>/channels/@me と /<app>/channels/@me/<dmChannelId> で使う。
 * 相手は participantIds から自分（SELF_USER_ID）以外を選ぶ。
 * データ上どのスレッドにも自分が入っていない場合は先頭の参加者を相手として扱う。
 */
export function DmList({ activeThreadId }: { activeThreadId?: string }) {
  const threads = listDMThreads().map((thread) => {
    const otherId =
      thread.participantIds.find((participantId) => participantId !== SELF_USER_ID) ??
      thread.participantIds[0];
    const user = getUser(otherId);
    const messages = listDMMessages(thread.id);
    const last = messages[messages.length - 1];

    return {
      id: thread.id,
      urlId: thread.urlId,
      name: user?.displayName ?? otherId,
      avatarColor: user?.avatarColor ?? "transparent",
      status: user?.status ?? "offline",
      preview: last ? last.body.replace(/\s+/g, " ").slice(0, 80) : "",
      time: last ? last.sentAt.slice(11, 16) : "",
      unread: thread.unreadCount ?? 0,
    };
  });

  return (
    <SidebarPane label="ダイレクトメッセージ" title="ダイレクトメッセージ">
      {/* 検索欄は見た目のみ（検索は #10 の非対象） */}
      <div className="dm-search">
        <input
          type="text"
          className="dm-search-input"
          placeholder="検索（準備中）"
          aria-label="検索（準備中）"
          disabled
        />
      </div>

      {threads.length === 0 ? (
        <EmptyState
          kind="dm"
          title="DMがありません"
          description="レールから相手を選んで開始できます。"
        />
      ) : null}

      <ul>
        {threads.map((thread) => {
          const statusLabel = STATUS_LABELS[thread.status] ?? STATUS_LABELS.offline;
          const label = [
            thread.name,
            thread.unread > 0 ? `未読${thread.unread}件` : "",
            `最新 ${thread.time}`,
            statusLabel,
          ]
            .filter(Boolean)
            .join("、");

          return (
            <li key={thread.id}>
              <Link
                href={dmThreadPath(thread.urlId)}
                className="sidebar-item dm-item"
                aria-label={label}
                aria-current={activeThreadId === thread.id ? "page" : undefined}
              >
                <span className="dm-avatar-wrap">
                  <span
                    aria-hidden="true"
                    className="dm-avatar"
                    style={{ backgroundColor: thread.avatarColor }}
                  >
                    {thread.name.slice(0, 1)}
                  </span>
                  <span
                    role="img"
                    aria-label={`ステータス: ${statusLabel}`}
                    className="status-dot"
                    data-status={thread.status}
                  />
                </span>

                <span className="dm-text">
                  <span className="dm-name">{thread.name}</span>
                  <span className="dm-preview">{thread.preview}</span>
                </span>

                <span className="dm-meta">
                  {thread.unread > 0 ? (
                    <span aria-hidden="true" className="dm-badge">
                      {thread.unread > 99 ? "99+" : thread.unread}
                    </span>
                  ) : null}
                  <span className="dm-time">{thread.time}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </SidebarPane>
  );
}
