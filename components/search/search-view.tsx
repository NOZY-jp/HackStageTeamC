"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useId, useState } from "react";
import type { SearchResult } from "@/lib/search";
import "./search.css";

type SearchViewProps = {
  query: string;
  results: SearchResult[];
  loading?: boolean;
};

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden="true">
      <circle cx="8.5" cy="8.5" r="5.75" stroke="currentColor" strokeWidth="1.75" />
      <path d="M13 13l4.25 4.25" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function SeekWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={compact ? "seek-brand seek-brand--compact" : "seek-brand"}>
      <span className="seek-sr-only">Seek</span>
      <span className="seek-brand-s" aria-hidden="true">
        S
      </span>
      <span className="seek-brand-e1" aria-hidden="true">
        e
      </span>
      <span className="seek-brand-e2" aria-hidden="true">
        e
      </span>
      <span className="seek-brand-k" aria-hidden="true">
        k
      </span>
    </span>
  );
}

/** Seek (`seek.jp`) の検索画面。初期画面と検索結果一覧を切り替える。 */
export function SearchView({ query, results, loading = false }: SearchViewProps) {
  const router = useRouter();
  const inputId = useId();
  const [value, setValue] = useState(query);

  useEffect(() => {
    setValue(query);
  }, [query]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = value.trim();
    router.push(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search");
  };

  if (!query && !loading) {
    return (
      <div className="seek-shell seek-shell--home">
        <main className="seek-home">
          <h1 className="seek-home-heading">
            <SeekWordmark />
          </h1>
          <form
            className="seek-form seek-form--home"
            aria-label="Seek 検索"
            action="/search"
            onSubmit={handleSubmit}
          >
            <label htmlFor={inputId} className="seek-sr-only">
              Seek で検索
            </label>
            <div className="seek-input-wrap">
              <span className="seek-input-icon">
                <SearchIcon />
              </span>
              <input
                id={inputId}
                type="search"
                name="q"
                className="seek-input"
                placeholder="キーワードを入力して検索"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="seek-home-actions">
              <button type="submit" className="seek-submit-btn">
                Seek 検索
              </button>
            </div>
          </form>
          <p className="seek-home-caption">インターネット上の公開ページを検索</p>
        </main>
      </div>
    );
  }

  return (
    <div className="seek-shell">
      <header className="seek-header">
        <div className="seek-header-inner">
          <Link href="/search" className="seek-logo-link" aria-label="Seek トップ">
            <SeekWordmark compact />
          </Link>
          <form
            className="seek-form seek-form--bar"
            aria-label="Seek 検索"
            action="/search"
            onSubmit={handleSubmit}
          >
            <label htmlFor={inputId} className="seek-sr-only">
              Seek で検索
            </label>
            <div className="seek-input-wrap seek-input-wrap--bar">
              <span className="seek-input-icon">
                <SearchIcon />
              </span>
              <input
                id={inputId}
                type="search"
                name="q"
                className="seek-input"
                placeholder="キーワードを入力して検索"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                autoComplete="off"
              />
              <button type="submit" className="seek-bar-btn">
                検索
              </button>
            </div>
          </form>
        </div>
      </header>

      <main className="seek-main">
        {loading ? (
          <p className="seek-status">検索しています…</p>
        ) : (
          <>
            <h1 className="seek-sr-only">「{query}」の検索結果</h1>
            <p className="seek-count">約 {results.length} 件の結果</p>
            {results.length === 0 ? (
              <section className="seek-empty" aria-label="一致する結果なし">
                <p className="seek-empty-title">
                  「<span className="seek-empty-query">{query}</span>
                  」に一致する情報は見つかりませんでした。
                </p>
                <ul className="seek-empty-tips">
                  <li>キーワードに誤字・脱字がないか確認してください。</li>
                  <li>別のキーワードやスペース区切りで検索してみてください。</li>
                </ul>
              </section>
            ) : (
              <ol className="seek-results">
                {results.map((result) => (
                  <li key={result.id} className="seek-result">
                    <div className="seek-result-meta">
                      <span className="seek-result-site">{result.siteName}</span>
                      <span className="seek-result-url">{result.displayUrl}</span>
                    </div>
                    <h2 className="seek-result-heading">
                      <Link href={result.url} className="seek-result-link">
                        {result.title}
                      </Link>
                    </h2>
                    <p className="seek-result-snippet">{result.snippet}</p>
                  </li>
                ))}
              </ol>
            )}
          </>
        )}
      </main>
    </div>
  );
}
