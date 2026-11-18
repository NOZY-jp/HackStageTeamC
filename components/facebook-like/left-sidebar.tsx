"use client";

import Link from "next/link";
import { listFriends } from "@/lib/facebook-like";
import { FbAvatar } from "./avatar";
import { useFacebook } from "./facebook-context";
import { HomeIcon, UsersIcon } from "./icons";

export function FacebookLeftSidebar() {
  const { selfUser } = useFacebook();
  const friends = listFriends(selfUser.id);

  return (
    <aside className="fb-left-col" aria-label="ショートカット">
      <ul className="space-y-1">
        <li>
          <Link href={`/facebook/profile/${selfUser.handle}`} className="fb-sidebar-link">
            <FbAvatar
              displayName={selfUser.displayName}
              avatarColor={selfUser.avatarColor}
              status={selfUser.status}
              size="sm"
              showStatus
            />
            <span className="font-semibold text-sm">{selfUser.displayName}</span>
          </Link>
        </li>
        <li>
          <Link href="/facebook" className="fb-sidebar-link">
            <span className="fb-sidebar-icon text-[#1877f2]">
              <HomeIcon className="w-5 h-5" />
            </span>
            <span className="font-medium text-sm">ニュースフィード</span>
          </Link>
        </li>
        <li>
          <Link href={`/facebook/profile/${selfUser.handle}#friends`} className="fb-sidebar-link">
            <span className="fb-sidebar-icon text-[#1877f2]">
              <UsersIcon className="w-5 h-5" />
            </span>
            <span className="font-medium text-sm">友達（{friends.length}人）</span>
          </Link>
        </li>
      </ul>

      <div className="fb-sidebar-divider" />

      <div className="px-2">
        <h2 className="text-xs font-semibold text-[var(--fb-muted)] mb-2">
          HackStage TeamC コミュニティ
        </h2>
        <p className="text-xs text-[var(--fb-muted)] leading-relaxed">
          Discord 側と同じメンバーが参加している社内・チーム向け SNS モックです。
        </p>
      </div>
    </aside>
  );
}
