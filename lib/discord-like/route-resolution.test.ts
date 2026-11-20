import { describe, expect, it } from "vitest";
import { getChannel, getDMThread, getGuild } from "./index";
import { resolveChannelRoute, resolveDmCallRoute } from "./route-resolution";

const guildUrlId = getGuild("mhc")?.urlId ?? "";
const channelUrlId = getChannel("mhc-chat")?.urlId ?? "";
const threadUrlId = getDMThread("dm-maimai")?.urlId ?? "";
const UNKNOWN = "999999999999999999";

describe("resolveChannelRoute", () => {
  it("存在しない DM の urlId は dm-missing（専用の未検出UIを出す）", () => {
    expect(resolveChannelRoute("@me", UNKNOWN)).toEqual({ kind: "dm-missing" });
    // Next は "@me" を "%40me" で渡すことがある
    expect(resolveChannelRoute("%40me", UNKNOWN)).toEqual({ kind: "dm-missing" });
  });

  it("DM の urlId はスレッドに解決する", () => {
    expect(resolveChannelRoute("@me", threadUrlId)).toEqual({ kind: "dm", threadId: "dm-maimai" });
  });

  it("存在しないサーバーチャンネルは channel-missing（共通の未検出）", () => {
    expect(resolveChannelRoute(guildUrlId, UNKNOWN)).toEqual({ kind: "channel-missing" });
    expect(resolveChannelRoute(UNKNOWN, channelUrlId)).toEqual({ kind: "channel-missing" });
  });

  it("サーバーIDが一致しない urlId の組み合わせは channel-missing", () => {
    const channel = getChannel("mhc-chat");
    expect(channel).toBeTruthy();
    // 実在するチャンネルでも、サーバーIDが別なら解決しない
    expect(resolveChannelRoute(UNKNOWN, channel?.urlId ?? "")).toEqual({ kind: "channel-missing" });
    expect(resolveChannelRoute(guildUrlId, UNKNOWN)).toEqual({ kind: "channel-missing" });
  });

  it("サーバーチャンネルは内部IDに解決する", () => {
    expect(resolveChannelRoute(guildUrlId, channelUrlId)).toEqual({
      kind: "channel",
      guildId: "mhc",
      channelId: "mhc-chat",
    });
  });
});

describe("DM の通話URL（#137）", () => {
  it("@me の DM は通話のルートに解決できる", () => {
    expect(resolveDmCallRoute("@me", threadUrlId)).toEqual({
      kind: "dm-call",
      threadId: "dm-maimai",
    });
    // "@me" は URL エンコードされて渡ることがある
    expect(resolveDmCallRoute("%40me", threadUrlId)).toEqual({
      kind: "dm-call",
      threadId: "dm-maimai",
    });
  });

  it("存在しない DM・サーバーのチャンネルは通話に解決しない", () => {
    expect(resolveDmCallRoute("@me", "9999")).toEqual({ kind: "missing" });
    const guildUrlId = getGuild("mhc")?.urlId ?? "";
    const channelUrlId = getChannel("mhc-vc-1")?.urlId ?? "";
    expect(resolveDmCallRoute(guildUrlId, channelUrlId)).toEqual({ kind: "missing" });
  });
});
