import Link from "next/link";
import { getProfile } from "@/lib/mock";
import {
  lastTwitterMessage,
  peerIdOf,
  TWITTER_ME_ID,
  type TwitterConversation,
} from "@/lib/mock/data/twitter-messages";
import type { User } from "@/lib/mock/types";
import { Avatar } from "./avatar";
import { formatJoinedAt, formatMessageTime } from "./format";
import {
  EmojiIcon,
  GifIcon,
  InfoIcon,
  MediaIcon,
  SearchIcon,
  SendIcon,
  VerifiedBadge,
} from "./icons";
import { isVerified } from "./lookup";

/** 左の会話一覧ペイン（/twitter/messages では右は空状態になる）。 */
export function MessagesListPane({
  conversations,
  users,
  activeId,
}: {
  conversations: TwitterConversation[];
  users: Map<string, User>;
  activeId?: string;
}) {
  return (
    <div className="tw-dm-list">
      <header className="tw-dm-list-head">
        <h1 className="tw-page-title">メッセージ</h1>
      </header>
      <div className="tw-dm-search">
        <SearchIcon />
        <input
          type="search"
          className="tw-search-input"
          placeholder="ダイレクトメッセージを検索"
          aria-label="ダイレクトメッセージを検索（無効）"
          disabled
        />
      </div>
      <ul className="tw-dm-items">
        {conversations.map((conversation) => {
          const peer = users.get(peerIdOf(conversation));
          const last = lastTwitterMessage(conversation);
          if (!peer || !last) {
            return null;
          }
          return (
            <li key={conversation.id}>
              <Link
                href={`/twitter/messages/${conversation.id}`}
                className="tw-dm-item"
                data-active={conversation.id === activeId || undefined}
                aria-current={conversation.id === activeId ? "page" : undefined}
              >
                <Avatar user={peer} />
                <span className="tw-dm-item-text">
                  <span className="tw-dm-item-head">
                    <span className="tw-name">
                      {peer.displayName}
                      {isVerified(peer) ? <VerifiedBadge /> : null}
                    </span>
                    <span className="tw-handle">@{peer.handle}</span>
                    <span aria-hidden="true" className="tw-dot">
                      ·
                    </span>
                    <span className="tw-time">{formatMessageTime(last.sentAt).split(" ")[0]}</span>
                  </span>
                  <span className="tw-dm-item-preview">{last.body}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** 会話未選択時の右ペイン。 */
export function MessagesEmptyPane() {
  return (
    <div className="tw-dm-empty">
      <h2 className="tw-dm-empty-title">メッセージを選択</h2>
      <p className="tw-dm-empty-sub">既存の会話から1つ選ぶか、新しい会話を始めましょう。</p>
      <button type="button" className="tw-button" disabled>
        新しいメッセージ
      </button>
    </div>
  );
}

/** 連続する同じ送信者のメッセージを1つの吹き出しグループにまとめる。 */
function groupMessages(conversation: TwitterConversation) {
  const groups: { senderId: string; sentAt: string; bodies: string[] }[] = [];
  for (const message of conversation.messages) {
    const last = groups[groups.length - 1];
    if (last && last.senderId === message.senderId) {
      last.bodies.push(message.body);
      last.sentAt = message.sentAt;
    } else {
      groups.push({ senderId: message.senderId, sentAt: message.sentAt, bodies: [message.body] });
    }
  }
  return groups;
}

/** 右の会話ペイン。上部に相手の名前と handle、吹き出しと時刻、下部に composer。 */
export function ConversationPane({
  conversation,
  users,
}: {
  conversation: TwitterConversation;
  users: Map<string, User>;
}) {
  const peer = users.get(peerIdOf(conversation));
  if (!peer) {
    return null;
  }
  const peerProfile = getProfile(peer.id);
  const groups = groupMessages(conversation);
  return (
    <div className="tw-dm-conv">
      <header className="tw-dm-conv-head">
        <Link href={`/twitter/profile/${peer.handle}`} className="tw-dm-peer">
          <Avatar user={peer} size="sm" />
          <span className="tw-dm-peer-text">
            <span className="tw-name">
              {peer.displayName}
              {isVerified(peer) ? <VerifiedBadge /> : null}
            </span>
            <span className="tw-handle">@{peer.handle}</span>
          </span>
        </Link>
        <span className="tw-dm-info" aria-hidden="true">
          <InfoIcon />
        </span>
      </header>
      <div className="tw-dm-scroll">
        <div className="tw-dm-peer-intro">
          <Avatar user={peer} size="lg" />
          <p className="tw-name">
            {peer.displayName}
            {isVerified(peer) ? <VerifiedBadge /> : null}
          </p>
          <p className="tw-handle">@{peer.handle}</p>
          {peerProfile ? (
            <p className="tw-dm-intro-meta">{formatJoinedAt(peerProfile.joinedAt)}から利用</p>
          ) : null}
        </div>
        {groups.map((group) => {
          const mine = group.senderId === TWITTER_ME_ID;
          return (
            <div key={group.sentAt} className="tw-msg-group" data-mine={mine || undefined}>
              {group.bodies.map((body, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: 表示のみで並び替えも増減も無い
                <p key={i} className="tw-msg-bubble">
                  {body}
                </p>
              ))}
              <p className="tw-msg-time">{formatMessageTime(group.sentAt)}</p>
            </div>
          );
        })}
      </div>
      <div className="tw-dm-composer">
        <span className="tw-dm-composer-icons" aria-hidden="true">
          <MediaIcon />
          <GifIcon />
          <EmojiIcon />
        </span>
        <input
          className="tw-dm-input"
          placeholder="新しいメッセージを作成"
          aria-label="新しいメッセージ（無効）"
          disabled
        />
        <button type="button" className="tw-dm-send" disabled aria-label="送信（無効）">
          <SendIcon />
        </button>
      </div>
    </div>
  );
}
