"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { type FlagId, SITE_IDS, SITES, type SiteId, siteAt, unlockedSites } from "@/lib/story";

/**
 * ブックマーク（ゲームの中で開放したサイトの一覧）。画面の左端の小さな札から開く。
 * 物語や謎解きの段階が進んで新しいサイトが開放されたら、上に短く知らせる（軽い誘導）。
 * 開いたサイトと知らせたサイトは、このブラウザに覚える（進行状態とは別）。
 */
const VISITED_KEY = "hackstage:story-sites-visited:v1";
const ANNOUNCED_KEY = "hackstage:story-sites-announced:v1";
const NOTICE_MS = 5000;

function loadIds(key: string): SiteId[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    return Array.isArray(parsed)
      ? parsed.filter((id): id is SiteId => SITE_IDS.includes(id as SiteId))
      : [];
  } catch {
    return [];
  }
}

function saveIds(key: string, ids: SiteId[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(ids));
  } catch {
    // 覚えられなくても、開いているあいだは使える
  }
}

export function SiteBookmarks({ pathname, flags }: { pathname: string; flags: readonly FlagId[] }) {
  const [visited, setVisited] = useState<SiteId[]>([]);
  const [announced, setAnnounced] = useState<SiteId[] | undefined>();
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState<SiteId | undefined>();

  // 保存した値を読む（サーバーの描画とずれないよう、描いたあとで読む）
  useEffect(() => {
    setVisited(loadIds(VISITED_KEY));
    setAnnounced(loadIds(ANNOUNCED_KEY));
  }, []);

  // 開いたサイトは、その時点で開放したことにする（締め出しはしない）
  const here = siteAt(pathname);
  useEffect(() => {
    if (!here) return;
    setVisited((current) => {
      if (current.includes(here)) return current;
      const next = [...current, here];
      saveIds(VISITED_KEY, next);
      return next;
    });
  }, [here]);

  const unlocked = useMemo(() => unlockedSites(flags, visited), [flags, visited]);

  // 新しく開放したサイトを知らせる（いま開いているサイトと、はじめから開いているサイトは知らせない）
  useEffect(() => {
    if (!announced) return;
    const fresh = unlocked.filter((id) => !announced.includes(id));
    if (fresh.length === 0) return;
    const shown = fresh.find((id) => id !== here && SITES[id].unlockWith.length > 0);
    const next = [...announced, ...fresh];
    setAnnounced(next);
    saveIds(ANNOUNCED_KEY, next);
    if (shown) setNotice(shown);
  }, [unlocked, announced, here]);

  // 知らせたサイトを開いたら、知らせは消す
  useEffect(() => {
    if (notice && notice === here) setNotice(undefined);
  }, [notice, here]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(undefined), NOTICE_MS);
    return () => window.clearTimeout(timer);
  }, [notice]);

  return (
    <>
      {notice ? (
        <Link
          className="sb-notice"
          href={SITES[notice].href}
          role="status"
          onClick={() => setNotice(undefined)}
        >
          <span className="sb-notice-label">ブックマークに追加しました</span>
          <span className="sb-notice-site">{SITES[notice].label}</span>
        </Link>
      ) : null}
      <nav className="sb-dock" data-open={open || undefined} aria-label="ブックマーク">
        <button
          type="button"
          className="sb-toggle"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          ブックマーク
        </button>
        {open ? (
          <ul className="sb-list">
            {unlocked.map((id) => (
              <li key={id}>
                <Link
                  href={SITES[id].href}
                  className="sb-item"
                  aria-current={id === here ? "page" : undefined}
                  onClick={() => setOpen(false)}
                >
                  {SITES[id].label}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </nav>
    </>
  );
}
