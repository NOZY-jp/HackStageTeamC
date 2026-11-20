import { describe, expect, it } from "vitest";
import type { Beat } from "../types";
import {
  animate,
  background,
  change,
  clear,
  effect,
  hide,
  move,
  narrate,
  portrait,
  say,
  show,
} from "./cues";
import { applyCue, emptyStage, nextStop, stageAt, textsOf } from "./runner";
import { validateBeat } from "./validate";

const script = [
  background("room-night"),
  show("kai", portrait("kai"), { at: "right" }),
  say("kai", "1"),
  move("kai", { x: 40, y: 90 }),
  change("kai", portrait("kai", "smile")),
  say("kai", "2", { expression: "sad" }),
  effect("tint", { tint: "night" }),
  hide("kai"),
  narrate("3"),
];

describe("舞台の状態", () => {
  it("命令を順に当てると、背景・立ち絵の位置と表情・色が変わる", () => {
    const state = stageAt(script, 7);
    expect(state.background).toBe("room-night");
    expect(state.sprites).toHaveLength(1);
    expect(state.sprites[0]).toMatchObject({
      x: 40,
      y: 90,
      image: { character: "kai", expression: "sad" },
    });
    expect(stageAt(script, 9).sprites).toHaveLength(0);
    expect(stageAt(script, 9).tint).toBeDefined();
  });

  it("位置は名前でも座標でも指定でき、同じ id を出し直すと置き換わる", () => {
    let state = applyCue(emptyStage, show("a", { prop: "smartphone" }, { at: "left" }));
    state = applyCue(state, show("a", { prop: "letter" }, { at: { x: 10, y: 50 } }));
    expect(state.sprites).toEqual([expect.objectContaining({ id: "a", x: 10, y: 50 })]);
    expect(applyCue(state, clear()).sprites).toEqual([]);
  });

  it("暗転は明けるまで続く", () => {
    const dark = applyCue(emptyStage, effect("fade-to-black"));
    expect(dark.blackout).toBe(true);
    expect(applyCue(dark, effect("fade-from-black")).blackout).toBe(false);
  });
});

describe("流し方", () => {
  it("次の文章までの命令をまとめ、文章で止まる", () => {
    expect(nextStop(script, 0)).toEqual({ actions: script.slice(0, 2), textIndex: 2 });
    expect(nextStop(script, 3).textIndex).toBe(5);
    expect(nextStop(script, 9)).toEqual({ actions: [] });
    expect(textsOf(script).map((cue) => cue.text)).toEqual(["1", "2", "3"]);
  });
});

describe("書き間違いの検出", () => {
  const beat = (cues: Beat["script"]): Beat => ({ id: "t", chapter: 0, when: [], script: cues });

  it("正しい場面では何も出ない", () => {
    expect(validateBeat(beat(script))).toEqual([]);
  });

  it("出していない立ち絵を動かす・消す、未登録の背景や動きを見つける", () => {
    const issues = validateBeat(
      beat([
        move("ghost", "left"),
        hide("ghost"),
        // @ts-expect-error 存在しない背景（型でも防げるが、データの読み込みなどで混ざったとき用）
        background("nowhere"),
        // @ts-expect-error 存在しない動きの型
        show("a", portrait("kai"), { enter: "teleport" }),
      ]),
    );
    expect(issues.map((issue) => issue.message)).toEqual([
      "出していない ghost を動かしています",
      "出していない ghost を消しています",
      "背景 nowhere がありません",
      "動きの型 teleport がありません",
    ]);
  });

  it("繰り返し続ける動きに wait を付けると止まるので検出する", () => {
    const issues = validateBeat(
      beat([show("a", portrait("kai")), animate("a", "float", { wait: true }), say("kai", "")]),
    );
    expect(issues.map((issue) => issue.message)).toEqual([
      "繰り返し続ける動きに wait を付けると、場面が止まります（a）",
    ]);
  });

  it("選択肢ごとの続きは別々に検査する（A で出したものを B で動かすのは誤り）", () => {
    const issues = validateBeat({
      ...beat([say("kai", "")]),
      choices: [
        { id: "a", label: "A", reply: [show("x", { prop: "letter" })] },
        { id: "b", label: "B", reply: [hide("x")] },
      ],
    });
    expect(issues.map((issue) => issue.message)).toEqual(["出していない x を消しています"]);
  });
});
