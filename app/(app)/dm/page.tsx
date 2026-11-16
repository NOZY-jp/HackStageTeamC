import { MainPane } from "@/components/main-pane";
import { PlaceholderNotice } from "@/components/placeholder-notice";
import { DmList } from "../_components/dm-list";

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
