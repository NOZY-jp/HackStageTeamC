import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StoryProvider, useStory } from "@/components/common/story/story-provider";
import type { FlagId } from "@/lib/story";
import { PostSeenTrigger } from "./post-seen-trigger";

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

function Probe({ onFlags }: { onFlags: (flags: FlagId[]) => void }) {
  const { state, ready } = useStory();
  if (ready) onFlags(state.flags);
  return <span data-testid="flags">{state.flags.join(",")}</span>;
}

describe("PostSeenTrigger", () => {
  beforeEach(() => {
    observers.length = 0;
    window.localStorage.clear();
  });

  it("StoryProvider の外でもエラーにならず中身を描画する", () => {
    render(
      <PostSeenTrigger flag="te04-kanon-stalker-post">
        <p>対象ポスト</p>
      </PostSeenTrigger>,
    );
    expect(screen.getByText("対象ポスト")).toBeInTheDocument();
  });

  it("初期描画（非交差）ではフラグを立てず、画面内に半分以上見えた時点で立てる", async () => {
    const seen: FlagId[][] = [];
    render(
      <StoryProvider>
        <PostSeenTrigger flag="te04-kanon-stalker-post">
          <p>友達がストーカーされてるっぽくて</p>
        </PostSeenTrigger>
        <Probe onFlags={(flags) => seen.push(flags)} />
      </StoryProvider>,
    );

    await waitFor(() => expect(seen.length).toBeGreaterThan(0));
    expect(seen.at(-1)).not.toContain("te04-kanon-stalker-post");
    expect(observers).toHaveLength(1);

    await act(async () => observers[0].callback([{ isIntersecting: false }]));
    expect(seen.at(-1)).not.toContain("te04-kanon-stalker-post");

    await act(async () => observers[0].callback([{ isIntersecting: true }]));
    await waitFor(() => expect(seen.at(-1)).toContain("te04-kanon-stalker-post"));
    expect(observers[0].active).toBe(false);
  });
});
