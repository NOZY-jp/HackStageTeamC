"use client";

import { threadPreview } from "./dm-preview";
import { type DmThreadItem, DmThreadList } from "./dm-thread-list";
import { useOptionalLocalMessages } from "./local-messages-context";

/**
 * DM一覧の表示。物語で新しく届いたメッセージがあれば、そのスレッドの
 * プレビューと時刻を更新する（#217）。通話のシステム行では上書きしない。
 */
export function DmListLive({
  items,
  base,
}: {
  items: DmThreadItem[];
  base: Record<string, { sentAt?: string; preview: string; time: string }>;
}) {
  const local = useOptionalLocalMessages();
  const rows = items.map((item) => {
    if (!local) return item;
    const preview = threadPreview(
      base[item.id] ?? { preview: item.preview, time: item.time },
      local.messagesFor(item.id),
    );
    return { ...item, ...preview };
  });
  return <DmThreadList threads={rows} />;
}
