import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { searchMessages } from "@/app/(discord-like)/_actions/message-search";
import { StoryProvider, useStory } from "@/components/common/story/story-provider";
import { AppShell } from "@/components/discord-like/app-shell";
import { listDMMessages, loadUntil } from "@/lib/discord-like";
import type { SearchHit } from "@/lib/discord-like/search";
import { toMessageView } from "@/lib/discord-like/view";
import { availableBeats, type FlagId } from "@/lib/story";
import { BLOG_TALK_MESSAGE_ID, MAIMAI_DM_URL_ID } from "@/lib/story/places";
import { LocalMessagesProvider } from "./local-messages-context";
import { MessagePane } from "./message-pane";
import { MessageSearch } from "./message-search";

vi.mock("@/app/(discord-like)/_actions/message-page", () => ({
  fetchMessagePage: vi.fn(async () => ({
    messages: [],
    authors: {},
    hasMore: false,
    nextCursor: null,
  })),
}));
vi.mock("@/app/(discord-like)/_actions/message-search", () => ({
  searchMessages: vi.fn(),
}));

type ObserverCallback = (entries: Partial<IntersectionObserverEntry>[]) => void;
type ObserverRecord = { callback: ObserverCallback; targets: Element[]; active: boolean };

const observers: ObserverRecord[] = [];

class MockIntersectionObserver {
  private record: ObserverRecord;
  constructor(callback: ObserverCallback) {
    this.record = { callback, targets: [], active: true };
    observers.push(this.record);
  }
  observe(target: Element) {
    this.record.targets.push(target);
  }
  unobserve() {}
  disconnect() {
    this.record.active = false;
  }
  takeRecords() {
    return [];
  }
}
vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);

/** 進行状態を読むだけの表示（story-integration.test.tsx と同じ Probe） */
function Probe({ onState }: { onState: (flags: FlagId[]) => void }) {
  const { state, ready } = useStory();
  if (ready) onState(state.flags);
  return null;
}

const mockedSearch = vi.mocked(searchMessages);

const blogTalkHit: SearchHit = {
  id: BLOG_TALK_MESSAGE_ID,
  mode: "dm",
  threadUrlId: MAIMAI_DM_URL_ID,
  channelLabel: "MaiMai",
  authorId: "maimai",
  authorName: "MaiMai",
  authorHandle: "maimaimaimai",
  sentAt: "2026-04-18T23:15:00+09:00",
  body: "やってた。攻略ブログまで書いてた、自分用に絵つきで",
  pinned: false,
};

const renderMaimaiDm = (
  onState: (flags: FlagId[]) => void,
  options: { focusMessageId?: string } = {},
) => {
  // 検索ジャンプ（?m=）のときは、サーバー側が発言を含むページまで遡って返す（page.tsx と同じ）
  const focused = options.focusMessageId
    ? loadUntil({ threadId: "dm-maimai", messageId: options.focusMessageId })
    : undefined;
  const view = toMessageView(focused?.found ? focused : listDMMessages({ threadId: "dm-maimai" }));
  return render(
    <StoryProvider>
      <AppShell rail={<span />}>
        <LocalMessagesProvider>
          <MessagePane
            channelKey="dm-maimai"
            mode="dm"
            initialView={view}
            title="MaiMai"
            seen={{ messageId: BLOG_TALK_MESSAGE_ID, flag: "s01-blog-talk" }}
            focusMessageId={focused?.found ? options.focusMessageId : undefined}
          />
        </LocalMessagesProvider>
      </AppShell>
      <Probe onState={onState} />
    </StoryProvider>,
  );
};

/** 「攻略ブログ」の発言の行を監視している observer を発火させる（画面に見えた合図） */
const triggerSeen = async () => {
  const watcher = observers.find(
    (observer) =>
      observer.active &&
      observer.targets.some(
        (target) => target.getAttribute("data-message-id") === BLOG_TALK_MESSAGE_ID,
      ),
  );
  await act(async () => watcher?.callback([{ isIntersecting: true }]));
  return watcher;
};

beforeEach(() => {
  observers.length = 0;
  mockedSearch.mockReset();
  window.localStorage.clear();
  Element.prototype.scrollIntoView = vi.fn();
});

describe("段階1: MaiMai の「攻略ブログ」の発言を確認すると s01-blog-talk が立つ", () => {
  it("検索ジャンプで開いた発言が画面に見えたら立ち、カイの手がかりが届く", async () => {
    const seen: FlagId[][] = [];
    renderMaimaiDm((flags) => seen.push(flags), { focusMessageId: BLOG_TALK_MESSAGE_ID });

    expect(await triggerSeen(), "発言の行を監視している").toBeDefined();
    await waitFor(() => expect(seen.at(-1)).toContain("s01-blog-talk"));

    // 段階1に着くと、カイとのDMでTwixerの投稿が届く場面が始められる
    const state = { flags: seen.at(-1) ?? [], completed: [], choices: {} };
    expect(availableBeats(state).some((beat) => beat.place === "discord:dm-kai")).toBe(true);
  });

  it("DMを開いただけでは立たない（発言が画面に出ていないため）", async () => {
    const seen: FlagId[][] = [];
    renderMaimaiDm((flags) => seen.push(flags));

    // 発言は最新ページより古いので、開いた直後は監視対象の行が無い
    expect(await triggerSeen()).toBeUndefined();
    await waitFor(() => expect(seen.length).toBeGreaterThan(0));
    expect(seen.at(-1)).not.toContain("s01-blog-talk");
  });

  it("検索結果にその発言が出ても立つ（検索する導線）", async () => {
    mockedSearch.mockResolvedValue({ ok: true, hits: [blogTalkHit], total: 1, matchedUsers: [] });
    const seen: FlagId[][] = [];
    render(
      <StoryProvider>
        <MessageSearch />
        <Probe onState={(flags) => seen.push(flags)} />
      </StoryProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "検索" }));
    fireEvent.change(screen.getByLabelText("メッセージを検索"), {
      target: { value: "攻略ブログ" },
    });

    await screen.findByText("全1件中 1件を表示");
    await waitFor(() => expect(seen.at(-1)).toContain("s01-blog-talk"));
  });

  it("関係ないメッセージの検索ヒットでは立たない", async () => {
    mockedSearch.mockResolvedValue({
      ok: true,
      hits: [{ ...blogTalkHit, id: "dm-maimai-0063" }],
      total: 1,
      matchedUsers: [],
    });
    const seen: FlagId[][] = [];
    render(
      <StoryProvider>
        <MessageSearch />
        <Probe onState={(flags) => seen.push(flags)} />
      </StoryProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "検索" }));
    fireEvent.change(screen.getByLabelText("メッセージを検索"), { target: { value: "note" } });

    await screen.findByText("全1件中 1件を表示");
    await waitFor(() => expect(seen.length).toBeGreaterThan(0));
    expect(seen.at(-1)).not.toContain("s01-blog-talk");
  });
});
