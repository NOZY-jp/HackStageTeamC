import { describe, expect, it } from "vitest";
import {
  getChannel,
  getDMThread,
  listChannels,
  listDMMessages,
  listMessages,
  loadUntil,
} from "./index";

const firstTextChannel = () => {
  const guildId = "s1";
  const channel = listChannels(guildId).find((candidate) => candidate.kind === "text");
  if (!channel) throw new Error("テキストチャンネルがありません");
  return channel;
};

describe("メッセージのカーソル方式（段階的読み込み）", () => {
  it("before を渡さないときは最新 limit 件を昇順で返す", () => {
    const channel = firstTextChannel();
    const page = listMessages({ channelId: channel.id, limit: 10 });
    expect(page.messages).toHaveLength(10);
    const times = page.messages.map((message) => message.sentAt);
    expect(times).toEqual([...times].sort());

    const all = listMessages({ channelId: channel.id, limit: 1000 });
    expect(page.messages.map((message) => message.id)).toEqual(
      all.messages.slice(-10).map((message) => message.id),
    );
  });

  it("hasMore と nextCursor で1つ前のページに遡れる", () => {
    const channel = firstTextChannel();
    const latest = listMessages({ channelId: channel.id, limit: 10 });
    expect(latest.hasMore).toBe(true);
    expect(latest.nextCursor).toBe(latest.messages[0].id);

    const older = listMessages({
      channelId: channel.id,
      before: latest.nextCursor ?? undefined,
      limit: 10,
    });
    expect(older.messages).toHaveLength(10);
    // 重複せず、すべて latest より古い
    const latestIds = new Set(latest.messages.map((message) => message.id));
    expect(older.messages.every((message) => !latestIds.has(message.id))).toBe(true);
    expect(older.messages[older.messages.length - 1].sentAt <= latest.messages[0].sentAt).toBe(
      true,
    );
  });

  it("先頭まで遡ると hasMore=false・nextCursor=null になる", () => {
    const channel = firstTextChannel();
    const all = listMessages({ channelId: channel.id, limit: 1000 }).messages;
    const page = listMessages({ channelId: channel.id, before: all[0].id, limit: 10 });
    expect(page.messages).toEqual([]);
    expect(page.hasMore).toBe(false);
    expect(page.nextCursor).toBeNull();

    // ちょうど先頭を含むページは hasMore=false
    const head = listMessages({ channelId: channel.id, before: all[10].id, limit: 10 });
    expect(head.messages[0].id).toBe(all[0].id);
    expect(head.hasMore).toBe(false);
    expect(head.nextCursor).toBeNull();
  });

  it("存在しない before は最新ページに戻す（空ページで終端扱いにしない）", () => {
    const channel = firstTextChannel();
    const page = listMessages({ channelId: channel.id, before: "missing-message", limit: 10 });
    const latest = listMessages({ channelId: channel.id, limit: 10 });
    expect(page.messages.map((message) => message.id)).toEqual(
      latest.messages.map((message) => message.id),
    );
    expect(page.hasMore).toBe(true);
    expect(page.nextCursor).toBe(page.messages[0].id);
  });

  it("存在しないチャンネルでも空ページを返す（例外にしない）", () => {
    const page = listMessages({ channelId: "missing-channel" });
    expect(page.messages).toEqual([]);
    expect(page.hasMore).toBe(false);
    expect(page.nextCursor).toBeNull();
  });

  it("DM も同じ形で切り出せる", () => {
    const thread = getDMThread("t1");
    expect(thread).toBeDefined();
    const latest = listDMMessages({ threadId: "t1", limit: 5 });
    expect(latest.messages).toHaveLength(5);
    expect(latest.hasMore).toBe(true);
    const older = listDMMessages({
      threadId: "t1",
      before: latest.nextCursor ?? undefined,
      limit: 5,
    });
    expect(older.messages).toHaveLength(5);
    const latestIds = new Set(latest.messages.map((message) => message.id));
    expect(older.messages.every((message) => !latestIds.has(message.id))).toBe(true);
  });

  it("DM でも不正なカーソルは最新ページに戻す", () => {
    const page = listDMMessages({ threadId: "t1", before: "missing-message", limit: 5 });
    const latest = listDMMessages({ threadId: "t1", limit: 5 });
    expect(page.messages.map((message) => message.id)).toEqual(
      latest.messages.map((message) => message.id),
    );
    expect(page.hasMore).toBe(latest.hasMore);
  });

  it("loadUntil は指定メッセージを含むところまで遡って返す", () => {
    const channel = firstTextChannel();
    const all = listMessages({ channelId: channel.id, limit: 1000 }).messages;
    const target = all[3];

    const loaded = loadUntil({ channelId: channel.id, messageId: target.id, chunkSize: 10 });
    expect(loaded.found).toBe(true);
    expect(loaded.messages.some((message) => message.id === target.id)).toBe(true);
    expect(loaded.messages[0].id).toBe(all[0].id);
    expect(loaded.messages[loaded.messages.length - 1].id).toBe(all[all.length - 1].id);
    expect(loaded.hasMore).toBe(false);
  });

  it("loadUntil が途中までしか遡らないときは hasMore=true を返す", () => {
    const channel = firstTextChannel();
    const all = listMessages({ channelId: channel.id, limit: 1000 }).messages;
    const target = all[all.length - 15];

    const loaded = loadUntil({ channelId: channel.id, messageId: target.id, chunkSize: 5 });
    expect(loaded.found).toBe(true);
    expect(loaded.messages[0].id).not.toBe(all[0].id);
    expect(loaded.hasMore).toBe(true);
    expect(loaded.nextCursor).toBe(loaded.messages[0].id);
  });

  it("loadUntil は存在しないIDでは found=false", () => {
    const channel = firstTextChannel();
    const loaded = loadUntil({ channelId: channel.id, messageId: "missing-message", chunkSize: 5 });
    expect(loaded.found).toBe(false);
    expect(loaded.hasMore).toBe(false);
  });

  it("loadUntil は DM スレッドにも使える", () => {
    const all = listDMMessages({ threadId: "t1", limit: 1000 }).messages;
    const target = all[2];
    const loaded = loadUntil({ threadId: "t1", messageId: target.id, chunkSize: 4 });
    expect(loaded.found).toBe(true);
    expect(loaded.messages.some((message) => message.id === target.id)).toBe(true);
  });

  it("返した配列を書き換えても内部状態は変わらない", () => {
    const channel = firstTextChannel();
    const page = listMessages({ channelId: channel.id, limit: 3 });
    const firstBody = page.messages[0].body;
    page.messages[0].body = "書き換え";
    expect(listMessages({ channelId: channel.id, limit: 3 }).messages[0].body).toBe(firstBody);
    expect(getChannel(channel.id)?.id).toBe(channel.id);
  });
});
