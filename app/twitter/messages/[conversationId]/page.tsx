import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { usersById } from "@/components/twitter/lookup";
import { ConversationPane, MessagesListPane } from "@/components/twitter/messages";
import {
  getTwitterConversation,
  listTwitterConversations,
  peerIdOf,
} from "@/lib/mock/data/twitter-messages";

type Props = { params: Promise<{ conversationId: string }> };

export const instant = false;

export function generateStaticParams() {
  return listTwitterConversations().map((conversation) => ({ conversationId: conversation.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { conversationId } = await params;
  const conversation = getTwitterConversation(conversationId);
  const peer = conversation ? usersById().get(peerIdOf(conversation)) : undefined;
  return peer
    ? { title: `${peer.displayName}とのメッセージ` }
    : { title: "メッセージが見つかりません" };
}

export default async function TwitterConversationPage({ params }: Props) {
  const { conversationId } = await params;
  const conversation = getTwitterConversation(conversationId);
  if (!conversation) {
    notFound();
  }
  const users = usersById();
  return (
    <main className="tw-main tw-main--dm">
      <MessagesListPane
        conversations={listTwitterConversations()}
        users={users}
        activeId={conversation.id}
      />
      <ConversationPane conversation={conversation} users={users} />
    </main>
  );
}
