import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { type Choice, type PlaybackSettings, say, think } from "@/lib/story";
import { TextWindow, type TextWindowProps } from "./text-window";

const instant: PlaybackSettings = { mode: "click", speed: "instant" };

function renderWindow(props: Partial<TextWindowProps> = {}) {
  const onAdvance = vi.fn();
  const onChoose = vi.fn();
  render(
    <>
      <input aria-label="ページの入力欄" />
      <TextWindow
        cue={say("kai", "一行目")}
        busy={false}
        isLast={false}
        settings={instant}
        onSettingsChange={vi.fn()}
        onAdvance={onAdvance}
        onChoose={onChoose}
        onMinimize={vi.fn()}
        onOpenLog={vi.fn()}
        {...props}
      />
    </>,
  );
  return { onAdvance, onChoose };
}

describe("TextWindow", () => {
  it("話す人の名前と文を出し、枠の種類を data-frame で持つ", () => {
    renderWindow();
    expect(screen.getByText("カイ")).toBeInTheDocument();
    expect(screen.getByText("一行目")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "ストーリー" })).toHaveAttribute(
      "data-frame",
      "talk",
    );
  });

  it("心の声の枠でも名前を出す（地の文は出さない）", () => {
    renderWindow({ cue: think("考えごと") });
    expect(screen.getByRole("region", { name: "ストーリー" })).toHaveAttribute(
      "data-frame",
      "think",
    );
    // 開示前はプレイヤーが知っている名前（琥珀）で出す（#208）
    expect(screen.getByText("琥珀")).toBeInTheDocument();
  });

  it("本文のクリックと Enter で次へ進む", () => {
    const { onAdvance } = renderWindow();
    fireEvent.click(screen.getByText("一行目"));
    fireEvent.keyDown(document.body, { key: "Enter" });
    expect(onAdvance).toHaveBeenCalledTimes(2);
  });

  it("ページの入力欄で Enter を押しても進まない", () => {
    const { onAdvance } = renderWindow();
    fireEvent.keyDown(screen.getByLabelText("ページの入力欄"), { key: "Enter" });
    expect(onAdvance).not.toHaveBeenCalled();
  });

  it("演出の再生中は進まない", () => {
    const { onAdvance } = renderWindow({ busy: true });
    fireEvent.click(screen.getByText("一行目"));
    expect(onAdvance).not.toHaveBeenCalled();
  });

  it("選択肢を出しているあいだは進まず、選ぶと onChoose が呼ばれる", () => {
    const choices: Choice[] = [
      { id: "a", label: "聞く" },
      { id: "b", label: "やめる" },
    ];
    const { onAdvance, onChoose } = renderWindow({ choices });
    fireEvent.click(screen.getByText("一行目"));
    expect(onAdvance).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "聞く" }));
    expect(onChoose).toHaveBeenCalledWith("a");
  });

  it("選択肢は数字キーでも選べる", () => {
    const choices: Choice[] = [
      { id: "a", label: "聞く" },
      { id: "b", label: "やめる" },
    ];
    const { onChoose } = renderWindow({ choices });
    fireEvent.keyDown(document.body, { key: "2" });
    expect(onChoose).toHaveBeenCalledWith("b");
    fireEvent.keyDown(document.body, { key: "9" });
    expect(onChoose).toHaveBeenCalledTimes(1);
  });

  it("読み上げは行ごとに1回（文字送りの本文は読み上げない）", () => {
    renderWindow();
    expect(screen.getByText("一行目")).toHaveAttribute("aria-hidden", "true");
    const live = screen.getByText("カイ：一行目");
    expect(live).toHaveAttribute("aria-live", "polite");
  });
});
