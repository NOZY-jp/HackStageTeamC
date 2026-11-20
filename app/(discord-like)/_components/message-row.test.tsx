import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Message, MessageAuthor } from "@/lib/discord-like/types";
import { MessageRow } from "./message-row";

const authors: Record<string, MessageAuthor> = {
  master: { id: "master", displayName: "集会所マスター", avatarColor: "#95a5a6" },
};

const message: Message = {
  id: "mhc-notice-0003",
  channelId: "mhc-notice",
  authorId: "master",
  sentAt: "2025-05-03T16:56:00+09:00",
  body: "集会所のルールを更新しました。",
};

describe("MessageRow のピン留め表示", () => {
  it("pinned のメッセージにはピン留めのアイコンとアクセシブル名を出す", () => {
    render(
      <MessageRow
        message={{ ...message, pinned: true }}
        authors={authors}
        grouped={false}
        replyTarget={undefined}
        time="16:56"
      />,
    );
    expect(screen.getByRole("img", { name: "ピン留め" })).toHaveAttribute("title", "ピン留め");
  });

  it("pinned でないメッセージには出さない", () => {
    render(
      <MessageRow
        message={message}
        authors={authors}
        grouped={false}
        replyTarget={undefined}
        time="16:56"
      />,
    );
    expect(screen.queryByRole("img", { name: "ピン留め" })).not.toBeInTheDocument();
  });
});
