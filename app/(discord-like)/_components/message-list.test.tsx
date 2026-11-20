import { fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

describe("MessageList の検索ジャンプ（中央寄せ）", () => {
  const scrollIntoView = vi.fn();
  let original: typeof Element.prototype.scrollIntoView | undefined;

  beforeEach(() => {
    scrollIntoView.mockReset();
    original = Element.prototype.scrollIntoView;
    // jsdom は scrollIntoView を実装していないので、呼び出しだけ記録する
    Element.prototype.scrollIntoView = scrollIntoView;
  });

  afterEach(() => {
    if (original) {
      Element.prototype.scrollIntoView = original;
    } else {
      Reflect.deleteProperty(Element.prototype, "scrollIntoView");
    }
  });

  const list = (items: Message[], focusMessageId?: string) => (
    <AppShell rail={<span />}>
      <MessageList
        messages={items}
        authors={authors}
        title="一般"
        showHash
        onLoadOlder={() => {}}
        focusMessageId={focusMessageId}
      />
    </AppShell>
  );

  it("ジャンプ直後は対象を画面中央に出す", () => {
    render(list(messages, "m-1"));

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "center" });
    expect((scrollIntoView.mock.contexts[0] as HTMLElement).dataset.messageId).toBe("m-1");
  });

  it("古いメッセージの追加読み込みで件数が増えても、中央寄せをやり直さない", () => {
    const { rerender } = render(list(messages, "m-1"));
    expect(scrollIntoView).toHaveBeenCalledTimes(1);

    const older: Message[] = [
      { ...messages[0], id: "m-older", sentAt: "2026-10-31T10:00:00+09:00" },
      ...messages,
    ];
    rerender(list(older, "m-1"));

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("送信で末尾に増えても、中央寄せをやり直さない", () => {
    const { rerender } = render(list(messages, "m-1"));
    expect(scrollIntoView).toHaveBeenCalledTimes(1);

    const sent: Message[] = [
      ...messages,
      { ...messages[0], id: "m-sent", sentAt: "2026-11-05T10:00:00+09:00", body: "送信しました" },
    ];
    rerender(list(sent, "m-1"));

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("ジャンプ先がまだ読まれていなければ、現れた1回だけ中央寄せする", () => {
    const { rerender } = render(list(messages.slice(0, 2), "m-2"));
    expect(scrollIntoView).not.toHaveBeenCalled();

    rerender(list(messages, "m-2"));
    expect(scrollIntoView).toHaveBeenCalledTimes(1);

    const older: Message[] = [
      { ...messages[0], id: "m-older", sentAt: "2026-10-31T10:00:00+09:00" },
      ...messages,
    ];
    rerender(list(older, "m-2"));
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("別のメッセージへジャンプし直したときは、その1回だけ中央寄せする", () => {
    const { rerender } = render(list(messages, "m-1"));
    expect(scrollIntoView).toHaveBeenCalledTimes(1);

    rerender(list(messages, "m-2"));
    expect(scrollIntoView).toHaveBeenCalledTimes(2);
    expect((scrollIntoView.mock.contexts[1] as HTMLElement).dataset.messageId).toBe("m-2");
  });
});
