"use client";

import { lazy, type ReactNode, Suspense } from "react";
import { useStoryOptional } from "@/components/common/story/story-provider";

const SearchAfterDiscovery = lazy(() => import("./search-after-discovery"));

export function SearchProgressResults({
  query,
  tab,
  children,
}: {
  query: string;
  tab: string;
  children: ReactNode;
}) {
  const story = useStoryOptional();
  const found = story?.state.flags.includes("foundBff") ?? false;
  if (!found || !query) return children;

  // 発見前の HTML/RSC には未開放の結果を含めない。読み込み中は公開結果を表示し続ける。
  return (
    <Suspense fallback={children}>
      <SearchAfterDiscovery query={query} tab={tab} />
    </Suspense>
  );
}
