import { describe, expect, it } from "vitest";
import {
  APP_PREFIX,
  dmListPath,
  dmThreadPath,
  guildChannelPath,
  isActiveHref,
  isAppPrefix,
} from "./app-prefix";

const GUILD = "1074210658438352001";
const CHANNEL = "1074210658438352101";

describe("app-prefix", () => {
  it("接頭辞は環境変数か既定の discord.com", () => {
    expect(APP_PREFIX).toBe(process.env.NEXT_PUBLIC_APP_PREFIX ?? "discord.com");
  });

  it("DM一覧は /<app>/channels/@me", () => {
    expect(dmListPath()).toBe(`/${APP_PREFIX}/channels/@me`);
  });

  it("DMスレッドは数値IDのパス", () => {
    expect(dmThreadPath(GUILD)).toBe(`/${APP_PREFIX}/channels/@me/${GUILD}`);
    expect(dmThreadPath(GUILD)).toMatch(/^\/.+\/channels\/@me\/\d{17,19}$/);
  });

  it("サーバーチャンネルは guild と channel の数値ID", () => {
    expect(guildChannelPath(GUILD, CHANNEL)).toBe(`/${APP_PREFIX}/channels/${GUILD}/${CHANNEL}`);
  });

  it("接頭辞の一致判定", () => {
    expect(isAppPrefix(APP_PREFIX)).toBe(true);
    expect(isAppPrefix("example.test")).toBe(false);
    expect(isAppPrefix("")).toBe(false);
  });

  it("選択中のリンク判定は末尾スラッシュとエンコード差を吸収する", () => {
    expect(isActiveHref(guildChannelPath(GUILD, CHANNEL), guildChannelPath(GUILD, CHANNEL))).toBe(
      true,
    );
    expect(
      isActiveHref(`${guildChannelPath(GUILD, CHANNEL)}/`, guildChannelPath(GUILD, CHANNEL)),
    ).toBe(true);
    expect(isActiveHref(dmListPath().replace("@me", "%40me"), dmListPath())).toBe(true);
    expect(isActiveHref(guildChannelPath(GUILD, CHANNEL), guildChannelPath(GUILD, "1"))).toBe(
      false,
    );
    expect(isActiveHref(null, guildChannelPath(GUILD, CHANNEL))).toBe(false);
  });
});
