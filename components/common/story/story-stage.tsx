"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { type ComponentType, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  type Beat,
  beats,
  CHAPTER_TITLES,
  CHAT_CHANNELS,
  type ChatMessage,
  characters,
  isAtPlace,
  isWithinPlace,
  type Line,
  openedChatIds,
  PLACES,
  unreadChats,
  windowLog,
} from "@/lib/story";
import { usePlaybackSettings } from "./playback-settings";
import { clearScenePreview, loadScenePreview } from "./scene-preview-request";
import type { ScenePlayerProps } from "./stage/scene-player";
import { useStory } from "./story-provider";

/**
 * 場面をゲームの画面に出す土台。ルートレイアウトに置き、どのプラットフォームの上にも重ねる。
 * 場面の中身（背景・立ち絵・文章・動き）は ScenePlayer が流す。
 * 場面に place（起きる画面）があれば、その画面を開いたときに始め、開いていなければ案内だけ出す。
 * チャットの命令で届いたメッセージは、その画面を開くまで右上に知らせを出す（軽い誘導。画面は勝手に移さない）。
 */

const SEEN_CHATS_KEY = "hackstage:story-seen-chats:v1";

function loadSeen(): string[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(SEEN_CHATS_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

/** 届いたチャットの知らせ。その画面を開いたら「見た」にする（このブラウザに覚える） */
function useChatNotice(pathname: string, chats: ChatMessage[], ready: boolean) {
  const [seen, setSeen] = useState<string[]>([]);
  useEffect(() => setSeen(loadSeen()), []);
  const unread = useMemo(() => unreadChats(chats, seen, pathname), [chats, seen, pathname]);
  // 開いている画面のメッセージは見たことにする
  useEffect(() => {
    if (!ready) {
      return;
    }
    // 開いている画面（@me と %40me の表記ゆれを含む）のチャットだけを既読にする
    const opened = openedChatIds(chats, seen, pathname);
    if (opened.length === 0) {
      return;
    }
    const next = [...seen, ...opened];
    setSeen(next);
    try {
      window.localStorage.setItem(SEEN_CHATS_KEY, JSON.stringify(next));
    } catch {
      // 覚えられなくても、知らせが出続けるだけ
    }
  }, [chats, seen, pathname, ready]);
  return unread;
}

/**
 * 出し方の部品。場面の presenter ごとに切り替える。
 * Discord の DM に流すなどの出し方を足すときは、Beat["presenter"] に名前を足し、ここに部品を登録する。
 */
/**
 * 場面を流す部品は、場面があるときだけ読み込む（動きのライブラリ motion を、場面の無いページの共通の読み込みに載せない）。
 */
const ScenePlayer = dynamic(
  () => import("./stage/scene-player").then((module) => module.ScenePlayer),
  {
    ssr: false,
  },
);

const PRESENTERS: Record<NonNullable<Beat["presenter"]>, ComponentType<ScenePlayerProps>> = {
  stage: ScenePlayer,
};

/** 窓を出さない画面（開発用の進行チェックは自前で台本を流す） */
const HIDDEN_PREFIXES = ["/story"];

/**
 * 窓・タブが出ているあいだ、その高さぶんだけ各プラットフォームの画面を縮める。
 * 各画面の外枠は `height: var(--story-viewport, 100dvh)`（app/globals.css）で、
 * `--story-dock-height` を更新して上部のブラウザバーと両立させる。
 */
function useReserveViewport(dock: HTMLElement | null) {
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (!dock) {
      root.style.setProperty("--story-dock-height", "0px");
      return;
    }
    const apply = () => {
      root.style.setProperty("--story-dock-height", `${dock.offsetHeight}px`);
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(dock);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--story-dock-height");
    };
  }, [dock]);
}

/** たたんで絵を見ているあいだ、Enter・Space・Esc で文章の窓に戻す */
export function useRestoreKeys(active: boolean, restore: () => void) {
  const restoreRef = useRef(restore);
  restoreRef.current = restore;
  useEffect(() => {
    if (!active) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " " || event.key === "Escape") {
        event.preventDefault();
        restoreRef.current();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [active]);
}

/** ログ。終わった場面と、いま読んでいる場面の出した行まで */
export function LogPanel({
  onClose,
  current,
}: {
  onClose: () => void;
  current?: { beatId: string; chapter: number; lines: Line[] };
}) {
  const { state } = useStory();
  const log = [...windowLog(state), ...(current && current.lines.length > 0 ? [current] : [])];
  const listRef = useRef<HTMLOListElement>(null);

  // 開いたら、いちばん新しい行（下）を見せる
  useLayoutEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, []);

  // 開いているあいだは、Esc で閉じるだけにする（後ろの場面を Enter などで進めない）
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      } else if (event.key === "Enter" || event.key === " ") {
        event.stopPropagation();
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [onClose]);

  return (
    <section className="sw-log" aria-label="ストーリーのログ">
      <header className="sw-log-head">
        <h2 className="sw-log-title">ログ</h2>
        <button type="button" className="sw-tool" onClick={onClose}>
          閉じる
        </button>
      </header>
      {log.length === 0 ? (
        <p className="sw-log-empty">まだ何も流れていません。</p>
      ) : (
        <ol ref={listRef} className="sw-log-list">
          {log.map((entry) => (
            <li key={entry.beatId} className="sw-log-beat">
              <p className="sw-log-chapter">
                第{entry.chapter}章 {CHAPTER_TITLES[entry.chapter] ?? ""}
              </p>
              {entry.lines.map((line, index) => (
                <p
                  // biome-ignore lint/suspicious/noArrayIndexKey: 台本の行は固定で並び替えない
                  key={index}
                  className="sw-log-line"
                  data-frame={line.frame}
                >
                  {line.from &&
                  line.frame !== "narration" &&
                  line.frame !== "title" &&
                  line.frame !== "system" ? (
                    <span className="sw-log-speaker">
                      {line.frame === "call"
                        ? (characters[line.from].accounts.discordName ?? characters[line.from].name)
                        : characters[line.from].name}
                    </span>
                  ) : null}
                  {line.text}
                </p>
              ))}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function StoryStage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {
    state,
    upcoming,
    completeBeat,
    setFlag,
    ready,
    chats,
    setLiveChats,
    setVoice,
    setCovering,
  } = useStory();
  const unread = useChatNotice(pathname, chats, ready);
  const [settings, setSettings] = usePlaybackSettings();
  const [minimized, setMinimized] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [shownLines, setShownLines] = useState<Line[]>([]);
  // サーバーでは何も描かないので、この部品自身の最初の描画（ハイドレーション）も何も描かない。
  // 進行状態の読み込み（ready）が先に終わっていても、ここで待たないと食い違いのエラーになる
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  // 確認画面の「単体再生」で、この画面の上で流す場面（進行状態は変えない）
  const [previewId, setPreviewId] = useState<string | undefined>();
  // biome-ignore lint/correctness/useExhaustiveDependencies: 画面を移るたびに読み直す
  useEffect(() => setPreviewId(loadScenePreview()), [pathname]);
  const preview = previewId ? beats.find((beat) => beat.id === previewId) : undefined;
  const playing = preview ?? upcoming;
  const endPreview = () => {
    clearScenePreview();
    setPreviewId(undefined);
    setLiveChats([]);
    setVoice([]);
  };
  // 場面が変わったら、ログの「いま読んでいる場面」を空にする（前の場面の行を新しい場面として出さない）
  const upcomingId = playing?.id;
  // biome-ignore lint/correctness/useExhaustiveDependencies: 場面が変わったときだけ空にする
  useEffect(() => {
    setShownLines([]);
    // 通話の様子は、その場面を流しているあいだだけ出す
    setVoice([]);
  }, [upcomingId]);
  // タイトル画面（/）と確認画面では出さない
  const hidden = pathname === "/" || HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const startRequested = searchParams.get("start") === "1";
  useEffect(() => {
    if (!ready || hidden || !startRequested) {
      return;
    }
    if (!state.flags.includes("started")) {
      setFlag("started");
    }
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("start");
    const query = nextParams.toString();
    const nextUrl = `${pathname}${query ? `?${query}` : ""}${window.location.hash}`;
    window.history.replaceState(null, "", nextUrl);
  }, [ready, hidden, startRequested, searchParams, state.flags, setFlag, pathname]);
  const hasLog = state.completed.length > 0;
  // 窓・タブの入れ物（高さを測ってページを縮める）。callback ref で受け取る
  const [dock, setDock] = useState<HTMLDivElement | null>(null);
  // 場面の起きる画面を開いていない（案内だけ出す）
  // 場面がその画面で始まったか（始まったあとは、続けてよい範囲の中なら移っても続ける）
  const [entered, setEntered] = useState<string | undefined>();
  const atPlace = playing?.place ? isAtPlace(pathname, playing.place) : false;
  useEffect(() => {
    if (playing && atPlace) setEntered(playing.id);
  }, [playing, atPlace]);
  const inPlace =
    !playing?.place ||
    atPlace ||
    (entered === playing.id && isWithinPlace(pathname, playing.place));
  const away = playing?.place && !inPlace ? PLACES[playing.place] : undefined;
  // 場面を流している（その画面にいる）。たたんでいても流している
  const inScene = Boolean(playing && !away);
  // 場面を流しているあいだは、後ろの画面は操作できない（読ませる・絵を見せる）。
  // プレイヤーに操作させたいところでは、場面を終えて文章の窓を出さない（docs/story.md）。
  // 探索中は、右下の札のぶんだけ画面を縮めて、画面の下まで使えるようにする
  useReserveViewport(inScene ? null : dock);
  // 後ろの画面を inert にする（StoryPage）。窓が出せないあいだ（読み込み前・隠す画面）は止めない
  const covering =
    inScene && mounted && ready && !hidden && (Boolean(preview) || state.flags.includes("started"));
  useEffect(() => {
    setCovering(covering);
    return () => setCovering(false);
  }, [covering, setCovering]);
  // 探索を挟んだ次の場面は、スキップせずに読み始める。
  useEffect(() => {
    if (!covering && settings.mode === "skip") {
      setSettings({ ...settings, mode: "click" });
    }
  }, [covering, settings, setSettings]);
  // たたんでいるとき（絵を見ている）は、Enter・Space・Esc で文章の窓に戻る
  useRestoreKeys(inScene && minimized, () => setMinimized(false));

  if (!mounted || !ready || hidden || (!preview && !state.flags.includes("started"))) {
    return null;
  }

  const Presenter = playing ? PRESENTERS[playing.presenter ?? "stage"] : undefined;
  const latest = unread.at(-1);
  const showTab = !inScene && (Boolean(away) || hasLog || Boolean(preview));

  return (
    <div className="sw-stage">
      {inScene ? (
        // 後ろの画面の操作を止める幕。たたんでいるときは、押すと文章の窓に戻る
        <div
          className="sw-veil"
          aria-hidden="true"
          data-minimized={minimized ? "true" : undefined}
          onClick={() => setMinimized(false)}
        />
      ) : null}
      {latest ? (
        <Link className="sw-notice" href={PLACES[CHAT_CHANNELS[latest.channel].place].href}>
          <span className="sw-notice-dot" aria-hidden="true" />
          <span className="sw-notice-text">
            <span className="sw-notice-from">
              {characters[latest.from].accounts.discordName ?? characters[latest.from].name}
            </span>{" "}
            から新しいメッセージ{unread.length > 1 ? `（${unread.length} 件）` : ""}
          </span>
        </Link>
      ) : null}
      {logOpen ? (
        <LogPanel
          onClose={() => setLogOpen(false)}
          current={
            playing
              ? { beatId: playing.id, chapter: playing.chapter, lines: shownLines }
              : undefined
          }
        />
      ) : null}
      <div ref={setDock} className="sw-dock">
        {inScene && Presenter && playing ? (
          <Presenter
            key={preview ? `preview:${playing.id}` : playing.id}
            beat={playing}
            settings={settings}
            onSettingsChange={setSettings}
            onComplete={preview ? endPreview : completeBeat}
            flags={preview ? undefined : state.flags}
            onFlag={preview ? () => {} : setFlag}
            label={preview ? "単体再生（進行は変わりません）" : undefined}
            rememberPosition={!preview}
            onMinimize={() => setMinimized(true)}
            minimized={minimized}
            onOpenLog={() => setLogOpen(true)}
            onShownLinesChange={setShownLines}
            onChatsChange={setLiveChats}
            onVoiceChange={setVoice}
          />
        ) : null}
        {showTab ? (
          <div className="sw-tab" role={away ? "status" : undefined}>
            {away ? (
              <Link className="sw-tab-open" href={away.href}>
                <span className="sw-tab-badge">{preview ? "単体再生" : "新しい場面"}</span>
                {away.label} を開く
              </Link>
            ) : null}
            {hasLog ? (
              <button type="button" className="sw-tool" onClick={() => setLogOpen((open) => !open)}>
                ログ
              </button>
            ) : null}
            {preview ? (
              <button type="button" className="sw-tool" onClick={endPreview}>
                単体再生をやめる
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
