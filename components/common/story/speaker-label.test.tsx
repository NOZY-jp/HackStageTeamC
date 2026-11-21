import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { FlagId } from "@/lib/story";
import { DEFAULT_PLAYBACK, say, speakerLabel } from "@/lib/story";
import { TextWindow } from "./text-window";

/**
 * #208: 初出の対面だけ「リョウ（琥珀）」、本名開示後は「リョウ」。
 * 通話（Discord）は「琥珀」のまま。切替は話者ラベルの1か所だけ。
 */

const renderCue = (flags: FlagId[], frame: "talk" | "call" = "talk") =>
  render(
    <TextWindow
      cue={
        frame === "talk" ? say("ryo", "こんにちは") : { ...say("ryo", "もしもし"), frame: "call" }
      }
      flags={flags}
      busy={false}
      isLast={false}
      settings={DEFAULT_PLAYBACK}
      onSettingsChange={() => {}}
      onAdvance={() => {}}
      onChoose={() => {}}
      onMinimize={() => {}}
      onOpenLog={() => {}}
    />,
  );

describe("対面の話者ラベル（#208）", () => {
  it("本名を知る前は「リョウ（琥珀）」", () => {
    expect(speakerLabel("ryo", { frame: "talk", realNameKnown: false })).toBe("リョウ（琥珀）");
    renderCue([]);
    expect(screen.getByText("リョウ（琥珀）")).toBeInTheDocument();
  });

  it("心の声は開示前でも「リョウ」（対面だけが対象）", () => {
    expect(speakerLabel("ryo", { frame: "think", realNameKnown: false })).toBe("リョウ");
  });

  it("本名の開示後は「リョウ」", () => {
    expect(speakerLabel("ryo", { frame: "talk", realNameKnown: true })).toBe("リョウ");
    renderCue(["s08-real-name"]);
    expect(screen.getByText("リョウ")).toBeInTheDocument();
  });

  it("通話（Discord）は「琥珀」のまま", () => {
    renderCue([], "call");
    expect(screen.getByText("琥珀")).toBeInTheDocument();
  });
});
