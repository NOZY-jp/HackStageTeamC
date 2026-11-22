import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { STORAGE_KEY } from "@/lib/story";
import { clearFoundBff, FOUND_BFF_COOKIE } from "@/lib/story/discovery-cookie";
import { StoryProvider, useStory } from "./story-provider";

/** 進行状態を読み終えたら知らせるだけの部品 */
function Probe() {
  const { ready } = useStory();
  return <output data-testid="ready">{ready ? "ready" : "loading"}</output>;
}

describe("発見済みの控え（#248）", () => {
  afterEach(() => {
    clearFoundBff();
    window.localStorage.clear();
  });

  it("発見済みのセーブを読み込むと、検索用の cookie を立てる", async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ flags: ["foundBff"], completed: [], choices: {} }),
    );
    render(
      <StoryProvider>
        <Probe />
      </StoryProvider>,
    );
    await waitFor(() => expect(document.cookie).toContain(`${FOUND_BFF_COOKIE}=1`));
  });

  it("未発見のセーブでは cookie を立てない", async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ flags: [], completed: [], choices: {} }),
    );
    render(
      <StoryProvider>
        <Probe />
      </StoryProvider>,
    );
    await waitFor(() => expect(document.cookie).not.toContain(`${FOUND_BFF_COOKIE}=1`));
  });
});
