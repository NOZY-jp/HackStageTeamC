"use client";

import { type ReactNode, useState } from "react";

type Tab = "forYou" | "following";

/**
 * ホーム上部のタブ行（おすすめ・フォロー中）。現行 X に合わせて
 * タブの切り替えだけは画面内で動く（中身はサーバーで描いたリスト）。
 */
export function HomeTabs({ forYou, following }: { forYou: ReactNode; following: ReactNode }) {
  const [tab, setTab] = useState<Tab>("forYou");
  const select = (next: Tab) => () => setTab(next);
  return (
    <>
      <div className="tw-page-header tw-tabs-header">
        <div className="tw-tabs" role="tablist" aria-label="タイムラインの切り替え">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "forYou"}
            data-active={tab === "forYou" || undefined}
            className="tw-tab"
            onClick={select("forYou")}
          >
            <span>おすすめ</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "following"}
            data-active={tab === "following" || undefined}
            className="tw-tab"
            onClick={select("following")}
          >
            <span>フォロー中</span>
          </button>
        </div>
      </div>
      <div role="tabpanel" hidden={tab !== "forYou"}>
        {forYou}
      </div>
      <div role="tabpanel" hidden={tab !== "following"}>
        {following}
      </div>
    </>
  );
}
