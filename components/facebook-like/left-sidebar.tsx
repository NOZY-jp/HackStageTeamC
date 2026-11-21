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
          <Link href={`/talkup/profile/${selfUser.handle}`} className="fb-sidebar-link">
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
          <Link href="/talkup" className="fb-sidebar-link">
            <span className="fb-sidebar-icon text-[#7c3aed]">
              <HomeIcon className="w-5 h-5" />
            </span>
            <span className="font-medium text-sm">ニュースフィード</span>
          </Link>
        </li>
        <li>
          <Link href={`/talkup/profile/${selfUser.handle}#friends`} className="fb-sidebar-link">
            <span className="fb-sidebar-icon text-[#7c3aed]">
              <UsersIcon className="w-5 h-5" />
            </span>
            <span className="font-medium text-sm">友達（{friends.length}人）</span>
          </Link>
        </li>
      </ul>

      <div className="fb-sidebar-divider" />

      <p className="fb-sidebar-footer">
        プライバシー · 利用規約 · 広告 · Cookie
        <br />
        talkup © 2026
      </p>
    </aside>
  );
}
