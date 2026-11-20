import { notFound } from "next/navigation";
import { MainPane } from "@/components/discord-like/main-pane";
import { PlaceholderNotice } from "@/components/discord-like/placeholder-notice";

/** DM のホームセグメント（Discord と同じ `@me`）。 */
const DM_HOME = "@me";

/**
 * このルートは params を見て notFound() を返すため、静的なシェルには載せない。
 * Suspense で包むと存在しない guildId が 200 になるので、#82 と同じくブロッキングにする。
 */
export const instant = false;

/** DM一覧（スレッド未選択）。`/<app>/channels/@me` だけを受け付ける。 */
export default async function ChannelsPage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  // 動的セグメントは URL エンコードされたまま渡ることがある（"@me" → "%40me"）
  if (decodeURIComponent(guildId) !== DM_HOME) {
    notFound();
  }

  return (
    <MainPane label="DMスレッド" heading="ダイレクトメッセージ">
      <PlaceholderNotice
        title="DMを選択してください"
        description="左の一覧から相手を選ぶと、ここに会話が表示されます。"
      />
    </MainPane>
  );
}
