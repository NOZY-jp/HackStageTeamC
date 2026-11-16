import { getUser } from "@/lib/mock";

/** 現行 Discord の表示（idle は「退席中」）。 */
const STATUS_LABELS: Record<string, string> = {
  online: "オンライン",
  idle: "退席中",
  dnd: "取り込み中",
  offline: "オフライン",
};

/**
 * サイドバー下端のユーザーパネル。表示専用。
 * 名前の下はステータス文言、ハンドルはホバー／フォーカス時にスロット状に出す（#32）。
 * ミュート・設定アイコンは見た目だけで、押しても何も起きない（#7 の非対象）。
 */
export function SidebarUserPanel({ userId }: { userId: string }) {
  const user = getUser(userId);
  if (!user) {
    return null;
  }

  const status = user.status ?? "offline";
  const statusLabel = STATUS_LABELS[status] ?? STATUS_LABELS.offline;

  return (
    <section
      className="sidebar-user"
      aria-label={`${user.displayName}（${statusLabel}）、ユーザーネーム ${user.handle}`}
    >
      <span className="sidebar-user-avatar-wrap">
        <span
          aria-hidden="true"
          className="sidebar-user-avatar"
          style={{ backgroundColor: user.avatarColor }}
        >
          {user.displayName.slice(0, 1)}
        </span>
        <span
          role="img"
          aria-label={`ステータス: ${statusLabel}`}
          className="status-dot"
          data-status={status}
        />
      </span>
      <span className="sidebar-user-text">
        <span className="sidebar-user-name">{user.displayName}</span>
        <span className="sidebar-user-status" data-status={status}>
          {statusLabel}
        </span>
      </span>

      {/* 見た目のみ（操作不可）。実機能は #7 の非対象 */}
      <span className="sidebar-user-action">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z" />
          <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
        </svg>
      </span>
      <span className="sidebar-user-action">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a7.9 7.9 0 0 0 .1-1 7.9 7.9 0 0 0-.1-1l2-1.6-2-3.4-2.4 1a8 8 0 0 0-1.7-1L15 4.5h-4l-.3 2.5a8 8 0 0 0-1.7 1l-2.4-1-2 3.4L6.6 13a7.9 7.9 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a8 8 0 0 0 1.7 1l.3 2.5h4l.3-2.5a8 8 0 0 0 1.7-1l2.4 1 2-3.4-2-1.6Z" />
        </svg>
      </span>

      {/* 既定では隠しておき、行のホバー／フォーカスでスロット状に下から出す */}
      <span className="sidebar-user-handle">{user.handle}</span>
    </section>
  );
}
