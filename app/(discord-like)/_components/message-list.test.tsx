import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppShell } from "@/components/discord-like/app-shell";
import type { Message, MessageAuthor } from "@/lib/discord-like/types";
import { MessageList } from "./message-list";

const author: MessageAuthor = { id: "u1", displayName: "テスト", avatarColor: "#5865f2" };
const authors: Record<string, MessageAuthor> = { u1: author };

const messages: Message[] = Array.from({ length: 3 }, (_, index) => ({
  id: `m-${index}`,
  channelId: "c1",
  authorId: "u1",
  sentAt: `2026-11-0${index + 1}T10:00:00+09:00`,
  body: `本文${index}`,
}));

/** jsdom にはレイアウトが無いので、スクロール量だけ手で与える */
function setMetrics(
  element: HTMLElement,
  { scrollTop, scrollHeight, clientHeight }: Record<string, number>,
) {
  Object.defineProperty(element, "scrollHeight", { configurable: true, value: scrollHeight });
  Object.defineProperty(element, "clientHeight", { configurable: true, value: clientHeight });
  element.scrollTop = scrollTop;
}

describe("MessageList の「最新へ」", () => {
  it("押すと親に通知し（位置補正の基準を捨てる）、最下部へ移動する", () => {
    const onJumpToLatest = vi.fn();
    const { container } = render(
      <AppShell rail={<span />}>
        <MessageList
          messages={messages}
          authors={authors}
          title="一般"
          showHash
          onLoadOlder={() => {}}
          onJumpToLatest={onJumpToLatest}
        />
      </AppShell>,
    );

    const scroller = container.querySelector(".message-scroll") as HTMLDivElement;
    setMetrics(scroller, { scrollTop: 100, scrollHeight: 2000, clientHeight: 500 });
    fireEvent.scroll(scroller);

    const button = container.querySelector(".message-jump-latest") as HTMLButtonElement | null;
    expect(button).not.toBeNull();
    fireEvent.click(button as HTMLButtonElement);

    expect(onJumpToLatest).toHaveBeenCalledTimes(1);
    expect(scroller.scrollTop).toBe(2000);
    expect(container.querySelector(".message-jump-latest")).toBeNull();
  });
});
