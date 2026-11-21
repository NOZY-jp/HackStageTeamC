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
import { useVisitedSites } from "@/components/common/story/site-bookmarks";
import { useOptionalStory } from "@/components/common/story/story-provider";
import { resolveOmniboxInput, toDisplayUrl } from "@/lib/browser/url-map";
import { PHOTO_CONTEST_NAME, PHOTO_CONTEST_RESULT_PATH } from "@/lib/seo/contest";
import { SITES, siteAt, unlockedSites, unreadChats } from "@/lib/story";
import "./browser.css";

const HIDDEN_PREFIXES = ["/story", "/screens"] as const;
const SEEN_CHATS_KEY = "hackstage:story-seen-chats:v1";
const BROWSER_HISTORY_KEY = "hackstage:browser-history:v1";
const MAX_HISTORY_ITEMS = 24;

const GENERIC_PAGE_TITLES = new Set([
  "",
  "HackStage",
  "Seek 検索",
  "Twixer",
  "talkup",
  "leaf",
  "ぽちブロ",
]);
const NOT_FOUND_TITLE_RE = /(?:404|not found|見つかりません)/i;

export type HistoryEntry = {
  path: string;
  displayUrl: string;
  title: string;
  visitedAt: number;
};

type DiscoveryTarget = {
  path: string;
  displayUrl: string;
  fallbackTitle: string;
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

function normalizeDocumentTitle(rawTitle: string): string | null {
  const stripped = rawTitle.replace(/\s*\|\s*HackStage$/, "").trim();
  if (GENERIC_PAGE_TITLES.has(stripped)) {
    return null;
  }
  return stripped;
}

/**
 * URL パターンだけで探索発見ページかどうかを判定する（クライアントバンドルに各 SNS のデータを混ぜない）。
 * タイトルは document.title 優先とし、更新前や未設定時は非ネタバレのパス由来フォールバックを使う。
 */
function resolveDiscoveryTarget(pathname: string): DiscoveryTarget | null {
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;

  if (clean === PHOTO_CONTEST_RESULT_PATH) {
    return {
      path: clean,
      displayUrl: toDisplayUrl(clean),
      fallbackTitle: `${PHOTO_CONTEST_NAME} 結果`,
    };
  }

  if (clean.startsWith("/pochiblo/")) {
    const rest = clean.slice("/pochiblo/".length).split("/").filter(Boolean);
    if (rest[0] === "mylist" && rest.length === 2) {
      return {
        path: clean,
        displayUrl: toDisplayUrl(clean),
        fallbackTitle: "マイリスト - ぽちブロ",
      };
    }
    if (rest.length === 3 && rest[1] === "entry") {
      return {
        path: clean,
        displayUrl: toDisplayUrl(clean),
        fallbackTitle: toDisplayUrl(clean),
      };
    }
    if (rest.length === 1) {
      return {
        path: clean,
        displayUrl: toDisplayUrl(clean),
        fallbackTitle: `${rest[0]} - ぽちブロ`,
      };
    }
    return null;
  }

  if (clean.startsWith("/note/")) {
    const rest = clean.slice("/note/".length).split("/").filter(Boolean);
    if (rest.length === 0 || rest[0] === "search") {
      return null;
    }
    if (rest.length === 3 && rest[1] === "n") {
      return {
        path: clean,
        displayUrl: toDisplayUrl(clean),
        fallbackTitle: `${rest[0]} の記事｜leaf`,
      };
    }
    if (rest.length === 1) {
      return {
        path: clean,
        displayUrl: toDisplayUrl(clean),
        fallbackTitle: `${rest[0]}｜leaf`,
      };
    }
    return null;
  }

  if (clean.startsWith("/twitter/profile/")) {
    const rest = clean.slice("/twitter/profile/".length).split("/").filter(Boolean);
    if (
      rest.length === 1 ||
      (rest.length === 2 && ["likes", "media", "with_replies"].includes(rest[1]))
    ) {
      return {
        path: clean,
        displayUrl: toDisplayUrl(clean),
        fallbackTitle: `@${rest[0]} - Twixer`,
      };
    }
    return null;
  }

  if (clean.startsWith("/talkup/profile/")) {
    const rest = clean.slice("/talkup/profile/".length).split("/").filter(Boolean);
    if (rest.length === 1) {
      return {
        path: clean,
        displayUrl: toDisplayUrl(clean),
        fallbackTitle: `@${rest[0]} - talkup`,
      };
    }
    return null;
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
  const story = useOptionalStory();
  const upcoming = story?.upcoming;
  const chats = story?.chats ?? [];
  const covering = story?.covering ?? false;
  const ready = story?.ready ?? false;

  const omniboxId = useId();
  const historyPanelId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const historyWrapRef = useRef<HTMLDivElement>(null);
  const historyBtnRef = useRef<HTMLButtonElement>(null);
  const lastRecordedPathRef = useRef<string | null>(null);
  const staleRawTitleRef = useRef<string>("");

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

  // タイトル画面（/）は全画面で見せるので、ツールバーを出さない
  const hiddenRoute =
    pathname === "/" || HIDDEN_PREFIXES.some((prefix) => startsWithPrefix(pathname, prefix));
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

  // 発見済みページなら静かに履歴へ追加し、Next.js の非同期 <title> 更新も追従する
  useEffect(() => {
    if (!mounted) return;

    const previousPath = lastRecordedPathRef.current;
    const pathChanged = previousPath !== null && previousPath !== pathname;
    const previousRawTitle = pathChanged ? staleRawTitleRef.current : "";
    lastRecordedPathRef.current = pathname;

    const target = resolveDiscoveryTarget(pathname);
    if (!target) {
      staleRawTitleRef.current = document.title;
      return;
    }

    const resolveTitleFromDocument = (): { title: string; isNotFound: boolean } => {
      const currentRaw = document.title;
      if (pathChanged && currentRaw === previousRawTitle) {
        return { title: target.fallbackTitle, isNotFound: false };
      }
      if (NOT_FOUND_TITLE_RE.test(currentRaw)) {
        return { title: target.fallbackTitle, isNotFound: true };
      }
      return {
        title: normalizeDocumentTitle(currentRaw) ?? target.fallbackTitle,
        isNotFound: false,
      };
    };

    const upsert = (title: string) => {
      setHistory((prev) => {
        const filtered = prev.filter((item) => item.path !== target.path);
        const next = [
          { path: target.path, displayUrl: target.displayUrl, title, visitedAt: Date.now() },
          ...filtered,
        ].slice(0, MAX_HISTORY_ITEMS);
        saveHistory(next);
        return next;
      });
    };

    const removeTarget = () => {
      setHistory((prev) => {
        if (!prev.some((item) => item.path === target.path)) return prev;
        const next = prev.filter((item) => item.path !== target.path);
        saveHistory(next);
        return next;
      });
    };

    const initial = resolveTitleFromDocument();
    if (initial.isNotFound) {
      removeTarget();
      staleRawTitleRef.current = document.title;
      return;
    }

    upsert(initial.title);
    staleRawTitleRef.current = document.title;

    if (typeof MutationObserver === "undefined" || !document.head) {
      return;
    }

    const observer = new MutationObserver(() => {
      const nextRaw = document.title;
      if (nextRaw === previousRawTitle) {
        return;
      }
      staleRawTitleRef.current = nextRaw;
      if (NOT_FOUND_TITLE_RE.test(nextRaw)) {
        removeTarget();
        return;
      }
      const normalized = normalizeDocumentTitle(nextRaw);
      if (normalized) {
        upsert(normalized);
      }
    });
    observer.observe(document.head, { subtree: true, childList: true, characterData: true });
    return () => observer.disconnect();
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

  const activeSite = siteAt(pathname);
  const visited = useVisitedSites(activeSite);
  // 保存済みの進行は、サーバーと同じ初期表示を描いたあとで反映する。
  const bookmarks = unlockedSites(
    mounted && ready ? (story?.state.flags ?? []) : [],
    mounted ? visited : [],
  ).filter((id) => id !== "oldBlog");

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
            {bookmarks.map((id) => {
              const item = SITES[id];
              return (
                <li key={id}>
                  <Link
                    href={item.href}
                    className="bc-bookmark"
                    aria-current={id === activeSite ? "page" : undefined}
                  >
                    <span>{item.label}</span>
                    {id === "discord" && hasUnreadDiscord ? (
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
