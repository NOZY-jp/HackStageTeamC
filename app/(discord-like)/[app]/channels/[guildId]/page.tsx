import { notFound } from "next/navigation";
import { DmList } from "@/app/(discord-like)/_components/dm-list";
import { MainPane } from "@/components/discord-like/main-pane";
import { PlaceholderNotice } from "@/components/discord-like/placeholder-notice";

/** DM のホームセグメント（Discord と同じ `@me`）。 */
const DM_HOME = "@me";

/** DM一覧（スレッド未選択）。`/<app>/channels/@me` だけを受け付ける。 */
export default async function ChannelsPage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  // 動的セグメントは URL エンコードされたまま渡ることがある（"@me" → "%40me"）
  if (decodeURIComponent(guildId) !== DM_HOME) {
    notFound();
  }

  return (
    <>
      <DmList />
      <MainPane label="DMスレッド" heading="ダイレクトメッセージ">
        <PlaceholderNotice
          title="DMを選択してください"
          description="左の一覧から相手を選ぶと、ここに会話が表示されます。"
        />
      </MainPane>
    </>
  );
}
