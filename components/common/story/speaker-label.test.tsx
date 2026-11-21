import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { FlagId } from "@/lib/story";
import { DEFAULT_PLAYBACK, say, speakerLabel, think } from "@/lib/story";
import { TextWindow } from "./text-window";

/**
 * #208: 本名は s08-real-name で開示する。開示前は対面も心の声も「琥珀」、
 * 開示後は「リョウ」。通話（Discord）は「琥珀」のまま。
 */

const renderCue = (flags: FlagId[], frame: "talk" | "think" | "call" = "talk") =>
  render(
    <TextWindow
      cue={
        frame === "talk"
          ? say("ryo", "こんにちは")
          : frame === "think"
            ? think("どうしよう")
            : { ...say("ryo", "もしもし"), frame: "call" }
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

describe("対面・心の声の話者ラベル（#208）", () => {
  it("開示前の対面は「琥珀」で、画面に本名が出ない", () => {
    expect(speakerLabel("ryo", { frame: "talk", realNameKnown: false })).toBe("琥珀");
    renderCue([]);
    expect(screen.getByText("琥珀")).toBeInTheDocument();
    expect(document.body.textContent).not.toContain("リョウ");
  });

  it("開示前の心の声も「琥珀」", () => {
    expect(speakerLabel("ryo", { frame: "think", realNameKnown: false })).toBe("琥珀");
    renderCue([], "think");
    expect(screen.getByText("琥珀")).toBeInTheDocument();
    expect(document.body.textContent).not.toContain("リョウ");
  });

  it("開示後は対面・心の声とも「リョウ」", () => {
    expect(speakerLabel("ryo", { frame: "talk", realNameKnown: true })).toBe("リョウ");
    renderCue(["s08-real-name"]);
    expect(screen.getByText("リョウ")).toBeInTheDocument();
  });

  it("通話（Discord）は開示前も開示後も「琥珀」", () => {
    expect(speakerLabel("ryo", { frame: "call", realNameKnown: false })).toBe("琥珀");
    expect(speakerLabel("ryo", { frame: "call", realNameKnown: true })).toBe("琥珀");
    renderCue([], "call");
    expect(screen.getByText("琥珀")).toBeInTheDocument();
  });
});
