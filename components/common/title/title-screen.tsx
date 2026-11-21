"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useStory } from "@/components/common/story/story-provider";
import { dmListPath } from "@/lib/platform/app-prefix";
import { nextBeat, PLACES, setFlag } from "@/lib/story";
import type { TitleFeed } from "./feeds";
import { GAME_SUBTITLE, GAME_TITLE, REPOSITORY_URL, STUDIO_NAME } from "./title-text";

/**
 * ゲームの入口。制作のロゴ（Quadrant）をフェードで出してから、タイトル画面にする。
 * 背景は3つの SNS の投稿を縦に流し続け、ぼかして重ねる。
 * 「はじめる」で物語を始め、最初の場面の画面（序章なら Discord の通話）へ移る。
 */
const SPLASH_SEEN_KEY = "hackstage:title-splash-seen:v1";
const SPLASH_MS = 3200;

type Phase = "loading" | "splash" | "title";

export function TitleScreen({ feeds }: { feeds: TitleFeed[] }) {
  const [phase, setPhase] = useState<Phase>("loading");

  // ロゴはタブを開いて最初の1回だけ（タイトルに戻ってきたときは出さない）。
  // 見たことは、ロゴが終わったときに記録する（開発時に effect が2回走っても、ロゴをとばさないように）
  useEffect(() => {
    let seen = false;
    try {
      seen = window.sessionStorage.getItem(SPLASH_SEEN_KEY) === "1";
    } catch {
      // 読めなければ毎回出すだけ
    }
    setPhase(seen ? "title" : "splash");
  }, []);

  const skip = useCallback(() => {
    try {
      window.sessionStorage.setItem(SPLASH_SEEN_KEY, "1");
    } catch {
      // 覚えられなければ、次も出すだけ
    }
    setPhase("title");
  }, []);

  useEffect(() => {
    if (phase !== "splash") return;
    const timer = window.setTimeout(skip, SPLASH_MS);
    const onKey = () => skip();
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [phase, skip]);

  // マウスの位置に合わせて、背景の画面をわずかに動かす（視差）。動きを減らす設定では動かさない
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const { innerWidth, innerHeight } = window;
    event.currentTarget.style.setProperty("--tt-mx", String(event.clientX / innerWidth - 0.5));
    event.currentTarget.style.setProperty("--tt-my", String(event.clientY / innerHeight - 0.5));
  };

  return (
    <div className="tt-screen" onPointerMove={onPointerMove}>
      <FeedBackground feeds={feeds} />
      <div className="tt-veil" aria-hidden="true" />
      {phase === "title" ? <TitleContent /> : null}
      {phase === "splash" ? (
        <button type="button" className="tt-splash" onClick={skip} aria-label="ロゴをとばす">
          <span className="tt-splash-name">{STUDIO_NAME}</span>
        </button>
      ) : null}
      {phase === "loading" ? <div className="tt-splash" aria-hidden="true" /> : null}
    </div>
  );
}

/** 3つの SNS を横に並べ、それぞれ縦に流し続ける（同じ列を2回並べて、つなぎ目なく回す） */
function FeedBackground({ feeds }: { feeds: TitleFeed[] }) {
  return (
    <div className="tt-feeds" aria-hidden="true">
      {feeds.map((feed) => (
        <div key={feed.platform} className="tt-feed" data-platform={feed.platform}>
          <div className="tt-feed-head">{feed.label}</div>
          <div className="tt-feed-track">
            {[0, 1].map((copy) => (
              <ul key={copy} className="tt-feed-list">
                {feed.items.map((item) => (
                  <li key={`${copy}-${item.id}`} className="tt-feed-item">
                    <Image
                      className="tt-feed-avatar"
                      src={item.avatar}
                      alt=""
                      width={40}
                      height={40}
                      unoptimized
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="tt-feed-body">
                      <span className="tt-feed-name">{item.name}</span>
                      <span className="tt-feed-text">{item.text}</span>
                    </span>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TitleContent() {
  const router = useRouter();
  const { state, upcoming, ready, setFlag: raise, reset } = useStory();
  const started = state.flags.includes("started");

  /** 場面の起きる画面へ（無ければ Discord） */
  const go = (beat: ReturnType<typeof nextBeat>) => {
    router.push(beat?.place ? PLACES[beat.place].href : dmListPath());
  };

  const start = () => {
    if (!started) raise("started");
    go(nextBeat(setFlag(state, "started")));
  };

  const restart = () => {
    if (!window.confirm("最初からはじめますか？ いまの進み具合は消えます。")) return;
    reset();
    raise("started");
    go(nextBeat(setFlag({ flags: [], completed: [], choices: {} }, "started")));
  };

  const typed = useTyping(GAME_TITLE);
  const done = typed >= [...GAME_TITLE].length;

  return (
    <main className="tt-content" data-typed={done || undefined}>
      {/* 連絡が途絶えた相手の、最後のオンライン（物語の導入をさりげなく見せる） */}
      <p className="tt-presence" aria-hidden="true">
        <span className="tt-presence-dot" />
        <span className="tt-presence-name">MaiMai</span>
        <span className="tt-presence-sep">・</span>
        <span>最終オンライン 3日前</span>
      </p>

      <h1 className="tt-title" aria-label={GAME_TITLE}>
        {/* 打ち終わったときの幅を先に取っておき、打っているあいだ文字が左右に動かないようにする */}
        <span className="tt-title-ghost" aria-hidden="true">
          {GAME_TITLE}
        </span>
        <span className="tt-title-typed" aria-hidden="true">
          {[...GAME_TITLE].slice(0, typed).join("")}
          <span className="tt-caret" />
        </span>
      </h1>
      <p className="tt-subtitle">{GAME_SUBTITLE}</p>
      <div className="tt-actions">
        <button
          type="button"
          className="tt-start"
          onClick={started ? () => go(upcoming) : start}
          disabled={!ready}
        >
          <span>{started ? "つづきから" : "はじめる"}</span>
          <span className="tt-start-arrow" aria-hidden="true">
            →
          </span>
        </button>
        {started ? (
          <button type="button" className="tt-restart" onClick={restart}>
            はじめから
          </button>
        ) : null}
      </div>
      <footer className="tt-footer">
        <span className="tt-credit">© 2026 {STUDIO_NAME}</span>
        <a className="tt-github" href={REPOSITORY_URL} target="_blank" rel="noopener noreferrer">
          <GitHubMark />
          <span>GitHub</span>
        </a>
      </footer>
    </main>
  );
}

/** タイトルを、チャットに打ち込むように1文字ずつ出す（動きを減らす設定では一度に出す） */
function useTyping(text: string): number {
  const length = [...text].length;
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCount(length);
      return;
    }
    let current = 0;
    const timer = window.setInterval(() => {
      current += 1;
      setCount(current);
      if (current >= length) window.clearInterval(timer);
    }, 170);
    return () => window.clearInterval(timer);
  }, [length]);
  return count;
}

function GitHubMark() {
  return (
    <svg viewBox="0 0 16 16" width="20" height="20" aria-hidden="true" fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}
