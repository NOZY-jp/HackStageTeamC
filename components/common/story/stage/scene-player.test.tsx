import { act, fireEvent, render, screen } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  type Beat,
  chat,
  type FlagId,
  flag,
  narrate,
  type PlaybackSettings,
  say,
  show,
  think,
} from "@/lib/story";
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

function renderPlayer(
  onComplete = vi.fn(),
  onFlag = vi.fn(),
  scene: Beat = beat,
  flags?: string[],
) {
  // 開発時と同じく StrictMode で包む（effect の付け直しで場面が止まらないことも確かめる）
  render(
    <StrictMode>
      <ScenePlayer
        beat={scene}
        settings={settings}
        flags={flags as never}
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

  it("DM を一通ずつ表示し、待機中に次のメッセージを出さない", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "requestAnimationFrame", "setInterval"] });
    const onChatsChange = vi.fn();
    const onComplete = vi.fn();
    const scene: Beat = {
      id: "test-dm",
      chapter: 1,
      when: [],
      script: [
        chat("discord:dm-kai", "ryo", "一通目", "2026-11-25T23:30:01+09:00", { wait: 3000 }),
        chat("discord:dm-kai", "kai", "二通目", "2026-11-25T23:30:02+09:00", { wait: 3000 }),
      ],
    };
    render(
      <ScenePlayer
        beat={scene}
        settings={settings}
        onSettingsChange={vi.fn()}
        onComplete={onComplete}
        onFlag={vi.fn()}
        onMinimize={vi.fn()}
        onOpenLog={vi.fn()}
        onChatsChange={onChatsChange}
        rememberPosition={false}
      />,
    );
    await act(async () => {
      await Promise.resolve();
    });
    expect(
      onChatsChange.mock.lastCall?.[0].map((message: { text: string }) => message.text),
    ).toEqual(["一通目"]);
    expect(onComplete).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(
      onChatsChange.mock.lastCall?.[0].map((message: { text: string }) => message.text),
    ).toEqual(["一通目", "二通目"]);
    expect(onComplete).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(onComplete).toHaveBeenCalled();
  });

  it("文章で止まり、進めると途中の命令（フラグ）を実行して次の文章へ", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "requestAnimationFrame", "setInterval"] });
    const { onFlag } = renderPlayer();
    await flush();
    expect(screen.getByText("一行目", { selector: ".sw-text" })).toBeInTheDocument();
    expect(onFlag).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("一行目", { selector: ".sw-text" }));
    await flush();
    expect(onFlag).toHaveBeenCalledWith("askedKai");
    expect(screen.getByText("二行目", { selector: ".sw-text" })).toBeInTheDocument();
  });

  it("最後に選択肢を出し、選ぶとリョウの発言と続きを流してから場面を終える", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "requestAnimationFrame", "setInterval"] });
    const { onComplete } = renderPlayer();
    await flush();
    fireEvent.click(screen.getByText("一行目", { selector: ".sw-text" }));
    await flush();
    fireEvent.click(screen.getByText("二行目", { selector: ".sw-text" }));
    await flush();
    expect(onComplete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Aにする" }));
    await flush();
    expect(screen.getByText("Aにする")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Aにする"));
    await flush();
    expect(screen.getByText("Aを選んだ", { selector: ".sw-text" })).toBeInTheDocument();
    fireEvent.click(screen.getByText("Aを選んだ", { selector: ".sw-text" }));
    await flush();
    expect(onComplete).toHaveBeenCalledWith(beat, ["a"]);
  });

  it("寄り道を選ぶと、返事のあとに残りの選択肢がまた出て、最後に選んだ順で場面を終える", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "requestAnimationFrame", "setInterval"] });
    const detour: Beat = {
      id: "test-detour",
      chapter: 1,
      when: [],
      script: [say("kai", "どうする？")],
      choices: [
        { id: "go", label: "検索する" },
        {
          id: "ask",
          label: "相談する",
          completes: false,
          reply: [say("kai", "寄り道の返事")],
        },
        { id: "hidden", label: "条件つき", requires: ["s03-blog-found"] },
      ],
    };
    const onComplete = vi.fn();
    renderPlayer(onComplete, vi.fn(), detour, ["started"]);
    await flush();
    fireEvent.click(screen.getByText("どうする？", { selector: ".sw-text" }));
    await flush();
    // 条件のフラグが無い選択肢は出ない
    expect(screen.queryByRole("button", { name: "条件つき" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "相談する" }));
    await flush();
    fireEvent.click(screen.getByText("相談する", { selector: ".sw-text" }));
    await flush();
    expect(screen.getByText("寄り道の返事", { selector: ".sw-text" })).toBeInTheDocument();
    fireEvent.click(screen.getByText("寄り道の返事", { selector: ".sw-text" }));
    await flush();
    expect(onComplete).not.toHaveBeenCalled();
    // 寄り道は二度出ない
    expect(screen.queryByRole("button", { name: "相談する" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "検索する" }));
    await flush();
    fireEvent.click(screen.getByText("検索する", { selector: ".sw-text" }));
    await flush();
    expect(onComplete).toHaveBeenCalledWith(detour, ["ask", "go"]);
  });

  it("フラグで文章を出し分け、渡したフラグに合わせて読む（#244）", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "requestAnimationFrame", "setInterval"] });
    const scene: Beat = {
      id: "test-conditional",
      chapter: 1,
      when: [],
      script: [
        think("写真を見た人向け", "ryo", { when: ["foundBff"] }),
        think("写真を見ていない人向け", "ryo", { unless: ["foundBff"] }),
      ],
    };
    const renderScene = (flags: FlagId[]) =>
      render(
        <ScenePlayer
          beat={scene}
          settings={settings}
          flags={flags}
          onSettingsChange={vi.fn()}
          onComplete={vi.fn()}
          onFlag={vi.fn()}
          onMinimize={vi.fn()}
          onOpenLog={vi.fn()}
          rememberPosition={false}
        />,
      );
    const unseen = renderScene([]);
    await flush();
    expect(
      screen.getByText("写真を見ていない人向け", { selector: ".sw-text" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("写真を見た人向け")).toBeNull();
    unseen.unmount();
    renderScene(["foundBff"]);
    await flush();
    expect(screen.getByText("写真を見た人向け", { selector: ".sw-text" })).toBeInTheDocument();
    expect(screen.queryByText("写真を見ていない人向け")).toBeNull();
  });
});
