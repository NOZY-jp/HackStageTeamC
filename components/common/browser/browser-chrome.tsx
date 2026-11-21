"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  type FormEvent,
  Suspense,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useStory } from "@/components/common/story/story-provider";
import { getBlog, getEntry, getMylist } from "@/lib/blog-like";
import { resolveOmniboxInput, toDisplayUrl } from "@/lib/browser/url-map";
import { getUserByHandle as getTalkupUserByHandle } from "@/lib/facebook-like";
import { getArticle, getCreator } from "@/lib/note-like";
import { APP_PREFIX, dmListPath } from "@/lib/platform/app-prefix";
import { PHOTO_CONTEST_NAME, PHOTO_CONTEST_RESULT_PATH } from "@/lib/seo/contest";
import { unreadChats } from "@/lib/story";
import { getUserByHandle as getTwitterUserByHandle } from "@/lib/twitter-like";
import "./browser.css";

const HIDDEN_PREFIXES = ["/story", "/screens"] as const;
const SEEN_CHATS_KEY = "hackstage:story-seen-chats:v1";
const BROWSER_HISTORY_KEY = "hackstage:browser-history:v1";
const MAX_HISTORY_ITEMS = 24;

export type HistoryEntry = {
  path: string;
  displayUrl: string;
  title: string;
  visitedAt: number;
};

type BookmarkItem = {
  id: string;
  label: string;
  href: string;
  matchPrefix: string;
};

function startsWithPrefix(pathname: string, prefix: string): boolean {
  const clean = prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;
  return pathname === clean || pathname.startsWith(`${clean}/`);
}

function loadSeenChatIds(): string[] {
  try {
    const raw = window.localStorage.getItem(SEEN_CHATS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function loadHistory(): HistoryEntry[] {
  try {
    const raw = window.localStorage.getItem(BROWSER_HISTORY_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is HistoryEntry =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as HistoryEntry).path === "string" &&
        typeof (item as HistoryEntry).displayUrl === "string" &&
        typeof (item as HistoryEntry).title === "string" &&
        typeof (item as HistoryEntry).visitedAt === "number",
    );
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  try {
    window.localStorage.setItem(BROWSER_HISTORY_KEY, JSON.stringify(entries));
  } catch {
    // ストレージに書き込めなくてもブラウザ操作は継続できる
  }
}

/** 探索で発見した個別ページ・プロフィール等を静かに履歴へ記録するための判定。 */
function resolveDiscoveryEntry(pathname: string): Omit<HistoryEntry, "visitedAt"> | null {
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;

  if (clean === PHOTO_CONTEST_RESULT_PATH) {
    return {
      path: clean,
      displayUrl: toDisplayUrl(clean),
      title: `${PHOTO_CONTEST_NAME} 結果`,
    };
  }

  // /pochiblo/...
  if (clean.startsWith("/pochiblo/")) {
    const rest = clean.slice("/pochiblo/".length).split("/").filter(Boolean);
    if (rest[0] === "mylist" && rest[1]) {
      const mylist = getMylist(rest[1]);
      if (!mylist) return null;
      return {
        path: clean,
        displayUrl: toDisplayUrl(clean),
        title: `マイリスト：${mylist.title}`,
      };
    }
    if (rest.length === 3 && rest[1] === "entry") {
      const entry = getEntry(rest[0], rest[2]);
      if (!entry) return null;
      return {
        path: clean,
        displayUrl: toDisplayUrl(clean),
        title: entry.title,
      };
    }
    if (rest.length === 1) {
      const blog = getBlog(rest[0]);
      if (!blog) return null;
      return {
        path: clean,
        displayUrl: toDisplayUrl(clean),
        title: blog.title,
      };
    }
    return null;
  }

  // /note/<creatorId> または /note/<creatorId>/n/<noteId>
  if (clean.startsWith("/note/")) {
    const rest = clean.slice("/note/".length).split("/").filter(Boolean);
    if (rest.length === 0 || rest[0] === "search") {
      return null;
    }
    if (rest.length === 3 && rest[1] === "n") {
      const article = getArticle(rest[0], rest[2]);
      if (!article) return null;
      return {
        path: clean,
        displayUrl: toDisplayUrl(clean),
        title: `${article.title}｜leaf`,
      };
    }
    if (rest.length === 1) {
      const creator = getCreator(rest[0]);
      if (!creator) return null;
      return {
        path: clean,
        displayUrl: toDisplayUrl(clean),
        title: `${creator.displayName}｜leaf`,
      };
    }
    return null;
  }

  // /twitter/profile/<handle>...
  if (clean.startsWith("/twitter/profile/")) {
    const rest = clean.slice("/twitter/profile/".length).split("/").filter(Boolean);
    if (rest.length === 0) return null;
    const user = getTwitterUserByHandle(rest[0]);
    if (!user) return null;
    return {
      path: clean,
      displayUrl: toDisplayUrl(clean),
      title: `${user.displayName} (@${user.handle}) - Twixer`,
    };
  }

  // /talkup/profile/<handle>
  if (clean.startsWith("/talkup/profile/")) {
    const rest = clean.slice("/talkup/profile/".length).split("/").filter(Boolean);
    if (rest.length === 0) return null;
    const user = getTalkupUserByHandle(rest[0]);
    if (!user) return null;
    return {
      path: clean,
      displayUrl: toDisplayUrl(clean),
      title: `${user.displayName} - talkup`,
    };
  }

  return null;
}

function BackIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true">
      <path
        d="M10 3.25L5.25 8 10 12.75"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ForwardIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true">
      <path
        d="M6 3.25L10.75 8 6 12.75"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 5v3.25l2.25 1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BrowserChromeInner() {
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const router = useRouter();
  const { upcoming, chats, covering, ready } = useStory();

  const omniboxId = useId();
  const historyPanelId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const historyWrapRef = useRef<HTMLDivElement>(null);
  const historyBtnRef = useRef<HTMLButtonElement>(null);

  const [headerEl, setHeaderEl] = useState<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [seenChatIds, setSeenChatIds] = useState<string[]>([]);

  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    if (historyOpen) {
      setHistoryOpen(false);
    }
  }

  useEffect(() => {
    setMounted(true);
    setHistory(loadHistory());
    setSeenChatIds(loadSeenChatIds());
  }, []);

  // 他タブや同一セッション内の既読更新に合わせて通知ドットを更新する
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname と chats の変化で localStorage の既読状態を同期する
  useEffect(() => {
    if (!mounted) return;
    setSeenChatIds(loadSeenChatIds());
  }, [mounted, pathname, chats, ready]);

  useEffect(() => {
    if (!mounted) return;
    const onStorage = (event: StorageEvent) => {
      if (event.key === SEEN_CHATS_KEY) {
        setSeenChatIds(loadSeenChatIds());
      } else if (event.key === BROWSER_HISTORY_KEY) {
        setHistory(loadHistory());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [mounted]);

  const hiddenRoute = HIDDEN_PREFIXES.some((prefix) => startsWithPrefix(pathname, prefix));
  const hidden = hiddenRoute || (covering && upcoming?.layout === "fullscreen");

  // --browser-chrome-height を常に最新の実寸と同期する
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (hidden || !headerEl) {
      root.style.setProperty("--browser-chrome-height", "0px");
      return () => {
        root.style.removeProperty("--browser-chrome-height");
      };
    }

    const apply = () => {
      root.style.setProperty("--browser-chrome-height", `${headerEl.offsetHeight}px`);
    };
    apply();

    if (typeof ResizeObserver === "undefined") {
      return () => {
        root.style.removeProperty("--browser-chrome-height");
      };
    }

    const observer = new ResizeObserver(apply);
    observer.observe(headerEl);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--browser-chrome-height");
    };
  }, [hidden, headerEl]);

  const searchString = searchParams?.toString() ?? "";
  const displayUrl = useMemo(() => toDisplayUrl(pathname, searchString), [pathname, searchString]);

  useEffect(() => {
    setEditing(false);
    setDraft(displayUrl);
  }, [displayUrl]);

  // 発見済みページなら静かに履歴へ追加する
  useEffect(() => {
    if (!mounted) return;
    const discovered = resolveDiscoveryEntry(pathname);
    if (!discovered) return;
    setHistory((prev) => {
      const filtered = prev.filter((item) => item.path !== discovered.path);
      const next = [{ ...discovered, visitedAt: Date.now() }, ...filtered].slice(
        0,
        MAX_HISTORY_ITEMS,
      );
      saveHistory(next);
      return next;
    });
  }, [mounted, pathname]);

  // Esc キーまたは領域外クリックで発見履歴パネルを閉じる
  useEffect(() => {
    if (!historyOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setHistoryOpen(false);
        historyBtnRef.current?.focus();
      }
    };

    const onPointerDown = (event: PointerEvent | MouseEvent) => {
      const target = event.target;
      if (
        target instanceof Node &&
        historyWrapRef.current &&
        !historyWrapRef.current.contains(target)
      ) {
        setHistoryOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [historyOpen]);

  const hasUnreadDiscord = useMemo(() => {
    if (!mounted) return false;
    return unreadChats(chats, seenChatIds, pathname).length > 0;
  }, [mounted, chats, seenChatIds, pathname]);

  const bookmarks: BookmarkItem[] = useMemo(
    () => [
      { id: "seek", label: "Seek", href: "/search", matchPrefix: "/search" },
      { id: "discord", label: "Discord", href: dmListPath(), matchPrefix: `/${APP_PREFIX}` },
      { id: "twixer", label: "Twixer", href: "/twitter", matchPrefix: "/twitter" },
      { id: "leaf", label: "leaf", href: "/note", matchPrefix: "/note" },
      { id: "talkup", label: "Talkup", href: "/talkup", matchPrefix: "/talkup" },
    ],
    [],
  );

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const target = resolveOmniboxInput(editing ? draft : displayUrl);
      setEditing(false);
      inputRef.current?.blur();
      router.push(target);
    },
    [displayUrl, draft, editing, router],
  );

  const handleClearHistory = useCallback(() => {
    setHistory([]);
    saveHistory([]);
  }, []);

  if (hidden) {
    return null;
  }

  return (
    <header ref={setHeaderEl} className="bc-bar" inert={covering}>
      <div className="bc-inner">
        <div className="bc-history-nav">
          <button
            type="button"
            className="bc-icon-btn"
            aria-label="戻る"
            onClick={() => router.back()}
          >
            <BackIcon />
          </button>
          <button
            type="button"
            className="bc-icon-btn"
            aria-label="進む"
            onClick={() => router.forward()}
          >
            <ForwardIcon />
          </button>
        </div>

        <form className="bc-omnibox" onSubmit={handleSubmit}>
          <label htmlFor={omniboxId} className="bc-visually-hidden">
            URL または検索キーワード
          </label>
          <input
            ref={inputRef}
            id={omniboxId}
            type="text"
            className="bc-omnibox-input"
            value={editing ? draft : displayUrl}
            placeholder="URL を入力、または Seek で検索"
            enterKeyHint="go"
            autoComplete="off"
            spellCheck={false}
            onFocus={(event) => {
              setDraft(displayUrl);
              setEditing(true);
              event.currentTarget.select();
            }}
            onChange={(event) => {
              setEditing(true);
              setDraft(event.target.value);
            }}
            onBlur={() => {
              setEditing(false);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setEditing(false);
                event.currentTarget.blur();
              }
            }}
          />
        </form>

        <nav className="bc-nav" aria-label="サイトブックマーク">
          <ul className="bc-nav-list">
            {bookmarks.map((item) => {
              const active = startsWithPrefix(pathname, item.matchPrefix);
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className="bc-bookmark"
                    aria-current={active ? "page" : undefined}
                  >
                    <span>{item.label}</span>
                    {item.id === "discord" && hasUnreadDiscord ? (
                      <>
                        <span className="bc-unread-dot" aria-hidden="true" />
                        <span className="bc-visually-hidden">（未読メッセージあり）</span>
                      </>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div ref={historyWrapRef} className="bc-history-wrap">
          <button
            ref={historyBtnRef}
            type="button"
            className="bc-history-btn"
            aria-expanded={historyOpen}
            aria-controls={historyPanelId}
            onClick={() => setHistoryOpen((open) => !open)}
          >
            <HistoryIcon />
            <span>発見履歴</span>
          </button>

          {historyOpen ? (
            <section
              id={historyPanelId}
              className="bc-history-panel"
              aria-label="発見したページの履歴"
            >
              <div className="bc-history-head">
                <h2 className="bc-history-title">発見履歴</h2>
                {mounted && history.length > 0 ? (
                  <button type="button" className="bc-history-clear" onClick={handleClearHistory}>
                    消去
                  </button>
                ) : null}
              </div>
              {!mounted || history.length === 0 ? (
                <p className="bc-history-empty">まだ発見したページはありません。</p>
              ) : (
                <ul className="bc-history-list">
                  {history.map((entry) => (
                    <li key={entry.path}>
                      <Link
                        href={entry.path}
                        className="bc-history-item"
                        onClick={() => setHistoryOpen(false)}
                      >
                        <span className="bc-history-item-title">{entry.title}</span>
                        <span className="bc-history-item-url">{entry.displayUrl}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : null}
        </div>
      </div>
    </header>
  );
}

/**
 * 全プラットフォーム上部に常駐する作中ブラウザツールバー。
 * 戻る/進む、アドレス兼検索バー（Seek）、主要サービスへの移動、発見履歴を提供する。
 */
export function BrowserChrome() {
  return (
    <Suspense fallback={null}>
      <BrowserChromeInner />
    </Suspense>
  );
}
