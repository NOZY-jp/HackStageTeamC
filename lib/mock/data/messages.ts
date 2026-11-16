import type { Message } from "../types";

/**
 * メッセージの内部保存キーは「チャンネルID」と「DM スレッドID」を別の Map に分ける。
 * 同じ文字列が両方に現れても衝突しない。
 * DM のメッセージも型は Message で、channelId にはスレッドIDが入る。
 */
export const channelMessages: Record<string, Message[]> = {
  c1: [
    {
      id: "m1",
      channelId: "c1",
      authorId: "u1",
      sentAt: "2026-11-16T09:00:00.000Z",
      body: "おはようございます。今日はUI骨格まで進めます。",
    },
    {
      id: "m2",
      channelId: "c1",
      authorId: "u2",
      sentAt: "2026-11-16T09:02:00.000Z",
      body: "了解です。データ層はこちらで進めます。",
      replyToId: "m1",
    },
    {
      id: "m3",
      channelId: "c1",
      authorId: "u3",
      sentAt: "2026-11-16T09:05:00.000Z",
      body: "3ペインのラフです。",
      attachments: [{ id: "a1", name: "shell-mock.png", kind: "image", sizeLabel: "240 KB" }],
      reactions: [{ emoji: "👍", count: 2, me: true }],
    },
    {
      id: "m4",
      channelId: "c1",
      authorId: "u5",
      sentAt: "2026-11-16T09:10:00.000Z",
      body: "あおい が かえで を招待しました。",
      system: true,
    },
  ],
  c2: [
    {
      id: "m5",
      channelId: "c2",
      authorId: "u5",
      sentAt: "2026-11-16T10:00:00.000Z",
      body: "今日の進捗は #2 と #4 です。",
    },
  ],
};

export const dmMessages: Record<string, Message[]> = {
  t1: [
    {
      id: "m6",
      channelId: "t1",
      authorId: "u1",
      sentAt: "2026-11-16T12:00:00.000Z",
      body: "レビューお願いできますか？",
    },
    {
      id: "m7",
      channelId: "t1",
      authorId: "u2",
      sentAt: "2026-11-16T12:05:00.000Z",
      body: "OKです。あとで見ます。",
      editedAt: "2026-11-16T12:06:00.000Z",
    },
  ],
};
