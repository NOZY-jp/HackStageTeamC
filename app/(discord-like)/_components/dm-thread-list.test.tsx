import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StoryProvider, useStory } from "@/components/common/story/story-provider";
import { dmThreadPath } from "@/lib/platform/app-prefix";
import { type DmThreadItem, DmThreadList } from "./dm-thread-list";
import { LocalMessagesProvider, useLocalMessages } from "./local-messages-context";

const nav = { path: "" };
vi.mock("next/navigation", () => ({
  usePathname: () => nav.path,
}));

const thread = (id: string, urlId: string, name: string): DmThreadItem => ({
  id,
  urlId,
  name,
  avatarColor: "#5865f2",
  status: "online",
  preview: "こんにちは",
  sentAt: "2026-11-25T12:34:00+09:00",
  unread: 0,
});

const THREADS = [thread("t1", "111", "MaiMai"), thread("dm-kai", "222", "χ")];

function ReceiveMessage() {
  const { setLiveChats } = useStory();
  const { addMessage } = useLocalMessages();
  return (
    <button
      type="button"
      onClick={() => {
        setLiveChats([
          {
            id: "kai-message:0",
            channel: "discord:dm-kai",
            from: "kai",
            text: "新しい\nメッセージ",
            at: "2026-11-25T23:48:00+09:00",
          },
        ]);
        addMessage("dm-kai", "通話を開始しました", { system: true });
      }}
    >
      受信
    </button>
  );
}

describe("DM 一覧のプレビュー", () => {
  it("新しいメッセージが届いたスレッドの本文プレビューと時刻を更新する", () => {
    vi.setSystemTime(new Date("2026-11-25T15:01:00Z"));
    try {
      render(
        <StoryProvider>
          <LocalMessagesProvider>
            <DmThreadList threads={THREADS} />
            <ReceiveMessage />
          </LocalMessagesProvider>
        </StoryProvider>,
      );

      const kai = screen.getByRole("link", { name: /^χ、/ });
      expect(within(kai).getByText("こんにちは")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "受信" }));

      expect(within(kai).getByText("新しい メッセージ")).toBeInTheDocument();
      expect(within(kai).getByText("23:48")).toBeInTheDocument();
      expect(kai).toHaveAccessibleName("χ、最新 23:48、オンライン");
      expect(
        within(screen.getByRole("link", { name: /^MaiMai、/ })).getByText("こんにちは"),
      ).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("DM 一覧のハイライト（#70）", () => {
  it("pathname と一致するスレッドだけ aria-current を付ける", () => {
    nav.path = dmThreadPath("222");
    render(<DmThreadList threads={THREADS} />);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0].getAttribute("aria-current")).toBeNull();
    expect(links[1].getAttribute("aria-current")).toBe("page");
  });

  it("末尾スラッシュやエンコード差でも一致とみなす", () => {
    nav.path = `${dmThreadPath("111")}/`.replace("@me", "%40me");
    render(<DmThreadList threads={THREADS} />);

    expect(screen.getAllByRole("link")[0].getAttribute("aria-current")).toBe("page");
    expect(screen.getAllByRole("link")[1].getAttribute("aria-current")).toBeNull();
  });
});
