import { render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { describe, expect, it } from "vitest";
import { StoryPage, StoryProvider, useStory } from "./story-provider";

function Cover({ on }: { on: boolean }) {
  const { setCovering } = useStory();
  useEffect(() => setCovering(on), [on, setCovering]);
  return null;
}

function renderPage(on: boolean) {
  render(
    <StoryProvider>
      <StoryPage>
        <input aria-label="後ろの画面の入力欄" />
      </StoryPage>
      <Cover on={on} />
    </StoryProvider>,
  );
  return screen.getByLabelText("後ろの画面の入力欄").parentElement;
}

describe("StoryPage（後ろの画面）", () => {
  it("場面を流しているあいだは、後ろの画面が inert になる（Tab・キー入力でも触れない）", () => {
    expect(renderPage(true)).toHaveAttribute("inert");
  });

  it("場面が無いときは、後ろの画面をそのまま操作できる", () => {
    expect(renderPage(false)).not.toHaveAttribute("inert");
  });
});
