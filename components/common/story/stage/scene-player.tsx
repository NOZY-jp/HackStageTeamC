"use client";

import { AnimatePresence } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  applyCue,
  type Beat,
  type ChatMessage,
  type CustomCueName,
  chatsOf,
  cuesOf,
  emptyStage,
  type FlagId,
  MOTIONS,
  nextStop,
  type PlaybackSettings,
  type StageCue,
  type StageState,
  stageAt,
  type TextCue,
  type TransitionName,
  textsOf,
  toMotion,
  toMs,
  type VoiceRoom,
  voiceAt,
} from "@/lib/story";
import { usePrefersReducedMotion } from "../playback-settings";
import { TextWindow } from "../text-window";
import { CUSTOM_CUE_COMPONENTS } from "./custom-cues";
import { type SpriteMotion, type StageHandle, StageView } from "./stage-view";

/**
 * 1場面を流す（統一の土台）。命令を上から実行し、文章で止まってプレイヤーを待つ。
 * 場面を書く側は命令を並べるだけでよく、スキップ・オート・途中からの再開・ログはここが引き受ける。
 */
export type ScenePlayerProps = {
  beat: Beat;
  settings: PlaybackSettings;
  onSettingsChange: (next: PlaybackSettings) => void;
  onComplete: (beat: Beat, choiceId?: string) => void;
  onFlag: (flag: FlagId) => void;
  onMinimize: () => void;
  onOpenLog: () => void;
  /** たたんでいる（文章の窓だけを隠して、背景・立ち絵などの絵を見せる。再生の位置はそのまま） */
  minimized?: boolean;
  /** これまでに出した文章が変わったとき（ログに「いま読んでいる場面」を出すため） */
  onShownLinesChange?: (lines: TextCue[]) => void;
  /** これまでに流したチャットが変わったとき（各プラットフォームの画面に出すため） */
  onChatsChange?: (chats: ChatMessage[]) => void;
  /** 通話の様子が変わったとき（各プラットフォームの通話の画面に出すため） */
  onVoiceChange?: (rooms: VoiceRoom[]) => void;
  label?: string;
  /** 読んでいる位置を覚えるか（確認画面の単体再生では覚えない） */
  rememberPosition?: boolean;
};

/** 読んでいる位置。進行状態（終わった場面だけを保存）とは別に、タブを閉じるまで覚えておく */
const READING_KEY = "hackstage:story-reading:v2";
type Reading = { beatId: string; index: number; choiceId?: string };

function loadReading(beatId: string): Reading | undefined {
  try {
    const raw = window.sessionStorage.getItem(READING_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<Reading>) : undefined;
    if (parsed?.beatId !== beatId || typeof parsed.index !== "number") {
      return undefined;
    }
    return {
      beatId,
      index: Math.max(0, Math.floor(parsed.index)),
      choiceId: typeof parsed.choiceId === "string" ? parsed.choiceId : undefined,
    };
  } catch {
    return undefined;
  }
}

function saveReading(reading: Reading) {
  try {
    window.sessionStorage.setItem(READING_KEY, JSON.stringify(reading));
  } catch {
    // 覚えられなくても、場面の頭から読み直すだけ
  }
}

const sleep = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));
const nextFrame = () =>
  new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));

type ActiveCustom = {
  key: number;
  name: CustomCueName;
  props: Record<string, unknown>;
  done: () => void;
};

const DEFAULT_EFFECT_MS = { tint: 600, blackout: 800, flash: 350 };

export function ScenePlayer({
  beat,
  settings,
  onSettingsChange,
  onComplete,
  onFlag,
  onMinimize,
  onOpenLog,
  onShownLinesChange,
  onChatsChange,
  onVoiceChange,
  minimized = false,
  label,
  rememberPosition = true,
}: ScenePlayerProps) {
  const reducedMotion = usePrefersReducedMotion();
  // スキップ中・動きを減らす設定なら、動きの時間を 0 にする
  const speed = settings.mode === "skip" || reducedMotion ? 0 : 1;
  const speedRef = useRef(speed);
  speedRef.current = speed;

  const [resume] = useState(() => (rememberPosition ? loadReading(beat.id) : undefined));
  const [choiceId, setChoiceId] = useState<string | undefined>(resume?.choiceId);
  const cues = useMemo(() => cuesOf(beat, choiceId), [beat, choiceId]);
  const [index, setIndex] = useState<number>(-1);
  const [busy, setBusy] = useState(true);
  const [windowVisible, setWindowVisible] = useState(true);
  const [stage, setStage] = useState<StageState>(emptyStage);
  const [backgroundTransition, setBackgroundTransition] = useState<{
    name: TransitionName;
    ms: number;
  }>({ name: "cut", ms: 0 });
  const [effectMs, setEffectMs] = useState({
    tint: DEFAULT_EFFECT_MS.tint,
    blackout: DEFAULT_EFFECT_MS.blackout,
  });
  const [spriteMotions, setSpriteMotions] = useState<Record<string, SpriteMotion>>({});
  const [custom, setCustom] = useState<ActiveCustom | undefined>();
  // チャット・通話の命令をどこまで実行したか（命令の位置。文章で止まる前でも、実行した時点で画面に出す）
  const [reached, setReached] = useState(0);
  const cuesIndexRef = useRef(new Map<object, number>());
  cuesIndexRef.current = new Map(cues.map((cue, position) => [cue, position + 1]));
  const stageRef = useRef<StageHandle>(null);
  const runRef = useRef(0);
  const customKey = useRef(0);

  /** 命令を1つ実行する（動きを待つ命令は終わるまで待つ） */
  const execute = useCallback(
    async (cue: StageCue) => {
      const factor = speedRef.current;
      switch (cue.type) {
        case "background": {
          const ms = toMs(cue.duration, "slow");
          setBackgroundTransition({ name: cue.transition ?? "fade", ms });
          setStage((current) => applyCue(current, cue));
          if (cue.transition !== "cut") await sleep(ms * factor);
          return;
        }
        case "show":
          setSpriteMotions((current) => ({
            ...current,
            // 出し直したときは前の移動時間を引き継がない（その場に出す）
            [cue.id]: { enter: cue.enter ? toMotion(cue.enter) : undefined, moveMs: 0 },
          }));
          setStage((current) => applyCue(current, cue));
          // 直後の animate が対象を見つけられるよう、画面に出るのを待つ
          await nextFrame();
          return;
        case "change":
          setStage((current) => applyCue(current, cue));
          await nextFrame();
          return;
        case "move": {
          const ms = toMs(cue.duration);
          setSpriteMotions((current) => ({
            ...current,
            [cue.id]: { ...current[cue.id], moveMs: ms },
          }));
          setStage((current) => applyCue(current, cue));
          if (cue.wait) await sleep(ms * factor);
          else await nextFrame();
          return;
        }
        case "animate": {
          const spec = toMotion(cue.motion);
          const running = stageRef.current?.animate(cue.target, spec, factor);
          // 繰り返し続ける動きは終わらないので、wait が付いていても待たない
          if (cue.wait && spec.repeat !== Number.POSITIVE_INFINITY) await running;
          return;
        }
        case "hide":
          // 消える動きを先に渡してから消す（同じ描画で消すと、消える動きが効かない）
          setSpriteMotions((current) => ({
            ...current,
            [cue.id]: { ...current[cue.id], exit: cue.exit ? toMotion(cue.exit) : undefined },
          }));
          await nextFrame();
          setStage((current) => applyCue(current, cue));
          return;
        case "effect": {
          if (cue.name === "shake") {
            const spec = cue.duration
              ? { ...MOTIONS.shake, duration: cue.duration }
              : MOTIONS.shake;
            const running = stageRef.current?.animate("screen", spec, factor);
            if (cue.wait) await running;
          } else if (cue.name === "flash") {
            const ms = cue.duration === undefined ? DEFAULT_EFFECT_MS.flash : toMs(cue.duration);
            const running = stageRef.current?.flash(ms, factor);
            if (cue.wait) await running;
          } else {
            const isTint = cue.name === "tint" || cue.name === "clear-tint";
            const ms =
              cue.duration === undefined
                ? isTint
                  ? DEFAULT_EFFECT_MS.tint
                  : DEFAULT_EFFECT_MS.blackout
                : toMs(cue.duration);
            setEffectMs((current) =>
              isTint ? { ...current, tint: ms } : { ...current, blackout: ms },
            );
            setStage((current) => applyCue(current, cue));
            if (cue.wait) await sleep(ms * factor);
          }
          return;
        }
        case "wait":
          await sleep(toMs(cue.duration) * factor);
          return;
        case "custom": {
          customKey.current += 1;
          const key = customKey.current;
          const done = new Promise<void>((resolve) => {
            setCustom({
              key,
              name: cue.name,
              props: cue.props ?? {},
              done: () => {
                // 後から始まった別のカスタム演出は消さない
                setCustom((current) => (current?.key === key ? undefined : current));
                resolve();
              },
            });
          });
          if (cue.wait) await done;
          return;
        }
        case "flag":
          onFlag(cue.flag);
          return;
        case "window":
          setWindowVisible(cue.visible);
          return;
        case "chat":
          // 流したメッセージは onChatsChange で知らせる。ここでは間を取るだけ
          setReached((current) => Math.max(current, cuesIndexRef.current.get(cue) ?? 0));
          if (cue.wait !== undefined) await sleep(toMs(cue.wait) * factor);
          return;
        case "voice":
          // 通話の様子は onVoiceChange で知らせる
          setReached((current) => Math.max(current, cuesIndexRef.current.get(cue) ?? 0));
          return;
        default:
          setStage((current) => applyCue(current, cue));
      }
    },
    [onFlag],
  );

  /** from から次の文章まで命令を実行して、文章で止まる */
  const run = useCallback(
    async (from: number) => {
      runRef.current += 1;
      const runId = runRef.current;
      setBusy(true);
      const { actions, textIndex } = nextStop(cues, from);
      for (const action of actions) {
        if (runRef.current !== runId) return; // 別の場面・選択で流し直した、または閉じた
        await execute(action);
      }
      if (runRef.current !== runId) return;
      if (textIndex !== undefined) {
        // 話している人の表情を、この行で変える。文章が来たら窓は出す
        setStage((current) => applyCue(current, cues[textIndex]));
        setWindowVisible(true);
      }
      setIndex(textIndex ?? cues.length);
      setBusy(false);
    },
    [cues, execute],
  );

  // 始め方: 覚えていた位置があれば、そこまでの舞台を一度に組み立てて続きから。
  // マウントのときだけ動かす（選択肢で cues が変わっても始め直さない）。閉じたら（たたむ・別の場面へ・
  // 開発時の StrictMode の付け直し）流している途中の命令を止める。付け直しのときはここからもう一度始まる
  const runLatest = useRef(run);
  runLatest.current = run;
  const cuesAtMount = useRef(cues);
  useEffect(() => {
    const initialCues = cuesAtMount.current;
    const start = runLatest.current;
    if (!resume) {
      void start(0);
    } else if (resume.index >= initialCues.length) {
      // 選択肢を出していたところ（命令は全部済み）
      setStage(stageAt(initialCues, initialCues.length));
      setIndex(initialCues.length);
      setBusy(false);
    } else if (initialCues[resume.index]?.type === "text") {
      setStage(stageAt(initialCues, resume.index + 1));
      setIndex(resume.index);
      setBusy(false);
    } else {
      setStage(stageAt(initialCues, resume.index));
      void start(resume.index);
    }
    return () => {
      runRef.current += 1;
    };
  }, [resume]);

  // 選択肢を選んだら、そのセリフ（台本の続き）から流す
  const pendingChoice = useRef(false);
  useEffect(() => {
    if (pendingChoice.current) {
      pendingChoice.current = false;
      void run(beat.script.length);
    }
  }, [run, beat.script.length]);

  useEffect(() => {
    if (rememberPosition && index >= 0) {
      saveReading({ beatId: beat.id, index, choiceId });
    }
  }, [rememberPosition, beat.id, index, choiceId]);

  // 各プラットフォームの画面用: これまでに流したチャットと、いまの通話の様子
  const done = Math.max(reached, index >= 0 ? Math.min(index, cues.length) : 0);
  useEffect(() => {
    onChatsChange?.(chatsOf(beat.id, cues, done));
  }, [beat.id, cues, done, onChatsChange]);
  useEffect(() => {
    onVoiceChange?.(voiceAt(cues, done, index >= 0 ? cues[index] : undefined));
  }, [cues, done, index, onVoiceChange]);

  // ログ用: これまでに出した文章
  useEffect(() => {
    if (index >= 0) {
      onShownLinesChange?.(textsOf(cues.slice(0, Math.min(index + 1, cues.length))));
    }
  }, [cues, index, onShownLinesChange]);

  // 場面を流し終えたら、選択肢を出すか、場面を終える
  const finished = !busy && index >= cues.length && !custom;
  const needsChoice = finished && (beat.choices?.length ?? 0) > 0 && choiceId === undefined;
  useEffect(() => {
    if (finished && !needsChoice) {
      onComplete(beat, choiceId);
    }
  }, [finished, needsChoice, onComplete, beat, choiceId]);

  const currentCue = index >= 0 && index < cues.length ? cues[index] : undefined;
  const current = currentCue?.type === "text" ? currentCue : undefined;
  // 最後に出した文章（選択肢を出しているあいだも窓に残す）
  const lastText = useMemo(() => {
    for (let i = Math.min(index, cues.length - 1); i >= 0; i -= 1) {
      const cue = cues[i];
      if (cue.type === "text") return cue;
    }
    return undefined;
  }, [cues, index]);

  const advance = useCallback(() => {
    if (!busy && current) void run(index + 1);
  }, [busy, current, index, run]);

  const choose = (id: string) => {
    pendingChoice.current = true;
    setChoiceId(id);
  };

  const noMoreText = nextStop(cues, index + 1).textIndex === undefined;
  const isLast = noMoreText && (!beat.choices?.length || choiceId !== undefined);
  const CustomComponent = custom ? CUSTOM_CUE_COMPONENTS[custom.name] : undefined;
  const shownCue = needsChoice ? lastText : current;

  return (
    <>
      {/* 舞台は常に出しておく（重ねる場面では透明）。たたんでも出したまま（絵を見るため） */}
      <StageView
        ref={stageRef}
        stage={stage}
        backgroundTransition={backgroundTransition}
        spriteMotions={spriteMotions}
        speed={speed}
        fullscreen={beat.layout === "fullscreen"}
        speaker={shownCue?.from}
        effectMs={effectMs}
      >
        <AnimatePresence>
          {custom && CustomComponent ? (
            <CustomComponent
              key={custom.key}
              props={custom.props}
              onDone={custom.done}
              instant={speed === 0}
            />
          ) : null}
        </AnimatePresence>
      </StageView>
      {!minimized && (windowVisible || needsChoice) ? (
        <TextWindow
          cue={shownCue}
          choices={needsChoice ? beat.choices : undefined}
          busy={busy || Boolean(custom)}
          isLast={isLast}
          settings={settings}
          onSettingsChange={onSettingsChange}
          onAdvance={advance}
          onChoose={choose}
          onMinimize={onMinimize}
          onOpenLog={onOpenLog}
          label={label}
        />
      ) : null}
    </>
  );
}
