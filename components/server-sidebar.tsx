import Link from "next/link";
import { SidebarPane } from "./sidebar-pane";

/** チャンネル一覧のプレースホルダ。英字IDはURL構造の確認用で、実データは #4 で接続する。 */
const TEXT_CHANNELS = [
  { id: "c1", name: "一般" },
  { id: "c2", name: "雑談" },
];

const VOICE_CHANNELS = [{ id: "v1", name: "ボイス 1" }];

export function ServerSidebar({
  serverId,
  activeChannelId,
}: {
  serverId: string;
  activeChannelId: string;
}) {
  return (
    <SidebarPane label="チャンネル一覧" title="サーバー（プレースホルダ）">
      <p className="sidebar-section">テキストチャンネル</p>
      <ul>
        {TEXT_CHANNELS.map((channel) => (
          <li key={channel.id}>
            <Link
              href={`/servers/${serverId}/channels/${channel.id}`}
              className="sidebar-item"
              aria-current={activeChannelId === channel.id ? "page" : undefined}
            >
              <span aria-hidden="true" className="text-fg-muted">
                #
              </span>
              <span className="truncate">{channel.name}</span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="sidebar-section">ボイスチャンネル</p>
      <ul>
        {VOICE_CHANNELS.map((channel) => (
          <li key={channel.id}>
            <Link
              href={`/servers/${serverId}/channels/${channel.id}`}
              className="sidebar-item"
              aria-current={activeChannelId === channel.id ? "page" : undefined}
            >
              <span aria-hidden="true" className="text-fg-muted">
                ♪
              </span>
              <span className="truncate">{channel.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </SidebarPane>
  );
}
