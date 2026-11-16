import { DmSidebar } from "@/components/dm-sidebar";
import { MainPane } from "@/components/main-pane";
import { PlaceholderNotice } from "@/components/placeholder-notice";

export default function DmPage() {
  return (
    <>
      <DmSidebar />
      <MainPane label="DMスレッド" heading="ダイレクトメッセージ">
        <PlaceholderNotice
          title="スレッドを選択してください"
          description="左の一覧から会話を選ぶと、ここにメッセージが表示されます。"
        />
      </MainPane>
    </>
  );
}
