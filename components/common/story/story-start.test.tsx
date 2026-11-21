import { act, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StoryProvider, useStory } from "./story-provider";
import { StoryStart } from "./story-start";

const nav = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => nav.pathname }));

let flags: string[] = [];
function Probe() {
  flags = useStory().state.flags;
  return null;
}

async function renderAt(pathname: string) {
  nav.pathname = pathname;
  await act(async () => {
    render(
      <StoryProvider>
        <StoryStart />
        <Probe />
      </StoryProvider>,
    );
  });
}

describe("StoryStart（開いた時点でゲームを始める）", () => {
  beforeEach(() => {
    window.localStorage.clear();
    flags = [];
  });

  it("タイトル画面（/）では始めない（「はじめる」を押すまで待つ）", async () => {
    await renderAt("/");
    expect(flags).not.toContain("started");
  });

  it("各画面を直接開いたときは始める", async () => {
    await renderAt("/twitter");
    expect(flags).toContain("started");
  });
});
