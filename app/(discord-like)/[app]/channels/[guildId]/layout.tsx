import type { ReactNode } from "react";
import { Suspense } from "react";
import { DmList } from "@/app/(discord-like)/_components/dm-list";
import { ChannelSidebar } from "@/components/discord-like/channel-sidebar";
import { getGuildByUrlId } from "@/lib/discord-like";

/** DM のホームセグメント（Discord と同じ `@me`）。 */
const DM_HOME = "@me";

/** 一覧がまだ出せない間の骨格（レイアウトの高さを保つ）。 */
const SKELETON_ROWS = [88, 72, 64, 78, 58, 70, 62];

/**
 * チャンネル／DM の共通レイアウト。左の一覧をここに置くことで、
 * チャンネルや DM を切り替えても一覧が作り直されない（#70）。
 * 選択中のハイライトは一覧側が pathname から決める。
 */
export default function ChannelsLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ guildId: string }>;
}) {
  return (
    <>
      {/*
        params を読む一覧は境界の内側に置く。外側（静的なシェル）で読むと
        instant-shell-url-data の警告になる（#82 と同じ扱い）
      */}
      <Suspense fallback={<SidebarSkeleton label="チャンネル一覧" />}>
        <ChannelsSidebar params={params} />
      </Suspense>
      {children}
    </>
  );
}

async function ChannelsSidebar({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  // 動的セグメントは URL エンコードされたまま渡ることがある（"@me" → "%40me"）
  const segment = decodeURIComponent(guildId);

  if (segment === DM_HOME) {
    return <DmList />;
  }

  // URL の guildId は数値の urlId。一覧は内部IDで引く。
  // 存在しない guild では一覧を出さない（404 をメイン領域に出す。#70）
  const guild = getGuildByUrlId(segment);
  if (!guild) {
    return null;
  }
  return <ChannelSidebar guildId={guild.id} />;
}

function SidebarSkeleton({ label }: { label: string }) {
  return (
    <nav aria-label={label} id="app-sidebar" className="app-sidebar">
      <div className="pane-header">
        <span className="skeleton-block skeleton-header" aria-hidden="true" />
      </div>
      <div className="pane-scroll skeleton-pane" aria-hidden="true">
        {SKELETON_ROWS.map((width) => (
          <span
            key={width}
            className="skeleton-block skeleton-row"
            style={{ width: `${width}%` }}
          />
        ))}
      </div>
    </nav>
  );
}
