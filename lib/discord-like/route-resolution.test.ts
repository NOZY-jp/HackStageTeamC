import { describe, expect, it } from "vitest";
import { getChannel, getDMThread, getGuild } from "./index";
import { resolveChannelRoute } from "./route-resolution";

const guildUrlId = getGuild("s1")?.urlId ?? "";
const channelUrlId = getChannel("s1-general")?.urlId ?? "";
const threadUrlId = getDMThread("t1")?.urlId ?? "";
const UNKNOWN = "999999999999999999";

describe("resolveChannelRoute", () => {
  it("存在しない DM の urlId は dm-missing（専用の未検出UIを出す）", () => {
    expect(resolveChannelRoute("@me", UNKNOWN)).toEqual({ kind: "dm-missing" });
    // Next は "@me" を "%40me" で渡すことがある
    expect(resolveChannelRoute("%40me", UNKNOWN)).toEqual({ kind: "dm-missing" });
  });

  it("DM の urlId はスレッドに解決する", () => {
    expect(resolveChannelRoute("@me", threadUrlId)).toEqual({ kind: "dm", threadId: "t1" });
  });

  it("存在しないサーバーチャンネルは channel-missing（共通の未検出）", () => {
    expect(resolveChannelRoute(guildUrlId, UNKNOWN)).toEqual({ kind: "channel-missing" });
    expect(resolveChannelRoute(UNKNOWN, channelUrlId)).toEqual({ kind: "channel-missing" });
  });

  it("別サーバーのチャンネルは channel-missing", () => {
    const otherGuild = getGuild("s2");
    const otherChannel = getChannel("s2-general");
    expect(resolveChannelRoute(getGuild("s1")?.urlId ?? "", otherChannel?.urlId ?? "")).toEqual({
      kind: "channel-missing",
    });
    expect(otherGuild && otherChannel).toBeTruthy();
  });

  it("サーバーチャンネルは内部IDに解決する", () => {
    expect(resolveChannelRoute(guildUrlId, channelUrlId)).toEqual({
      kind: "channel",
      guildId: "s1",
      channelId: "s1-general",
    });
  });
});
