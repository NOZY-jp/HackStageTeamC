import fs from "node:fs/promises";
import { describe, expect, it } from "vitest";

const CHANNELS = "app/(discord-like)/[app]/channels";
const GUILD_LAYOUT = `${CHANNELS}/[guildId]/layout.tsx`;
const CHANNEL_PAGE = `${CHANNELS}/[guildId]/[channelId]/page.tsx`;
const CHANNEL_LOADING = `${CHANNELS}/[guildId]/[channelId]/loading.tsx`;
const DM_HOME_PAGE = `${CHANNELS}/[guildId]/page.tsx`;

const read = (path: string) => fs.readFile(path, "utf8");
const exists = async (path: string) => {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
};

describe("チャンネル一覧の置き場所（#70）", () => {
  it("一覧は [guildId]/layout.tsx が持ち、チャンネルページは持たない", async () => {
    const layout = await read(GUILD_LAYOUT);
    expect(layout).toContain("<ChannelSidebar");
    expect(layout).toContain("<DmList");
    expect(layout).toContain("{children}");

    // 同じセグメントの page に置くと、遷移のたびに loading.tsx で丸ごと置き換わる
    const channelPage = await read(CHANNEL_PAGE);
    expect(channelPage).not.toContain("ChannelSidebar");
    expect(channelPage).not.toContain("DmList");
  });

  it("DM ホームも一覧を layout に任せる", async () => {
    const page = await read(DM_HOME_PAGE);
    expect(page).not.toContain("DmList");
    expect(page).toContain("PlaceholderNotice");
  });

  it("切替中はメッセージ欄のスケルトンだけを出す", async () => {
    const loading = await read(CHANNEL_LOADING);
    expect(loading).toContain("MessageLoadingSkeleton");
    expect(loading).not.toContain("チャンネルを読み込んでいます");

    // 旧プレースホルダは未使用になったので残さない
    expect(await exists("components/discord-like/loading-notice.tsx")).toBe(false);
  });

  it("スケルトンの CSS は既存ブロックの後ろに追記している（既存ルールを書き換えない）", async () => {
    const css = await read("app/globals.css");
    const searchCss = css.indexOf("/* ---- メッセージ検索（#69");
    const skeletonCss = css.indexOf("/* ---- チャンネル切替中のメッセージスケルトン（#70");
    expect(searchCss).toBeGreaterThan(-1);
    expect(skeletonCss).toBeGreaterThan(searchCss);
  });
});
