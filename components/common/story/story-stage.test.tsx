import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { type Beat, initialState } from "@/lib/story";
import type { ScenePlayerProps } from "./stage/scene-player";
import { useStory } from "./story-provider";
import { StoryStage } from "./story-stage";

vi.mock("next/navigation", () => ({
  usePathname: () => "/twitter",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("./story-provider", () => ({ useStory: vi.fn() }));
vi.mock("next/dynamic", () => ({
  default: () =>
    function Presenter({ settings, onSettingsChange }: ScenePlayerProps) {
      return (
        <>
          <output>{`${settings.mode}:${settings.speed}`}</output>
          <button type="button" onClick={() => onSettingsChange({ mode: "skip", speed: "fast" })}>
            スキップ
          </button>
          <button type="button" onClick={() => onSettingsChange({ mode: "auto", speed: "fast" })}>
            オート
          </button>
        </>
      );
    },
}));

beforeEach(() => {
  window.localStorage.clear();
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
});
afterEach(() => vi.unstubAllGlobals());

it.each([
  { label: "スキップ", selected: "skip", resumed: "click" },
  { label: "オート", selected: "auto", resumed: "auto" },
])("探索後の再生設定を復元する（$label）", ({ label, selected, resumed }) => {
  const beat: Beat = { id: "first", chapter: 1, script: [], when: [] };
  const story: ReturnType<typeof useStory> = {
    state: { ...initialState, flags: ["started"] },
    upcoming: beat,
    ready: true,
    chats: [],
    voice: [],
    covering: false,
    completeBeat: vi.fn(),
    setFlag: vi.fn(),
    reset: vi.fn(),
    setLiveChats: vi.fn(),
    setVoice: vi.fn(),
    setCovering: vi.fn(),
  };
  vi.mocked(useStory).mockReturnValue(story);
  const { rerender } = render(<StoryStage />);

  fireEvent.click(screen.getByRole("button", { name: label }));
  expect(screen.getByRole("status")).toHaveTextContent(`${selected}:fast`);

  story.upcoming = { ...beat, id: "continuous" };
  rerender(<StoryStage />);
  expect(screen.getByRole("status")).toHaveTextContent(`${selected}:fast`);

  story.upcoming = undefined;
  rerender(<StoryStage />);
  expect(screen.queryByRole("status")).toBeNull();

  story.upcoming = { ...beat, id: "after-exploration" };
  rerender(<StoryStage />);
  expect(screen.getByRole("status")).toHaveTextContent(`${resumed}:fast`);
});
