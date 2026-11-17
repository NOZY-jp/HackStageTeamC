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
    const messages = listMessages("s1-general");
    expect(messages.length).toBeGreaterThan(0);
    const times = messages.map((message) => message.sentAt);
    expect(times).toEqual([...times].sort());
  });

  it("listDMThreads は lastMessageAt 降順で返す", () => {
    const threads = listDMThreads();
    expect(threads.length).toBe(5);
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
    const before = getChannel("s1-general")?.name;
    const channel = getChannel("s1-general");
    if (channel) {
      channel.name = "書き換え";
    }
    expect(getChannel("s1-general")?.name).toBe(before);

    const messages = listMessages("s1-general");
    const firstBody = messages[0]?.body;
    if (messages[0]) {
      messages[0].body = "書き換え";
    }
    expect(listMessages("s1-general")[0]?.body).toBe(firstBody);

    const guild = getGuild("s1");
    const channelCount = listChannels("s1").length;
    guild?.channels.push({
      id: "injected",
      guildId: "s1",
      name: "注入",
      kind: "text",
      position: 999,
    });
    expect(getChannel("injected")).toBeUndefined();
    expect(listChannels("s1")).toHaveLength(channelCount);
  });
});
