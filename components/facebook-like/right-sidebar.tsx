import Link from "next/link";
import { listContactUsers } from "@/lib/facebook-like";
import { FbAvatar } from "./avatar";

export function FacebookRightSidebar() {
  // 本名で捜す相手（u40）は検索前に見せない
  const users = listContactUsers();

  return (
    <aside className="fb-right-col" aria-label="連絡先">
      <div className="flex items-center justify-between px-2 mb-2">
        <h2 className="text-sm font-semibold text-[var(--fb-muted)]">連絡先</h2>
        <span className="text-xs text-[var(--fb-muted)]">{users.length}人</span>
      </div>
      <ul className="space-y-1">
        {users.map((user) => (
          <li key={user.id}>
            <Link href={`/talkup/profile/${user.handle}`} className="fb-sidebar-link">
              <FbAvatar
                displayName={user.displayName}
                avatarColor={user.avatarColor}
                status={user.status}
                size="sm"
                showStatus
              />
              <span className="text-sm font-medium truncate">{user.displayName}</span>
              {user.bot ? <span className="fb-bot-badge">BOT</span> : null}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
