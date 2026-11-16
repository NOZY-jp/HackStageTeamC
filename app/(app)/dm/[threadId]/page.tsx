import { MainPane } from "@/components/main-pane";
import { getDMThread, getUser, listDMMessages } from "@/lib/mock";
import { DmList } from "../../_components/dm-list";
import { MessageList } from "../../_components/message-list";
import { SELF_USER_ID } from "../../_components/self-user";

export default async function DmThreadPage({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params;
  const thread = getDMThread(threadId);

  if (!thread) {
    return (
      <>
        <DmList activeThreadId={threadId} />
        <MainPane label="DMスレッド" heading="ダイレクトメッセージ">
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 py-16 text-center">
            <p className="text-base font-semibold text-fg">スレッドが見つかりません</p>
            <p className="text-sm leading-6 text-fg-muted">一覧から相手を選び直してください。</p>
          </div>
        </MainPane>
      </>
    );
  }

  const otherId =
    thread.participantIds.find((participantId) => participantId !== SELF_USER_ID) ??
    thread.participantIds[0];
  const other = getUser(otherId);
  const otherName = other?.displayName ?? otherId;

  return (
    <>
      <DmList activeThreadId={threadId} />
      <MessageList
        messages={listDMMessages(thread.id)}
        title={otherName}
        showHash={false}
        headerAvatar={{ displayName: otherName, avatarColor: other?.avatarColor ?? "transparent" }}
      />
    </>
  );
}
