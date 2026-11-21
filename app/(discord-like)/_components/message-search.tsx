"use client";

import Link from "next/link";
import {
  type KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { searchMessages } from "@/app/(discord-like)/_actions/message-search";
import { useOptionalStory } from "@/components/common/story/story-provider";
import type { MatchedUser, SearchHit, SearchResponse } from "@/lib/discord-like/search";
import {
  parseQuery,
  type SearchOrder,
  type SearchParseError,
} from "@/lib/discord-like/search-query";
import { BLOG_TALK_MESSAGE_ID, KAI_NICKNAME_ADVICE_MESSAGE_ID } from "@/lib/story/places";

/**
 * メッセージ検索（#69）。ブラウザ版 Discord と同じく、ヘッダの検索バーを押すと
 * オーバーレイの検索パネルが開く。Ctrl+F / Cmd+F でも開ける。
 *
 * 検索は Server Action（lib/discord-like/search の純関数）で行い、本文はクライアントに置かない。
 */

type SearchState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; error: SearchParseError }
  | { kind: "results"; response: Extract<SearchResponse, { ok: true }> };

const DEBOUNCE_MS = 180;
const RESULT_SELECTOR = ".search-result, .search-user-profile-button";

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const formatDateTime = (sentAt: string): string => {
  const [date, time] = sentAt.split("T");
  const [year, month, day] = date.split("-");
  return `${Number(year)}年${Number(month)}月${Number(day)}日 ${time.slice(0, 5)}`;
};

const excerpt = (body: string, terms: string[]): string => {
  const limit = 160;
  if (terms.length === 0) {
    return body.length > limit ? `${body.slice(0, limit)}…` : body;
  }
  const lower = body.toLowerCase();
  const positions = terms
    .map((term) => lower.indexOf(term))
    .filter((position) => position >= 0)
    .sort((a, b) => a - b);
  if (positions.length === 0) {
    return body.length > limit ? `${body.slice(0, limit)}…` : body;
  }
  const start = Math.max(0, positions[0] - 40);
  const end = Math.min(body.length, start + limit);
  return `${start > 0 ? "…" : ""}${body.slice(start, end)}${end < body.length ? "…" : ""}`;
};

function Highlight({ text, terms }: { text: string; terms: string[] }) {
  const parts = useMemo(() => {
    const chunks: { text: string; hit: boolean; at: number }[] = [];
    if (terms.length === 0) {
      return [{ text, hit: false, at: 0 }];
    }
    const pattern = new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "gi");
    let last = 0;
    for (const match of text.matchAll(pattern)) {
      const at = match.index ?? 0;
      if (at > last) {
        chunks.push({ text: text.slice(last, at), hit: false, at: last });
      }
      chunks.push({ text: match[0], hit: true, at });
      last = at + match[0].length;
    }
    if (last < text.length) {
      chunks.push({ text: text.slice(last), hit: false, at: last });
    }
    return chunks;
  }, [text, terms]);

  return (
    <>
      {parts.map((part) =>
        part.hit ? <mark key={`hit-${part.at}`}>{part.text}</mark> : part.text,
      )}
    </>
  );
}

function SearchUserProfile({
  user,
  onOpen,
  onNavigate,
}: {
  user: MatchedUser;
  onOpen: () => void;
  onNavigate: () => void;
}) {
  const [open, setOpen] = useState(false);
  const profileId = useId();
  const label = `${user.displayName}（@${user.handle}）`;

  if (!user.profileUrl) {
    return <span>{label}</span>;
  }

  return (
    <div>
      <button
        type="button"
        className="search-user-profile-button"
        aria-expanded={open}
        aria-controls={open ? profileId : undefined}
        onClick={() => {
          if (!open) {
            onOpen();
          }
          setOpen(!open);
        }}
      >
        {user.displayName}
      </button>
      {open ? (
        <div id={profileId} className="message-profile">
          <p className="members-profile-handle">@{user.handle}</p>
          {user.status === "offline" ? <p className="members-profile-note">オフライン</p> : null}
          <Link className="members-profile-link" href={user.profileUrl} onClick={onNavigate}>
            {user.profileUrl.replace(/^\//, "")}
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function hrefFor(hit: SearchHit): string {
  const app = window.location.pathname.split("/")[1] || "";
  const base =
    hit.mode === "dm"
      ? `/${app}/channels/@me/${hit.threadUrlId}`
      : `/${app}/channels/${hit.guildUrlId}/${hit.channelUrlId}`;
  return `${base}?m=${encodeURIComponent(hit.id)}`;
}

export function MessageSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState<SearchOrder>("new");
  const [state, setState] = useState<SearchState>({ kind: "idle" });
  const story = useOptionalStory();

  const openerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const wasOpenRef = useRef(false);

  const parsed = useMemo(() => parseQuery(query), [query]);
  const terms = parsed.terms;

  const close = useCallback(() => setOpen(false), []);

  // 開いたら入力へ、閉じたら元の要素（検索ボタン）へフォーカスを戻す
  useEffect(() => {
    if (open) {
      wasOpenRef.current = true;
      inputRef.current?.focus();
      return;
    }
    if (wasOpenRef.current) {
      wasOpenRef.current = false;
      openerRef.current?.focus();
    }
  }, [open]);

  // Ctrl+F / Cmd+F で開く（ブラウザのページ内検索は使わない）
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f") {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Esc で閉じる
  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // 入力の変化に追従して検索する（少し待ってから。古い応答は捨てる）
  useEffect(() => {
    if (!open) {
      return;
    }
    const trimmed = query.trim();
    if (trimmed.length === 0) {
      setState({ kind: "idle" });
      return;
    }
    if (parsed.error) {
      setState({ kind: "error", error: parsed.error });
      return;
    }

    let cancelled = false;
    setState({ kind: "loading" });
    const timer = setTimeout(() => {
      searchMessages({ query: trimmed, order })
        .then((response) => {
          if (cancelled) {
            return;
          }
          setState(
            response.ok ? { kind: "results", response } : { kind: "error", error: response.error },
          );
        })
        .catch(() => {
          if (!cancelled) {
            setState({
              kind: "error",
              error: { token: "", message: "検索に失敗しました。もう一度お試しください" },
            });
          }
        });
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, query, order, parsed.error]);

  // 段階1: MaiMai の「攻略ブログ」の発言が検索結果に出た時点で、その事実を確認したとみなす
  // （検索はグローバルでも、手がかりのメッセージは dm-maimai のこの1件だけ）。
  useEffect(() => {
    if (state.kind !== "results") return;
    if (state.response.hits.some((hit) => hit.id === BLOG_TALK_MESSAGE_ID)) {
      story?.setFlag("s01-blog-talk");
    }
  }, [state, story]);

  const jump = useCallback(
    (hit: SearchHit) => {
      if (hit.authorId === "denden") {
        story?.setFlag("s05-old-discord-user");
      }
      if (hit.id === KAI_NICKNAME_ADVICE_MESSAGE_ID) {
        story?.setFlag("te01-kai-nickname");
      }
      const href = hrefFor(hit);
      setOpen(false);
      // ジャンプ先はサーバー側で「そのメッセージを含むページ」を返す（?m=）
      window.location.assign(href);
    },
    [story],
  );

  // 結果内の移動（↑↓）。先頭で↑を押したら入力へ戻る
  const handleResultsKeyDown = useCallback((event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
      return;
    }
    const buttons = Array.from(
      resultsRef.current?.querySelectorAll<HTMLButtonElement>(RESULT_SELECTOR) ?? [],
    );
    if (buttons.length === 0) {
      return;
    }
    const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const next =
      event.key === "ArrowDown"
        ? Math.min(buttons.length - 1, current + 1)
        : Math.max(0, current - 1);
    event.preventDefault();
    buttons[next]?.focus();
  }, []);

  /**
   * フォーカストラップ。ダイアログ内の最後から Tab、先頭から Shift+Tab で循環させ、
   * 背後のメンバー一覧やサイドバーへフォーカスが漏れないようにする。
   */
  const handleDialogKeyDown = useCallback((event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") {
      return;
    }
    const dialog = event.currentTarget;
    const candidates = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      ),
    );
    // 同じ name のラジオは、チェックされている1つだけが Tab の対象（ブラウザと同じ）
    const radioNames = new Set(
      candidates
        .filter((element): element is HTMLInputElement => element instanceof HTMLInputElement)
        .filter((element) => element.type === "radio" && element.checked)
        .map((element) => element.name),
    );
    const focusable = candidates.filter((element) => {
      if (!(element instanceof HTMLInputElement) || element.type !== "radio") {
        return true;
      }
      return element.checked || !radioNames.has(element.name);
    });
    if (focusable.length === 0) {
      return;
    }

    // 端で止めず、常に自分で次の要素へ移す（ブラウザ任せにすると背景へ漏れる）
    const index = focusable.indexOf(document.activeElement as HTMLElement);
    const next =
      index === -1
        ? event.shiftKey
          ? focusable.length - 1
          : 0
        : (index + (event.shiftKey ? -1 : 1) + focusable.length) % focusable.length;
    event.preventDefault();
    focusable[next]?.focus();
  }, []);

  const showResults = state.kind === "results";
  const response = state.kind === "results" ? state.response : null;

  return (
    <>
      <button
        ref={openerRef}
        type="button"
        aria-label="検索"
        aria-haspopup="dialog"
        aria-expanded={open}
        className="message-header-icon message-header-button"
        onClick={() => setOpen(true)}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </button>

      {open ? (
        <div className="search-overlay">
          <button
            type="button"
            className="search-overlay-backdrop"
            aria-label="検索を閉じる"
            tabIndex={-1}
            onClick={close}
          />
          <div
            className="search-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="search-dialog-title"
            onKeyDown={handleDialogKeyDown}
          >
            <div className="search-dialog-head">
              <h2 id="search-dialog-title" className="search-dialog-title">
                メッセージ検索
              </h2>
              <div className="search-input-row">
                <label htmlFor="message-search-input" className="visually-hidden">
                  メッセージを検索
                </label>
                <input
                  id="message-search-input"
                  ref={inputRef}
                  type="search"
                  className="search-input"
                  value={query}
                  placeholder="検索（例: from:MaiMai during:2026-08）"
                  autoComplete="off"
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowDown" && showResults) {
                      event.preventDefault();
                      resultsRef.current
                        ?.querySelector<HTMLButtonElement>(RESULT_SELECTOR)
                        ?.focus();
                    }
                  }}
                />
                <button
                  type="button"
                  className="search-close"
                  aria-label="検索を閉じる"
                  onClick={close}
                >
                  ×
                </button>
              </div>
              <div className="search-controls">
                <fieldset className="search-order">
                  <legend className="visually-hidden">並び順</legend>
                  <label>
                    <input
                      type="radio"
                      name="search-order"
                      value="new"
                      checked={order === "new"}
                      onChange={() => setOrder("new")}
                    />
                    新しい順
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="search-order"
                      value="old"
                      checked={order === "old"}
                      onChange={() => setOrder("old")}
                    />
                    古い順
                  </label>
                </fieldset>
                <p className="search-hint">
                  from: / in: / before: / after: / during: / has: / mentions: / pinned:（語は AND）
                </p>
              </div>
            </div>

            <section
              ref={resultsRef}
              className="search-results"
              aria-label="検索結果"
              onKeyDown={handleResultsKeyDown}
            >
              {state.kind === "idle" ? (
                <p className="search-status">
                  キーワードを入力してください。例: 「note」「移行」「from:MaiMai during:2026-08」
                </p>
              ) : null}

              {state.kind === "loading" ? (
                <p className="search-status" role="status">
                  検索中…
                </p>
              ) : null}

              {state.kind === "error" ? (
                <p className="search-status search-status-error" role="alert">
                  {state.error.token
                    ? `「${state.error.token}」は正しくありません。${state.error.message}`
                    : state.error.message}
                </p>
              ) : null}

              {response ? (
                <>
                  <p className="search-summary" role="status">
                    {response.total === 0
                      ? "一致するメッセージはありません"
                      : `全${response.total}件中 ${response.hits.length}件を表示`}
                  </p>
                  {response.matchedUsers.length > 0 ? (
                    <div className="search-users">
                      <p>該当ユーザー</p>
                      {response.matchedUsers.map((user) => (
                        <SearchUserProfile
                          key={user.id}
                          user={user}
                          onOpen={() => {
                            if (user.id === "denden") {
                              story?.setFlag("s05-old-discord-user");
                            }
                          }}
                          onNavigate={close}
                        />
                      ))}
                    </div>
                  ) : null}
                  {response.hits.length > 0 ? (
                    <ul className="search-result-list">
                      {response.hits.map((hit) => (
                        <li key={hit.id}>
                          <button type="button" className="search-result" onClick={() => jump(hit)}>
                            <span className="search-result-meta">
                              <span className="search-result-author">{hit.authorName}</span>
                              <span className="search-result-channel">
                                {hit.mode === "dm"
                                  ? `DM・${hit.channelLabel}`
                                  : `#${hit.channelLabel}`}
                              </span>
                              {hit.pinned ? (
                                <span className="search-result-pin">ピン留め</span>
                              ) : null}
                              <time className="search-result-date" dateTime={hit.sentAt}>
                                {formatDateTime(hit.sentAt)}
                              </time>
                            </span>
                            <span className="search-result-body">
                              <Highlight text={excerpt(hit.body, terms)} terms={terms} />
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </>
              ) : null}
            </section>
          </div>
        </div>
      ) : null}
    </>
  );
}
