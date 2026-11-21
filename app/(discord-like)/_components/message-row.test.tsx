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

describe("MessageRow の同一タブリンク", () => {
  const dendenAuthors: Record<string, MessageAuthor> = {
    denden: {
      id: "denden",
      displayName: "hunter_denden",
      avatarColor: "#7289da",
      profileUrl: "/pochiblo/mylist/k7q2m9d4",
    },
  };

  it("profileUrl 付きの投稿者は target=_blank なしの内部リンクにする", () => {
    render(
      <MessageRow
        message={{
          id: "mhc-lfg-0901",
          channelId: "mhc-lfg",
          authorId: "denden",
          sentAt: "2018-04-20T21:14:00+09:00",
          body: "ネルギガンテを周回するパーティー組みたいです！",
        }}
        authors={dendenAuthors}
        grouped={false}
        replyTarget={undefined}
        time="21:14"
      />,
    );
    const authorLink = screen.getByRole("link", { name: "hunter_denden" });
    expect(authorLink).toHaveAttribute("href", "/pochiblo/mylist/k7q2m9d4");
    expect(authorLink).toHaveClass("message-author");
    expect(authorLink).not.toHaveAttribute("target");
  });

  it("本文内の pochiblo.jp URL を同一タブの /pochiblo リンクにし、外部モックURLはそのまま残す", () => {
    render(
      <MessageRow
        message={{
          id: "mhc-lfg-0904",
          channelId: "mhc-lfg",
          authorId: "denden",
          sentAt: "2018-04-21T20:42:00+09:00",
          body: "双剣と弓の装備メモ、ブログの記事一覧にまとめました！よかったら見てください https://pochiblo.jp/mylist/k7q2m9d4",
        }}
        authors={dendenAuthors}
        grouped={false}
        replyTarget={undefined}
        time="20:42"
      />,
    );
    const bodyLink = screen.getByRole("link", { name: "https://pochiblo.jp/mylist/k7q2m9d4" });
    expect(bodyLink).toHaveAttribute("href", "/pochiblo/mylist/k7q2m9d4");
    expect(bodyLink).toHaveClass("message-link");
    expect(bodyLink).not.toHaveAttribute("target");

    render(
      <MessageRow
        message={{
          ...message,
          body: "この動画、笑った https://example.com/clips/0912",
        }}
        authors={authors}
        grouped={false}
        replyTarget={undefined}
        time="16:56"
      />,
    );
    expect(
      screen.queryByRole("link", { name: "https://example.com/clips/0912" }),
    ).not.toBeInTheDocument();
  });
});
