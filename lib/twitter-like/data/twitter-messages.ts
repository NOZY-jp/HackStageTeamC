/**
 * Twitter-like SNS の DM（/twitter/messages 配下）用ダミーデータ。
 * 参加者は twitterUsers（"tw-" プレフィックスの User.id）。閲覧者は常に tw-hal。
 * 内容は公開の投稿と矛盾しない日常の連絡だけ（物語を進める新しい事実は足さない）。
 */
export type TwitterDirectMessage = {
  id: string;
  senderId: string;
  /** 送信時刻（ISO 8601・JST オフセット付きの固定文字列） */
  sentAt: string;
  body: string;
};

export type TwitterConversation = {
  /** URL に入る（/twitter/messages/[conversationId]） */
  id: string;
  /** DM の参加者2人（User.id） */
  participantIds: [string, string];
  messages: TwitterDirectMessage[];
};

/** このデモの閲覧者（左ナビの「自分」）。 */
export const TWITTER_ME_ID = "tw-hal";

export const twitterConversations: TwitterConversation[] = [
  {
    id: "dm-mai",
    participantIds: ["tw-hal", "tw-mai"],
    messages: [
      {
        id: "dm-mai-1",
        senderId: "tw-hal",
        sentAt: "2026-11-16T20:44:00+09:00",
        body: "金曜の夜、インできる？週末レイドの下見に行きたい",
      },
      {
        id: "dm-mai-2",
        senderId: "tw-mai",
        sentAt: "2026-11-16T20:51:00+09:00",
        body: "うん、大丈夫だよ。何時ごろインする？",
      },
      {
        id: "dm-mai-3",
        senderId: "tw-hal",
        sentAt: "2026-11-16T20:55:00+09:00",
        body: "21時過ぎかな。遅れたら連絡するね",
      },
      {
        id: "dm-mai-4",
        senderId: "tw-mai",
        sentAt: "2026-11-16T20:58:00+09:00",
        body: "了解。待ってる",
      },
      {
        id: "dm-mai-5",
        senderId: "tw-hal",
        sentAt: "2026-11-16T21:02:00+09:00",
        body: "週末もよろしく",
      },
      {
        id: "dm-mai-6",
        senderId: "tw-mai",
        sentAt: "2026-11-16T21:20:00+09:00",
        body: "こちらこそ。……楽しみだね",
      },
    ],
  },
  {
    id: "dm-sou",
    participantIds: ["tw-hal", "tw-sou"],
    messages: [
      {
        id: "dm-sou-1",
        senderId: "tw-sou",
        sentAt: "2026-11-15T22:31:00+09:00",
        body: "来週の件、前日の夜は早めに寝とけよ。当日緊張で眠れないのが一番ありがちだ",
      },
      {
        id: "dm-sou-2",
        senderId: "tw-hal",
        sentAt: "2026-11-15T22:36:00+09:00",
        body: "ありがとうございます。そうします",
      },
      {
        id: "dm-sou-3",
        senderId: "tw-sou",
        sentAt: "2026-11-15T22:40:00+09:00",
        body: "うまくいくといいな",
      },
    ],
  },
  {
    id: "dm-sana",
    participantIds: ["tw-hal", "tw-sana"],
    messages: [
      {
        id: "dm-sana-1",
        senderId: "tw-sana",
        sentAt: "2026-11-08T13:21:00+09:00",
        body: "駅前のカフェ、栗のラテ始まってたよ",
      },
      {
        id: "dm-sana-2",
        senderId: "tw-hal",
        sentAt: "2026-11-08T13:34:00+09:00",
        body: "いいな。週末行ってみる",
      },
    ],
  },
  {
    id: "dm-yuki",
    participantIds: ["tw-hal", "tw-yuki"],
    messages: [
      {
        id: "dm-yuki-1",
        senderId: "tw-yuki",
        sentAt: "2026-11-06T21:48:00+09:00",
        body: "紅葉の谷、夕方が一番きれいだよ。今度案内するね",
      },
      {
        id: "dm-yuki-2",
        senderId: "tw-hal",
        sentAt: "2026-11-06T21:52:00+09:00",
        body: "ぜひ！来週あたりで",
      },
      {
        id: "dm-yuki-3",
        senderId: "tw-yuki",
        sentAt: "2026-11-06T21:55:00+09:00",
        body: "空いてる日教えて",
      },
    ],
  },
  {
    id: "dm-ren",
    participantIds: ["tw-hal", "tw-ren"],
    messages: [
      {
        id: "dm-ren-1",
        senderId: "tw-ren",
        sentAt: "2026-11-05T22:38:00+09:00",
        body: "週末レイド、盾役あと1人なんだけど来れる？",
      },
      {
        id: "dm-ren-2",
        senderId: "tw-hal",
        sentAt: "2026-11-05T22:41:00+09:00",
        body: "行けます！立候補します",
      },
      {
        id: "dm-ren-3",
        senderId: "tw-ren",
        sentAt: "2026-11-05T22:45:00+09:00",
        body: "助かる。じゃあ当日よろしく",
      },
    ],
  },
];

const copyOf = <T>(value: T): T => structuredClone(value);

const lastSentAt = (conversation: TwitterConversation): string =>
  conversation.messages[conversation.messages.length - 1]?.sentAt ?? "";

/** 会話一覧を最終メッセージの新しい順で返す。 */
export function listTwitterConversations(): TwitterConversation[] {
  return copyOf(
    [...twitterConversations].sort((a, b) => lastSentAt(b).localeCompare(lastSentAt(a))),
  );
}

export function getTwitterConversation(id: string): TwitterConversation | undefined {
  const conversation = twitterConversations.find((candidate) => candidate.id === id);
  return conversation ? copyOf(conversation) : undefined;
}

/** 一覧の行に出す最後のメッセージ。 */
export function lastTwitterMessage(
  conversation: TwitterConversation,
): TwitterDirectMessage | undefined {
  return conversation.messages[conversation.messages.length - 1];
}

/** 閲覧者（tw-hal）ではない側の参加者 id。 */
export function peerIdOf(conversation: TwitterConversation): string {
  return (
    conversation.participantIds.find((id) => id !== TWITTER_ME_ID) ?? conversation.participantIds[0]
  );
}
