import { DmList } from "@/app/(discord-like)/_components/dm-list";
import { MainPane } from "@/components/discord-like/main-pane";
import { PlaceholderNotice } from "@/components/discord-like/placeholder-notice";

export default function DmPage() {
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
