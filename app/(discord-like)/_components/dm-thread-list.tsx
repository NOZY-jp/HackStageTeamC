"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { dmThreadPath, isActiveHref } from "@/lib/platform/app-prefix";

export type DmThreadItem = {
  id: string;
  urlId: string;
  name: string;
  avatarColor: string;
  status: string;
  preview: string;
  time: string;
  unread: number;
};

const STATUS_LABELS: Record<string, string> = {
  online: "オンライン",
  idle: "離席中",
  dnd: "取り込み中",
  offline: "オフライン",
};

/**
 * DM 一覧の項目。layout 側に置くため、選択中のスレッドは pathname から決める（#70）。
 * 一覧がチャンネル移動で作り直されないので、ハイライトだけが切り替わる。
 */
export function DmThreadList({ threads }: { threads: DmThreadItem[] }) {
  const pathname = usePathname();

  return (
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
        const href = dmThreadPath(thread.urlId);

        return (
          <li key={thread.id}>
            <Link
              href={href}
              className="sidebar-item dm-item"
              aria-label={label}
              aria-current={isActiveHref(pathname, href) ? "page" : undefined}
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
  );
}
