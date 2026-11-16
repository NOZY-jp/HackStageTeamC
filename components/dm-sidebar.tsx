import Link from "next/link";
import { SidebarPane } from "./sidebar-pane";

/**
 * DM一覧のプレースホルダ。実データは #4 の lib/mock を接続するまで使わない。
 */
const PLACEHOLDER_THREADS = [
  { id: "t1", label: "スレッド 1" },
  { id: "t2", label: "スレッド 2" },
  { id: "t3", label: "スレッド 3" },
];

export function DmSidebar({ activeThreadId }: { activeThreadId?: string }) {
  return (
    <SidebarPane label="ダイレクトメッセージ一覧" title="ダイレクトメッセージ">
      <p className="sidebar-section">ダイレクトメッセージ</p>
      <ul>
        {PLACEHOLDER_THREADS.map((thread) => (
          <li key={thread.id}>
            <Link
              href={`/dm/${thread.id}`}
              className="sidebar-item"
              aria-current={activeThreadId === thread.id ? "page" : undefined}
            >
              <span aria-hidden="true" className="size-8 shrink-0 rounded-full bg-input" />
              <span className="truncate">{thread.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </SidebarPane>
  );
}
