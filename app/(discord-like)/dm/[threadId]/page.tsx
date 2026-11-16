import { notFound } from "next/navigation";
import { getDMThread, getUser, listDMMessages } from "@/lib/discord-like";
import { DmList } from "../../_components/dm-list";
import { MessagePane } from "../../_components/message-pane";
import { SELF_USER_ID } from "../../_components/self-user";

export default async function DmThreadPage({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params;
  const thread = getDMThread(threadId);

  if (!thread) {
    notFound();
  }

  const otherId =
    thread.participantIds.find((participantId) => participantId !== SELF_USER_ID) ??
    thread.participantIds[0];
  const other = getUser(otherId);
  const otherName = other?.displayName ?? otherId;

  return (
    <>
      <DmList activeThreadId={threadId} />
      <MessagePane
        channelKey={thread.id}
        initialMessages={listDMMessages(thread.id)}
        title={otherName}
        showHash={false}
        headerAvatar={{ displayName: otherName, avatarColor: other?.avatarColor ?? "transparent" }}
      />
    </>
  );
}
