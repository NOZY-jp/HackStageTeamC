import { describe, expect, it } from "vitest";
import {
  getChannel,
  getGuild,
  getUser,
  listChannels,
  listDMMessages,
  listDMThreads,
  listMessages,
} from "./index";

describe("lib/discord-like のアクセサ", () => {
  it("listMessages は sentAt 昇順で返す", () => {
    const messages = listMessages("mhc-chat");
    expect(messages.length).toBeGreaterThan(0);
    const times = messages.map((message) => message.sentAt);
    expect(times).toEqual([...times].sort());
  });

  it("listDMThreads は lastMessageAt 降順で返す", () => {
    const threads = listDMThreads();
    expect(threads.length).toBe(1);
    const times = threads.map((thread) => thread.lastMessageAt);
    expect(times).toEqual([...times].sort().reverse());
    for (const thread of threads) {
      expect(listDMMessages(thread.id).length).toBeGreaterThan(0);
    }
  });

  it("存在しないIDでは undefined を返す", () => {
    expect(getChannel("missing-channel")).toBeUndefined();
    expect(getGuild("missing-guild")).toBeUndefined();
    expect(getUser("missing-user")).toBeUndefined();
    expect(listMessages("missing-channel")).toEqual([]);
    expect(listChannels("missing-guild")).toEqual([]);
  });

  it("戻り値を書き換えても内部状態が変わらない（深いコピー）", () => {
    const before = getChannel("mhc-chat")?.name;
    const channel = getChannel("mhc-chat");
    if (channel) {
      channel.name = "書き換え";
    }
    expect(getChannel("mhc-chat")?.name).toBe(before);

    const messages = listMessages("mhc-chat");
    const firstBody = messages[0]?.body;
    if (messages[0]) {
      messages[0].body = "書き換え";
    }
    expect(listMessages("mhc-chat")[0]?.body).toBe(firstBody);

    const guild = getGuild("mhc");
    const channelCount = listChannels("mhc").length;
    guild?.channels.push({
      id: "injected",
      urlId: "1099999999999999999",
      guildId: "mhc",
      name: "注入",
      kind: "text",
      position: 999,
    });
    expect(getChannel("injected")).toBeUndefined();
    expect(listChannels("mhc")).toHaveLength(channelCount);
  });
});
