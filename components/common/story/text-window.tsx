"use client";

import {
  type CSSProperties,
  type MouseEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  autoAdvanceMs,
  type Choice,
  characters,
  charIntervalMs,
  type FlagId,
  FRAMES,
  PLAYBACK_MODE_LABELS,
  type PlaybackMode,
  type PlaybackSettings,
  sliceChars,
  speakerLabel,
  TEXT_SPEED_LABELS,
  type TextCue,
  type TextSpeed,
  visibleChars,
} from "@/lib/story";
import { usePrefersReducedMotion } from "./playback-settings";

/**
 * 画面下に固定する文章の窓（ノベルゲーム風・統一の部品）。1行ぶんを文字送りで出す。
 * 枠の種類（対面・通話・心の声・地の文・場面転換・システム）で見た目を変える（.sw-window[data-frame]）。
 * 何行目を出すか・いつ次へ進むかは ScenePlayer が決める。
 */
export type TextWindowProps = {
  /** いま出す行。演出の途中などで行が無いときは undefined */
  cue?: TextCue;
  /** 場面の最後で選ぶ選択肢（出すときだけ渡す） */
  choices?: Choice[];
  /** いま立っているフラグ（本名の開示で話者ラベルを切り替える） */
  flags?: readonly FlagId[];
  /** 演出（動き・カスタム演出）の再生中。次へ進めない */
  busy: boolean;
  /** 場面の最後の行か（「▼ 閉じる」の表示に使う） */
  isLast: boolean;
  settings: PlaybackSettings;
  onSettingsChange: (next: PlaybackSettings) => void;
  onAdvance: () => void;
  onChoose: (choiceId: string) => void;
  onMinimize: () => void;
  onOpenLog: () => void;
  /** 場面の出どころの表示（確認画面などで使う） */
  label?: string;
};

/** 文字の速さ（遅い → 一瞬）。目盛りの数で見せる */
const SPEEDS = Object.keys(TEXT_SPEED_LABELS) as TextSpeed[];

/** ページ側でキー操作を使う要素。ここにフォーカスがあるときは、窓のキー操作をしない */
const PAGE_CONTROLS = [
  "input",
  "textarea",
  "select",
  "button",
  "a",
  "summary",
  "label",
  "[tabindex]:not([tabindex='-1'])",
  "[role='button']",
  "[role='textbox']",
  "[role='link']",
  "[role='tab']",
  "[role='option']",
  "[role='menuitem']",
  "[role='checkbox']",
  "[role='switch']",
  "[role='combobox']",
  "[role='listbox']",
].join(", ");

/** 窓のツールバーのボタンは、押してもフォーカスを取らない（Enter が「次へ」のまま効くように） */
const keepFocus = (event: MouseEvent) => event.preventDefault();

/** ページ側の操作中（入力欄・ボタン・リンクにフォーカス）なら、窓のキー操作をしない */
function isPageControl(target: EventTarget | null, windowElement: HTMLElement | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  if (windowElement?.contains(target)) {
    // 窓の中のボタン・セレクトはそれ自身が Enter / Space を受け取る
    return target.closest("button, select, a") !== null;
  }
  if (target.isContentEditable) {
    return true;
  }
  return target.closest(PAGE_CONTROLS) !== null;
}

function speakerOf(
  cue: TextCue,
  options: { realNameKnown?: boolean } = {},
): { name: string; color: string } | null {
  if (!cue.from || cue.frame === "narration" || cue.frame === "title" || cue.frame === "system") {
    return null;
  }
  const person = characters[cue.from];
  // 通話では Discord の表示名で出す（通話アプリの画面に出る名前）。
  // 対面は、本名を知る前だけ「リョウ（琥珀）」と出す（#208）。
  const name =
    cue.frame === "call"
      ? (person.accounts.discordName ?? person.name)
      : speakerLabel(cue.from, { frame: cue.frame, realNameKnown: options.realNameKnown });
  return { name, color: person.color };
}

export function TextWindow({
  cue,
  choices,
  flags,
  busy,
  isLast,
  settings,
  onSettingsChange,
  onAdvance,
  onChoose,
  onMinimize,
  onOpenLog,
  label,
}: TextWindowProps) {
  const windowRef = useRef<HTMLElement>(null);
  // 窓の高さ（選択肢を、窓より上の空いたところの真ん中に出すため）
  const [windowHeight, setWindowHeight] = useState(0);
  useEffect(() => {
    const element = windowRef.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => setWindowHeight(element.offsetHeight));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const reducedMotion = usePrefersReducedMotion();
  const [chars, setChars] = useState(0);
  const timerRef = useRef<number | null>(null);
  const text = cue?.text ?? "";
  const total = [...text].length;
  const typed = chars >= total;
  const atChoices = Boolean(choices && choices.length > 0);
  const interval = charIntervalMs(settings, reducedMotion);

  const stopTyping = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // 文字送り（行が変わるたびに最初から。描画の前に戻して、前の行の文字数で一瞬出ないようにする）
  useLayoutEffect(() => {
    stopTyping();
    if (!cue) {
      setChars(0);
      return;
    }
    if (interval <= 0) {
      setChars(total);
      return;
    }
    setChars(0);
    const startedAt = performance.now();
    timerRef.current = window.setInterval(() => {
      const count = visibleChars(text, performance.now() - startedAt, interval);
      setChars(count);
      if (count >= total) {
        stopTyping();
      }
    }, interval);
    return stopTyping;
  }, [cue, text, interval, total, stopTyping]);

  const advance = useCallback(() => {
    if (busy || !cue || atChoices) {
      return;
    }
    if (!typed) {
      // 文字送り中なら、まず全文を出す
      stopTyping();
      setChars(total);
      return;
    }
    onAdvance();
  }, [busy, cue, atChoices, typed, total, stopTyping, onAdvance]);

  // オート・スキップ: 全文が出たら待って次へ（選択肢では止まる）
  useEffect(() => {
    if (!cue || !typed || atChoices || busy) {
      return;
    }
    const wait = autoAdvanceMs(settings, text);
    if (wait === null) {
      return;
    }
    const timer = window.setTimeout(onAdvance, wait);
    return () => window.clearTimeout(timer);
  }, [cue, text, typed, atChoices, busy, settings, onAdvance]);

  // 選択肢ではスキップを止める（選ぶのはプレイヤー）
  useEffect(() => {
    if (atChoices && settings.mode === "skip") {
      onSettingsChange({ ...settings, mode: "click" });
    }
  }, [atChoices, settings, onSettingsChange]);

  // キー操作: Enter / Space で次へ、Esc でたたむ（ページの入力・ボタン操作中は奪わない）
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.isComposing || event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }
      if (isPageControl(event.target, windowRef.current)) {
        return;
      }
      // 選択肢は数字キーでも選べる（画面には番号を出さない。上から 1, 2, 3…）
      const picked =
        atChoices && /^[1-9]$/.test(event.key) ? choices?.[Number(event.key) - 1] : undefined;
      if (picked) {
        event.preventDefault();
        onChoose(picked.id);
      } else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        advance();
      } else if (event.key === "Escape") {
        onMinimize();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [advance, onMinimize, atChoices, choices, onChoose]);

  const onBodyClick = (event: MouseEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest("button, select, a")) {
      return;
    }
    advance();
  };

  const speaker = cue
    ? speakerOf(cue, { realNameKnown: Boolean(flags?.includes("s08-real-name")) })
    : null;
  // 読み上げ用の1行（行が変わったときだけ変わる）
  const spoken = cue ? (speaker ? `${speaker.name}：${text}` : text) : "";

  return (
    <section
      ref={windowRef}
      className="sw-window"
      aria-label="ストーリー"
      data-frame={cue?.frame}
      data-todo={cue?.todo ? "true" : undefined}
      data-choosing={atChoices ? "true" : undefined}
      style={
        {
          ...(speaker ? { "--sw-speaker": speaker.color } : {}),
          ...(windowHeight ? { "--sw-window-height": `${windowHeight}px` } : {}),
        } as CSSProperties
      }
    >
      {speaker ? <p className="sw-speaker">{speaker.name}</p> : null}
      {label ? (
        <p className="sw-badges">
          <span className="sw-channel">{label}</span>
        </p>
      ) : null}
      <p className="sr-only" aria-live="polite">
        {spoken}
      </p>
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: キー操作は document の Enter / Space で受ける */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: 本文のどこを押しても次へ進む（ノベルゲームの操作） */}
      <div className="sw-body" onClick={onBodyClick}>
        {/* 文字送りの本文は読み上げない（1文字ずつ伸びるたびに読み直されるため）。読み上げは下の live 領域で行ごとに1回 */}
        <p className="sw-text" aria-hidden="true" title={cue ? FRAMES[cue.frame] : undefined}>
          {cue ? sliceChars(text, chars) : null}
        </p>
        {atChoices ? (
          <fieldset className="sw-choices" aria-label="選択肢">
            {choices?.map((choice) => (
              <button
                key={choice.id}
                type="button"
                className="sw-choice"
                onClick={() => onChoose(choice.id)}
              >
                {choice.label}
              </button>
            ))}
          </fieldset>
        ) : (
          <p className="sw-hint" aria-hidden="true">
            {cue && typed && !busy ? (isLast ? "▼ 閉じる" : "▼") : ""}
          </p>
        )}
      </div>
      <footer className="sw-toolbar">
        <fieldset className="sw-modes" aria-label="進み方">
          {(Object.keys(PLAYBACK_MODE_LABELS) as PlaybackMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              aria-pressed={settings.mode === mode}
              className="sw-mode"
              onMouseDown={keepFocus}
              onClick={() => onSettingsChange({ ...settings, mode })}
            >
              {PLAYBACK_MODE_LABELS[mode]}
            </button>
          ))}
        </fieldset>
        <fieldset className="sw-speed" aria-label="文字の速さ">
          <span className="sw-speed-label">文字</span>
          {SPEEDS.map((speed, level) => (
            <button
              key={speed}
              type="button"
              className="sw-speed-step"
              aria-pressed={settings.speed === speed}
              aria-label={`文字の速さ：${TEXT_SPEED_LABELS[speed]}`}
              title={TEXT_SPEED_LABELS[speed]}
              data-on={level <= SPEEDS.indexOf(settings.speed) ? "true" : undefined}
              style={{ "--step": level } as CSSProperties}
              onMouseDown={keepFocus}
              onClick={() => onSettingsChange({ ...settings, speed })}
            />
          ))}
          <span className="sw-speed-value">{TEXT_SPEED_LABELS[settings.speed]}</span>
        </fieldset>
        <button type="button" className="sw-tool" onMouseDown={keepFocus} onClick={onOpenLog}>
          ログ
        </button>
        <button
          type="button"
          className="sw-tool"
          onMouseDown={keepFocus}
          onClick={onMinimize}
          aria-label="ストーリーをたたむ（Esc）"
        >
          たたむ
        </button>
      </footer>
    </section>
  );
}
