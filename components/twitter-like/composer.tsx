import type { TwitterUser } from "@/lib/twitter-like/types";
import { Avatar } from "./avatar";
import { CalendarIcon, EmojiIcon, GifIcon, MediaIcon, PollIcon } from "./icons";

const composerIcons = [
  { key: "media", icon: <MediaIcon /> },
  { key: "gif", icon: <GifIcon /> },
  { key: "poll", icon: <PollIcon /> },
  { key: "emoji", icon: <EmojiIcon /> },
  { key: "calendar", icon: <CalendarIcon /> },
];

/** 表示専用。バックエンドも投稿処理も無いので、入力欄とボタンは disabled の静的表示。 */
export function Composer({ user }: { user: TwitterUser }) {
  return (
    <section className="tw-composer" aria-label="投稿の作成（表示のみ）">
      <Avatar user={user} />
      <div className="tw-composer-main">
        <textarea
          className="tw-composer-input"
          rows={2}
          placeholder="いまどうしてる？"
          aria-label="投稿内容（無効）"
          disabled
        />
        <div className="tw-composer-foot">
          <div className="tw-composer-icons" aria-hidden="true">
            {composerIcons.map(({ key, icon }) => (
              <span key={key} className="tw-composer-icon">
                {icon}
              </span>
            ))}
          </div>
          <button type="button" className="tw-button" disabled>
            ポストする
          </button>
        </div>
      </div>
    </section>
  );
}

/** 個別投稿ページの返信欄。こちらも表示専用で disabled。 */
export function ReplyComposer({
  user,
  thread,
}: {
  user: TwitterUser;
  thread?: "up" | "down" | "updown";
}) {
  return (
    <section className="tw-reply-composer" data-thread={thread} aria-label="返信の作成（表示のみ）">
      <Avatar user={user} />
      <p className="tw-reply-placeholder">返信をポスト</p>
      <button type="button" className="tw-button" disabled>
        返信
      </button>
    </section>
  );
}
