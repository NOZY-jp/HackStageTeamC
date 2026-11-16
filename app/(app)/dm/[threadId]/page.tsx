import { DmSidebar } from "@/components/dm-sidebar";
import { MainPane } from "@/components/main-pane";

export default async function DmThreadPage({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params;

  return (
    <>
      <DmSidebar activeThreadId={threadId} />
      <MainPane label="DMスレッド" heading="ダイレクトメッセージ">
        <div className="flex h-full flex-col items-center justify-center gap-2 px-6 py-16 text-center">
          <p className="text-base font-semibold text-fg">スレッド {threadId}</p>
          <p className="text-sm leading-6 text-fg-muted">
            メッセージの表示はデータ層の実装後に接続します。
          </p>
        </div>
      </MainPane>
    </>
  );
}
