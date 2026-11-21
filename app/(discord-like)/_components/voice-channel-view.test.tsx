import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { AppShell } from "@/components/discord-like/app-shell";
import { ChannelTree } from "@/components/discord-like/channel-tree";
import { SidebarUserPanel } from "@/components/discord-like/sidebar-user-panel";
import { getChannel, getGuild } from "@/lib/discord-like";
import { guildChannelPath } from "@/lib/platform/app-prefix";
import { VoiceChannelView } from "./voice-channel-view";
import { VoiceProvider } from "./voice-context";

const guildUrlId = getGuild("mhc")?.urlId ?? "";
const vc1UrlId = getChannel("mhc-vc-1")?.urlId ?? "";
const vc2UrlId = getChannel("mhc-vc-2")?.urlId ?? "";
const vc1Path = guildChannelPath(guildUrlId, vc1UrlId);
const vc2Path = guildChannelPath(guildUrlId, vc2UrlId);

const nav = vi.hoisted(() => ({ path: "" }));
vi.mock("next/navigation", () => ({ usePathname: () => nav.path }));
vi.mock("next/link", () => ({
  default: ({ href, onNavigate, ...props }: ComponentProps<"a"> & { onNavigate?: () => void }) => (
    <a
      {...props}
      href={href}
      onClick={(event) => {
        event.preventDefault();
        onNavigate?.();
        nav.path = href ?? "";
      }}
    />
  ),
}));

const participants = [{ id: "mina", displayName: "双剣ミナ", avatarColor: "#5865f2" }];
const currentUser = { id: "hal", displayName: "Hal", avatarColor: "#eb459e" };

function view(channelId: string, channelName: string, channelUrlId: string) {
  return (
    <VoiceChannelView
      guildId="mhc"
      guildUrlId={guildUrlId}
      channelId={channelId}
      channelUrlId={channelUrlId}
      channelName={channelName}
      participants={participants}
      currentUser={currentUser}
    />
  );
}

function shell(children: React.ReactNode) {
  return (
    <AppShell rail={<span />}>
      <VoiceProvider>{children}</VoiceProvider>
    </AppShell>
  );
}

function pane(name: string) {
  return within(screen.getByRole("main", { name }));
}

describe("VoiceChannelView", () => {
  it("開いた時点で接続状態になり、切断できる", async () => {
    nav.path = vc1Path;
    render(shell(view("mhc-vc-1", "雑談通話", vc1UrlId)));

    expect(await pane("雑談通話").findByRole("button", { name: "切断" })).toBeInTheDocument();
  });

  it("「参加」ボタンは出ない", () => {
    nav.path = vc1Path;
    render(shell(view("mhc-vc-1", "雑談通話", vc1UrlId)));

    expect(pane("雑談通話").queryByRole("button", { name: "参加" })).not.toBeInTheDocument();
  });

  it("左下から切断し、画面の参加ボタン・同じVC・テキストチャンネル経由で再参加できる", async () => {
    const harness = () => (
      <VoiceProvider>
        <AppShell rail={<span />} leftFooter={<SidebarUserPanel userId="hal" />}>
          <ChannelTree
            guildId="mhc"
            guildUrlId={guildUrlId}
            currentUser={currentUser}
            sections={[
              {
                id: "voice-test",
                name: null,
                channels: [
                  {
                    id: "mhc-vc-1",
                    urlId: vc1UrlId,
                    name: "雑談通話",
                    kind: "voice",
                    unread: false,
                    mentionCount: 0,
                    participants: [],
                  },
                  {
                    id: "text",
                    urlId: "123",
                    name: "雑談",
                    kind: "text",
                    unread: false,
                    mentionCount: 0,
                    participants: [],
                  },
                ],
              },
            ]}
          />
          <VoiceChannelView
            guildId="mhc"
            guildUrlId={guildUrlId}
            channelId="mhc-vc-1"
            channelUrlId={vc1UrlId}
            channelName="雑談通話"
            participants={[]}
            currentUser={currentUser}
          />
        </AppShell>
      </VoiceProvider>
    );
    nav.path = vc1Path;
    const { rerender } = render(harness());
    const sidebar = within(screen.getByRole("region", { name: /ユーザーネーム/ }));
    const channel = pane("雑談通話");
    const disconnect = () => fireEvent.click(sidebar.getByRole("button", { name: "切断" }));
    const open = (name: string) => {
      fireEvent.click(screen.getByRole("link", { name }));
      rerender(harness());
    };

    disconnect();
    expect(channel.getByText("参加者はいません")).toBeInTheDocument();
    expect(channel.queryByRole("region", { name: "通話" })).not.toBeInTheDocument();
    fireEvent.click(channel.getByRole("button", { name: "通話に参加" }));
    expect(channel.getByText(/（自分）/)).toBeInTheDocument();

    disconnect();
    open("ボイスチャンネル 雑談通話");
    expect(channel.getByText(/（自分）/)).toBeInTheDocument();

    disconnect();
    open("テキストチャンネル 雑談");
    expect(sidebar.queryByRole("button", { name: "切断" })).not.toBeInTheDocument();
    open("ボイスチャンネル 雑談通話");
    expect(channel.getByText(/（自分）/)).toBeInTheDocument();
  });

  it("参加者一覧に自分が入る", async () => {
    nav.path = vc1Path;
    render(shell(view("mhc-vc-1", "雑談通話", vc1UrlId)));

    expect(await pane("雑談通話").findByText(/（自分）/)).toBeInTheDocument();
  });

  it("VC1 → VC2 → VC1 と往復すると、戻った VC1 でも接続状態になる", async () => {
    // ルートキャッシュを模して、両方の画面を同時にマウントしたままにする
    const both = () =>
      shell(
        <>
          {view("mhc-vc-1", "雑談通話", vc1UrlId)}
          {view("mhc-vc-2", "狩り募集", vc2UrlId)}
        </>,
      );
    nav.path = vc1Path;
    const { rerender } = render(both());
    expect(await pane("雑談通話").findByRole("button", { name: "切断" })).toBeInTheDocument();

    nav.path = vc2Path;
    rerender(both());
    expect(await pane("狩り募集").findByRole("button", { name: "切断" })).toBeInTheDocument();
    // 裏に残った VC1 が接続を奪い返さない
    expect(pane("雑談通話").queryByRole("button", { name: "切断" })).not.toBeInTheDocument();

    nav.path = vc1Path;
    rerender(both());
    expect(await pane("雑談通話").findByRole("button", { name: "切断" })).toBeInTheDocument();
  });

  it("「切断」したあとは勝手に再接続しない", async () => {
    nav.path = vc1Path;
    render(shell(view("mhc-vc-1", "雑談通話", vc1UrlId)));

    fireEvent.click(await pane("雑談通話").findByRole("button", { name: "切断" }));
    await waitFor(() => {
      expect(pane("雑談通話").queryByRole("button", { name: "切断" })).not.toBeInTheDocument();
    });

    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(pane("雑談通話").queryByRole("button", { name: "切断" })).not.toBeInTheDocument();
  });

  it("切断後に別の VC へ移ってから戻ると、また自動参加する", async () => {
    nav.path = vc1Path;
    const { rerender } = render(shell(view("mhc-vc-1", "雑談通話", vc1UrlId)));
    fireEvent.click(await pane("雑談通話").findByRole("button", { name: "切断" }));
    await waitFor(() => {
      expect(pane("雑談通話").queryByRole("button", { name: "切断" })).not.toBeInTheDocument();
    });

    nav.path = vc2Path;
    rerender(shell(view("mhc-vc-2", "狩り募集", vc2UrlId)));
    expect(await pane("狩り募集").findByRole("button", { name: "切断" })).toBeInTheDocument();

    nav.path = vc1Path;
    rerender(shell(view("mhc-vc-1", "雑談通話", vc1UrlId)));
    expect(await pane("雑談通話").findByRole("button", { name: "切断" })).toBeInTheDocument();
  });
});

describe("通話画面のUI（ホバーで操作を出す）", () => {
  it("参加者タイルに名前と状態が出る（1人でも破綻しない）", async () => {
    nav.path = vc1Path;
    const { container } = render(shell(view("mhc-vc-1", "雑談通話", vc1UrlId)));

    const main = pane("雑談通話");
    // 参加者（自分以外）と自分のタイル
    expect(await main.findByText("双剣ミナ")).toBeInTheDocument();
    expect(main.getByText(/（自分）/)).toBeInTheDocument();
    // 通話の状態と経過時間が見出しの下に出る
    expect(main.getByText("接続中", { selector: ".call-stage-status" })).toBeInTheDocument();
    const timer = container.querySelector(".call-stage-timer");
    expect(timer?.textContent).toMatch(/通話時間\s*\d+:\d{2}/);
  });

  it("操作はホバー中だけ出て、外すと消える（レイアウトは動かさない）", async () => {
    nav.path = vc1Path;
    const { container } = render(shell(view("mhc-vc-1", "雑談通話", vc1UrlId)));
    const stage = container.querySelector(".call-stage");
    const controls = container.querySelector(".call-controls");
    if (!stage || !controls) throw new Error("stage missing");

    // 非ホバー: data-visible=false（CSS で opacity/visibility を消す）
    expect(controls.getAttribute("data-visible")).toBe("false");
    // 出し入れでレイアウトが動かないよう、操作バーは absolute 配置（CSS 側で固定）
    const css = await import("node:fs/promises").then((fs) =>
      fs.readFile("app/globals.css", "utf8"),
    );
    expect(css).toMatch(/\.call-controls \{[^}]*position: absolute/);
    // 非表示中はクリックも受けない（透明なボタンが押せてしまうのを防ぐ）
    expect(css).toMatch(/\.call-controls \{[^}]*pointer-events: none/);
    // 表示中は操作できる
    expect(css).toMatch(/\.call-controls\[data-visible="true"\] \{[^}]*pointer-events: auto/);

    fireEvent.pointerEnter(stage);
    expect(controls.getAttribute("data-visible")).toBe("true");

    fireEvent.pointerLeave(stage);
    expect(controls.getAttribute("data-visible")).toBe("false");
  });

  it("出ていないあいだ、操作ボタンは Tab で到達しない（フォーカス不可）", async () => {
    nav.path = vc1Path;
    const { container } = render(shell(view("mhc-vc-1", "雑談通話", vc1UrlId)));
    const stage = container.querySelector(".call-stage");
    if (!stage) throw new Error("stage missing");

    const leave = await pane("雑談通話").findByRole("button", { name: "切断" });
    expect(leave).toHaveProperty("tabIndex", -1);
    expect(pane("雑談通話").getByRole("button", { name: "ミュート" })).toHaveProperty(
      "tabIndex",
      -1,
    );

    // キーボード: 「操作を表示」にフォーカスすると操作が出て、到達できるようになる
    fireEvent.focus(container.querySelector(".call-reveal") as Element);
    expect(container.querySelector(".call-controls")?.getAttribute("data-visible")).toBe("true");
    expect(pane("雑談通話").getByRole("button", { name: "切断" })).toHaveProperty("tabIndex", 0);
  });

  it("切断ボタンは従来どおり動く（切断後は操作が出ない）", async () => {
    nav.path = vc1Path;
    const { container } = render(shell(view("mhc-vc-1", "雑談通話", vc1UrlId)));
    const stage = container.querySelector(".call-stage");
    if (!stage) throw new Error("stage missing");
    fireEvent.pointerEnter(stage);

    fireEvent.click(await pane("雑談通話").findByRole("button", { name: "切断" }));
    await waitFor(() => {
      expect(pane("雑談通話").queryByRole("button", { name: "切断" })).not.toBeInTheDocument();
    });
    expect(container.querySelector(".call-stage")?.getAttribute("data-connected")).toBe("false");
  });
});

describe("VC タイルの見た目（実Discord準拠・#137）", () => {
  it("名前とマイクは左下、人数で 1/2/4/6 列になる", async () => {
    const css = await import("node:fs/promises").then((fs) =>
      fs.readFile("app/globals.css", "utf8"),
    );
    // 左下の名前＋マイク
    expect(css).toMatch(
      /\.call-tiles\[data-layout="grid"\] \.call-tile-label \{[^}]*position: absolute;[^}]*left: 10px;[^}]*bottom: 8px;/,
    );
    // 人数に応じた列（1 / 2 / 4 / 6）
    expect(css).toMatch(/\[data-count="1"\] \{[^}]*grid-template-columns: minmax\(0, 1fr\)/);
    expect(css).toMatch(/\.call-tiles\[data-layout="grid"\] \{[^}]*repeat\(2,/);
    expect(css).toMatch(/\[data-count="5"\],[^{]*\[data-count="6"\] \{[^}]*repeat\(3,/);
    // 発話の緑枠とパルス、動きを減らす設定で停止
    expect(css).toMatch(/@keyframes call-pulse/);
    expect(css).toMatch(/prefers-reduced-motion: reduce\)[^@]*call-tile\[data-speaking="true"\]/);
  });
});
