import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { availableBeats, type FlagId, STORAGE_KEY } from "@/lib/story";
import { StoryAction } from "./story-action";
import { StoryProvider, useStory } from "./story-provider";

/** 進行状態を読むだけの表示（テストでフラグを直接入れないため、操作はボタンだけ） */
function Probe({ onState }: { onState: (flags: FlagId[]) => void }) {
  const { state, ready } = useStory();
  if (ready) onState(state.flags);
  return null;
}

describe("手がかりの導線（#119）", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("マイリストで本名をたどる操作をすると段階8が立ち、カイの連絡が始まる", async () => {
    const seen: FlagId[][] = [];
    render(
      <StoryProvider>
        <StoryAction flag="s08-real-name">この記事から本名をたどる</StoryAction>
        <Probe onState={(flags) => seen.push(flags)} />
      </StoryProvider>,
    );
    expect(
      availableBeats({ flags: [], completed: [], choices: {} }).some(
        (b) => b.place === "discord:dm-kai",
      ),
    ).toBe(false);

    await userEvent.click(screen.getByRole("button", { name: "この記事から本名をたどる" }));

    const state = { flags: seen.at(-1) ?? [], completed: [], choices: {} };
    expect(state.flags).toContain("s08-real-name");
    expect(availableBeats(state).some((beat) => beat.place === "discord:dm-kai")).toBe(true);
  });

  it("talkup で本人を確かめる操作をすると段階10が立ち、結末の選択肢が出る", async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        flags: ["started", "s08-real-name", "s09-kai-contact"],
        completed: ["ch5-kai-contact"],
        choices: {},
      }),
    );
    const seen: FlagId[][] = [];
    render(
      <StoryProvider>
        <StoryAction flag="s10-talkup-match">この人物で間違いない</StoryAction>
        <Probe onState={(flags) => seen.push(flags)} />
      </StoryProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "この人物で間違いない" }));

    const state = { flags: seen.at(-1) ?? [], completed: ["ch5-kai-contact"], choices: {} };
    expect(state.flags).toContain("s10-talkup-match");
    const report = availableBeats(state).find((beat) => beat.place === "discord:dm-kai");
    expect(report?.choices?.[0]?.label).toBe("住所を特定しました");
  });
});
