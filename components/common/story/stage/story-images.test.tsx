import { existsSync } from "node:fs";
import { join } from "node:path";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BACKGROUNDS, look } from "@/lib/story";
import { chapter5 } from "@/lib/story/scenario/ch05-fragments";
import { BackgroundImage } from "./asset-image";
import { CUSTOM_CUE_COMPONENTS } from "./custom-cues";

describe("場面の絵", () => {
  it("一覧に書いた背景の画像ファイルが public にある", () => {
    for (const [id, asset] of Object.entries(BACKGROUNDS)) {
      const src: string | undefined = "src" in asset ? asset.src : undefined;
      if (src) {
        expect(existsSync(join(process.cwd(), "public", src)), `${id}: ${src}`).toBe(true);
      }
    }
  });

  it("暗転は、仮の板の名前を出さずに黒で塗る", () => {
    const { container } = render(<BackgroundImage background="black" />);
    expect(container.textContent).toBe("");
    expect((container.firstChild as HTMLElement).style.backgroundColor).toBe("rgb(0, 0, 0)");
  });

  it("画像のある背景は画像で出す", () => {
    const { container } = render(<BackgroundImage background="station" />);
    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "/story/backgrounds/station-arrival.webp",
    );
  });
});

describe("look（絵を見せて、押すまで待つ）", () => {
  const Look = CUSTOM_CUE_COMPONENTS.look;

  it("文章の窓を隠してから、押すまで待つ演出を出す", () => {
    expect(look()).toEqual([
      { type: "window", visible: false },
      { type: "custom", name: "look", props: undefined, wait: true },
    ]);
  });

  it("第5章のマップ散策では、背景を差し替えずに2枚の写真を表示する", () => {
    const script = chapter5.find((beat) => beat.id === "ch5-talkup")?.script ?? [];
    expect(script.some((cue) => cue.type === "background")).toBe(false);
    const photos = script
      .filter((cue) => cue.type === "custom")
      .filter((cue) => cue.name === "look");
    expect(photos).toHaveLength(2);
    for (const [index, label] of ["地元の洋菓子店", "マンホールのある住宅街"].entries()) {
      const cue = photos[index];
      expect(cue.wait).toBe(true);
      const view = render(<Look props={cue.props ?? {}} onDone={vi.fn()} instant={false} />);
      const image = screen.getByAltText(label);
      const src = image.getAttribute("src") ?? "";
      expect(src).toMatch(/^\/story\/.*\.webp$/);
      expect(existsSync(join(process.cwd(), "public", src))).toBe(true);
      view.unmount();
    }
  });

  it("押すと次へ進む", () => {
    const onDone = vi.fn();
    render(<Look props={{}} onDone={onDone} instant={false} />);
    expect(onDone).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "続ける" }));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("Enter でも次へ進む（送ったキーですぐ閉じないよう、少し待ってから受け付ける）", () => {
    vi.useFakeTimers();
    try {
      const onDone = vi.fn();
      render(<Look props={{}} onDone={onDone} instant={false} />);
      fireEvent.keyDown(window, { key: "Enter" });
      expect(onDone).not.toHaveBeenCalled();
      vi.advanceTimersByTime(300);
      fireEvent.keyDown(window, { key: "Enter" });
      expect(onDone).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("スキップ中は待たない", () => {
    const onDone = vi.fn();
    render(<Look props={{}} onDone={onDone} instant />);
    expect(onDone).toHaveBeenCalled();
  });
});
