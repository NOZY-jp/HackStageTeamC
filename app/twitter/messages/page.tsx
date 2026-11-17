import type { Metadata } from "next";
import { usersById } from "@/components/twitter-like/lookup";
import { MessagesEmptyPane, MessagesListPane } from "@/components/twitter-like/messages";
import { listTwitterConversations } from "@/lib/twitter-like/data/twitter-messages";

export const metadata: Metadata = { title: "メッセージ" };

export default function TwitterMessagesPage() {
  return (
    <main className="tw-main tw-main--dm">
      <MessagesListPane conversations={listTwitterConversations()} users={usersById()} />
      <MessagesEmptyPane />
    </main>
  );
}
