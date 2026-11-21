import { Suspense } from "react";
import { SidebarPane } from "@/components/discord-like/sidebar-pane";
import { getUser, listDMMessages, listDMThreads } from "@/lib/discord-like";
import { DmListLive } from "./dm-list-live";
import type { DmThreadItem } from "./dm-thread-list";
import { EmptyState } from "./empty-state";
import { SELF_USER_ID } from "./self-user";

/** 一覧が読み込み中でも中ペインの骨格を保つための行（#70）。 */
const SKELETON_ROWS = [88, 72, 64, 78, 58, 70, 62];

/**
 * DM一覧（中ペイン）。`/<app>/channels/@me` 配下の layout から描画する。
 * 相手は participantIds から自分（SELF_USER_ID）以外を選ぶ。
 * データ上どのスレッドにも自分が入っていない場合は先頭の参加者を相手として扱う。
 */
export function DmList() {
  const base: Record<string, { sentAt?: string; preview: string; time: string }> = {};
  const threads: DmThreadItem[] = listDMThreads().map((thread) => {
    const otherId =
      thread.participantIds.find((participantId) => participantId !== SELF_USER_ID) ??
      thread.participantIds[0];
    const user = getUser(otherId);
    const oldestFirst = listDMMessages({ threadId: thread.id, limit: 1 }).messages;
    const last = oldestFirst[oldestFirst.length - 1];

    base[thread.id] = {
      sentAt: last?.sentAt,
      preview: last ? last.body.replace(/\s+/g, " ").slice(0, 80) : "",
      time: last ? last.sentAt.slice(11, 16) : "",
    };
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
      ) : (
        // 選択中スレッドは pathname から決めるため、境界で囲む（cacheComponents）
        <Suspense
          fallback={
            <div className="skeleton-pane" aria-hidden="true">
              {SKELETON_ROWS.map((width) => (
                <span
                  key={width}
                  className="skeleton-block skeleton-row"
                  style={{ width: `${width}%` }}
                />
              ))}
            </div>
          }
        >
          <DmListLive items={threads} base={base} />
        </Suspense>
      )}
    </SidebarPane>
  );
}
