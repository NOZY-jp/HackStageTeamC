import type { User } from "@/lib/mock/types";
import { Avatar } from "./avatar";

/** 表示専用。バックエンドも投稿処理も無いので、入力欄とボタンは disabled の静的表示。 */
export function Composer({ user }: { user: User }) {
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
          <p className="tw-composer-note">このデモでは投稿できません</p>
          <button type="button" className="tw-button" disabled>
            ポストする
          </button>
        </div>
      </div>
    </section>
  );
}
