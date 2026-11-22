"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useStoryOptional } from "@/components/common/story/story-provider";

/**
 * 発見後（foundBff）にだけ出る差分は、別チャンクとして遅延読み込みする。
 * サーバーの RSC ペイロードに未開放のデータを載せないため（#248 人レビュー）。
 * 空の案内もここで出す（発見後の差分件数を知るのはクライアントだけのため）。
 */
type AfterCount = { users: number; posts: number };
type AfterProps = {
  query: string;
  tab: string;
  showUserHeading: boolean;
  showPostHeading: boolean;
  onCount: (count: AfterCount) => void;
};

const SearchAfterDiscovery = dynamic<AfterProps>(
  () => import("./search-after-discovery").then((module) => module.SearchAfterDiscovery),
  { ssr: false },
);

const EMPTY = { users: 0, posts: 0 } as const;

export function SearchProgressResults({
  query,
  tab,
  userCount,
  postCount,
  children,
}: {
  query: string;
  tab: string;
  /** 発見前のサーバー描画分の件数（空の案内に使う） */
  userCount: number;
  postCount: number;
  children: React.ReactNode;
}) {
  const story = useStoryOptional();
  const found = story?.state.flags.includes("foundBff") ?? false;
  const [after, setAfter] = useState<AfterCount>({ ...EMPTY });

  useEffect(() => {
    if (!found) setAfter({ ...EMPTY });
  }, [found]);

  const users = userCount + after.users;
  const posts = postCount + (tab === "user" ? 0 : after.posts);

  return (
    <>
      {children}
      {found && query !== "" ? (
        <SearchAfterDiscovery
          query={query}
          tab={tab}
          showUserHeading={userCount === 0}
          showPostHeading={tab !== "user" && postCount === 0}
          onCount={setAfter}
        />
      ) : null}
      {query === "" ? (
        <div className="tw-empty">キーワードを入力して検索してください。</div>
      ) : users === 0 && posts === 0 ? (
        <div className="tw-empty">
          <p className="tw-empty-title">「{query}」に一致する結果はありません</p>
          <p className="tw-empty-sub">別のキーワードで検索してみてください。</p>
        </div>
      ) : tab === "user" ? null : posts === 0 ? (
        <div className="tw-empty">
          <p className="tw-empty-sub">「{query}」に一致するポストはありません</p>
        </div>
      ) : null}
    </>
  );
}
