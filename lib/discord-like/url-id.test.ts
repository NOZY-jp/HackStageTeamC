import { describe, expect, it } from "vitest";
import {
  getChannelByUrlId,
  getDMThreadByUrlId,
  getGuildByUrlId,
  listChannels,
  listDMThreads,
  listGuilds,
} from "./index";

const NUMERIC = /^\d{17,19}$/;

describe("URL用の数値ID（urlId）", () => {
  it("guild / channel / DM すべてに17〜19桁の数値IDがあり、グローバル一意", () => {
    const urlIds = [
      ...listGuilds().map((guild) => guild.urlId),
      ...listGuilds().flatMap((guild) => listChannels(guild.id).map((channel) => channel.urlId)),
      ...listDMThreads().map((thread) => thread.urlId),
    ];

    expect(urlIds.length).toBeGreaterThan(0);
    for (const urlId of urlIds) {
      expect(urlId).toMatch(NUMERIC);
    }
    expect(new Set(urlIds).size).toBe(urlIds.length);
  });

  it("guild の urlId から解決できる", () => {
    const guild = listGuilds()[0];
    expect(getGuildByUrlId(guild.urlId)?.id).toBe(guild.id);
  });

  it("channel の urlId から解決でき、所属 guild も分かる", () => {
    const guild = listGuilds()[0];
    const channel = listChannels(guild.id)[0];
    expect(getChannelByUrlId(channel.urlId)?.id).toBe(channel.id);
    expect(getChannelByUrlId(channel.urlId)?.guildId).toBe(guild.id);
  });

  it("DM の urlId から解決できる", () => {
    const thread = listDMThreads()[0];
    expect(getDMThreadByUrlId(thread.urlId)?.id).toBe(thread.id);
  });

  it("未知の urlId は undefined", () => {
    expect(getGuildByUrlId("999999999999999999")).toBeUndefined();
    expect(getChannelByUrlId("999999999999999999")).toBeUndefined();
    expect(getDMThreadByUrlId("999999999999999999")).toBeUndefined();
  });

  it("内部の短いIDでは解決しない（URLに短いIDを出さない担保）", () => {
    expect(getGuildByUrlId("s1")).toBeUndefined();
    expect(getChannelByUrlId("s1-general")).toBeUndefined();
    expect(getDMThreadByUrlId("t2")).toBeUndefined();
  });
});
