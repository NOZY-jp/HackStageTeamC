import type { Metadata } from "next";
import { usersById } from "@/components/twitter/lookup";
import { MessagesEmptyPane, MessagesListPane } from "@/components/twitter/messages";
import { listTwitterConversations } from "@/lib/mock/data/twitter-messages";

export const metadata: Metadata = { title: "メッセージ" };

export default function TwitterMessagesPage() {
  return (
    <main className="tw-main tw-main--dm">
      <MessagesListPane conversations={listTwitterConversations()} users={usersById()} />
      <MessagesEmptyPane />
    </main>
  );
}
