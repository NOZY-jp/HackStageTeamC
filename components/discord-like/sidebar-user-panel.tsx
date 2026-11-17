import { getUser } from "@/lib/discord-like";

/** 現行 Discord の表示（idle は「退席中」）。DM 一覧の同名ラベルは別管理。 */
const STATUS_LABELS: Record<string, string> = {
  online: "オンライン",
  idle: "退席中",
  dnd: "取り込み中",
  offline: "オフライン",
};

/**
 * 左ペイン下端のユーザーパネル。表示専用（#31 でシェル直下に移動）。
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

      {/*
       * ボイス操作は5要素（マイク / マイク選択 / ヘッドホン / ヘッドホン選択 / 設定）を右揃え。
       * すべて見た目のみで、押しても何も起きない（実デバイス・音声APIは扱わない）。
       * 選択系は小さなチューザとして本体アイコンと階層を分ける。
       */}
      <span className="sidebar-user-actions">
        <button
          type="button"
          className="sidebar-user-action"
          aria-label="マイクをミュート"
          aria-pressed={false}
        >
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
        </button>
        <button
          type="button"
          className="sidebar-user-action sidebar-user-action-chooser"
          aria-label="入力デバイスを選択"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            width="10"
            height="10"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
        <button
          type="button"
          className="sidebar-user-action"
          aria-label="ヘッドホンをミュート"
          aria-pressed={false}
        >
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
            <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
            <path d="M4 14h3v6H5a1 1 0 0 1-1-1v-5ZM20 14h-3v6h2a1 1 0 0 0 1-1v-5Z" />
          </svg>
        </button>
        <button
          type="button"
          className="sidebar-user-action sidebar-user-action-chooser"
          aria-label="出力デバイスを選択"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            width="10"
            height="10"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
        <button type="button" className="sidebar-user-action" aria-label="ユーザー設定">
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
        </button>
      </span>

      {/* 既定では隠しておき、行のホバー／フォーカスでスロット状に下から出す */}
      <span className="sidebar-user-handle">{user.handle}</span>
    </section>
  );
}
