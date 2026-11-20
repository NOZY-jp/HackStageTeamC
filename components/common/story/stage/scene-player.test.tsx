import { act, fireEvent, render, screen } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { type Beat, flag, narrate, type PlaybackSettings, say, show, think } from "@/lib/story";
import { ScenePlayer } from "./scene-player";

const settings: PlaybackSettings = { mode: "click", speed: "instant" };

const beat: Beat = {
  id: "test-scene",
  chapter: 1,
  when: [],
  script: [
    show("kai", { character: "kai" }),
    narrate("一行目"),
    flag("askedKai"),
    say("kai", "二行目"),
  ],
  choices: [
    { id: "a", label: "Aにする", reply: [think("Aを選んだ")] },
    { id: "b", label: "Bにする" },
  ],
};

async function flush() {
  // 命令の実行（requestAnimationFrame・setTimeout）を進める
  for (let i = 0; i < 5; i += 1) {
    await act(async () => {
      vi.runOnlyPendingTimers();
      await Promise.resolve();
    });
  }
}

function renderPlayer(onComplete = vi.fn(), onFlag = vi.fn()) {
  // 開発時と同じく StrictMode で包む（effect の付け直しで場面が止まらないことも確かめる）
  render(
    <StrictMode>
      <ScenePlayer
        beat={beat}
        settings={settings}
        onSettingsChange={vi.fn()}
        onComplete={onComplete}
        onFlag={onFlag}
        onMinimize={vi.fn()}
        onOpenLog={vi.fn()}
        rememberPosition={false}
      />
    </StrictMode>,
  );
  return { onComplete, onFlag };
}

describe("ScenePlayer", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("文章で止まり、進めると途中の命令（フラグ）を実行して次の文章へ", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "requestAnimationFrame", "setInterval"] });
    const { onFlag } = renderPlayer();
    await flush();
    expect(screen.getByText("一行目")).toBeInTheDocument();
    expect(onFlag).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("一行目"));
    await flush();
    expect(onFlag).toHaveBeenCalledWith("askedKai");
    expect(screen.getByText("二行目")).toBeInTheDocument();
  });

  it("最後に選択肢を出し、選ぶとリョウの発言と続きを流してから場面を終える", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "requestAnimationFrame", "setInterval"] });
    const { onComplete } = renderPlayer();
    await flush();
    fireEvent.click(screen.getByText("一行目"));
    await flush();
    fireEvent.click(screen.getByText("二行目"));
    await flush();
    expect(onComplete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Aにする" }));
    await flush();
    expect(screen.getByText("Aにする")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Aにする"));
    await flush();
    expect(screen.getByText("Aを選んだ")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Aを選んだ"));
    await flush();
    expect(onComplete).toHaveBeenCalledWith(beat, "a");
  });
});
