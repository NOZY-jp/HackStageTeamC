import { describe, expect, it } from "vitest";
import { SELF_USER_ID } from "@/app/(discord-like)/_components/self-user";
import {
  getChannel,
  getGuild,
  getUser,
  listChannels,
  listDMMessages,
  listDMThreads,
  listGuilds,
  listMessages,
  listVoiceStates,
} from "./index";
import type { Message } from "./types";

const GUILD_ID = "mhc";
const DM_THREAD_ID = "dm-maimai";

const PERIODS = [
  { key: "1期", from: "2025-02-01", to: "2025-05-31", ratio: 1 / 9 },
  { key: "2期", from: "2025-06-01", to: "2026-05-31", ratio: 1 / 9 },
  { key: "3期", from: "2026-06-01", to: "2026-07-31", ratio: 4 / 6 },
  { key: "4期", from: "2026-08-01", to: "2026-08-31", ratio: null },
  { key: "5期", from: "2026-09-01", to: "2026-11-19", ratio: 7 / 3 },
];

const inPeriod = (sentAt: string, from: string, to: string): boolean => {
  const day = sentAt.slice(0, 10);
  return day >= from && day <= to;
};

const dmMessages = (): Message[] =>
  listDMMessages({ threadId: DM_THREAD_ID, limit: 1000 }).messages;
const serverMessages = (): Message[] =>
  listChannels(GUILD_ID)
    .filter((channel) => channel.kind === "text")
    .flatMap((channel) => listMessages({ channelId: channel.id, limit: 1000 }).messages);

describe("ダミーデータの整合性", () => {
  it("サーバーは「モンハンコミュニティ」1つだけで、旧3サーバーは残っていない", () => {
    const guilds = listGuilds();
    expect(guilds).toHaveLength(1);
    expect(guilds[0].name).toBe("モンハンコミュニティ");
    const names = guilds.map((guild) => guild.name);
    for (const old of ["開発ラボ", "創作サークル", "ゲーム部"]) {
      expect(names).not.toContain(old);
    }
    expect(getGuild("s1")).toBeUndefined();
  });

  it("Hal（自分）と MaiMai がいて、汎用の「メンバー01」名は残っていない", () => {
    const self = getUser(SELF_USER_ID);
    expect(self?.displayName).toBe("Hal");
    expect(self?.handle).toBe("skill5hot1202");
    const mai = getUser("maimai");
    expect(mai?.displayName).toBe("MaiMai");
    expect(mai?.handle).toBe("maimai1110");

    const members = listChannels(GUILD_ID).length > 0 ? getUser("gunlance") : undefined;
    expect(members).toBeDefined();

    const all = [
      self,
      mai,
      getUser("gunlance"),
      getUser("mina"),
      getUser("haruka"),
      getUser("slime"),
      getUser("jiji"),
    ];
    for (const user of all) {
      expect(user?.displayName ?? "").not.toMatch(/メンバー0\d/);
    }
    const handles = ["hal", "maimai", "gunlance", "mina", "haruka", "slime", "jijii", "master"].map(
      (id) => getUser(id)?.handle,
    );
    expect(handles.every((handle) => typeof handle === "string" && handle.length > 0)).toBe(true);
    expect(new Set(handles).size).toBe(handles.length);
  });

  it("DM スレッドは MaiMai との1件だけ", () => {
    const threads = listDMThreads();
    expect(threads).toHaveLength(1);
    const thread = threads[0];
    expect(thread.id).toBe(DM_THREAD_ID);
    expect(thread.participantIds).toEqual([SELF_USER_ID, "maimai"]);
    for (const id of thread.participantIds) {
      expect(getUser(id)).toBeDefined();
    }
  });

  it("lastMessageAt は最終メッセージと一致し、未読数は自分の発言以降の相手の発言数と一致する", () => {
    for (const thread of listDMThreads()) {
      const messages = listDMMessages({ threadId: thread.id, limit: 1000 }).messages;
      expect(messages.length).toBeGreaterThan(0);
      expect(thread.lastMessageAt).toBe(messages[messages.length - 1].sentAt);

      const lastMine = messages.map((message) => message.authorId).lastIndexOf(SELF_USER_ID);
      const unread = messages
        .slice(lastMine + 1)
        .filter((message) => message.authorId !== SELF_USER_ID).length;
      expect(thread.unreadCount ?? 0).toBe(unread);
    }
  });

  it("チャンネルの未読数は、そのチャンネルのメッセージ数以下", () => {
    for (const channel of listChannels(GUILD_ID)) {
      expect(channel.unreadCount ?? 0).toBeLessThanOrEqual(
        listMessages({ channelId: channel.id, limit: 1000 }).messages.length,
      );
    }
  });

  it("すべての発言者は実在し、テキストチャンネルの発言だけが入っている", () => {
    const textChannelIds = new Set(
      listChannels(GUILD_ID)
        .filter((channel) => channel.kind === "text")
        .map((channel) => channel.id),
    );
    for (const channel of listChannels(GUILD_ID)) {
      const messages = listMessages({ channelId: channel.id, limit: 1000 }).messages;
      for (const message of messages) {
        expect(getUser(message.authorId)).toBeDefined();
        expect(textChannelIds.has(message.channelId)).toBe(true);
      }
    }
    for (const message of dmMessages()) {
      expect(getUser(message.authorId)).toBeDefined();
      expect(message.channelId).toBe(DM_THREAD_ID);
    }
  });

  it("各スレッド・チャンネル内の時刻は昇順で、ID は重複しない", () => {
    const groups = [
      dmMessages(),
      ...listChannels(GUILD_ID).map(
        (channel) => listMessages({ channelId: channel.id, limit: 1000 }).messages,
      ),
    ];
    const ids = new Set<string>();
    for (const messages of groups) {
      const times = messages.map((message) => message.sentAt);
      expect(times).toEqual([...times].sort());
      for (const message of messages) {
        expect(ids.has(message.id)).toBe(false);
        ids.add(message.id);
        expect(message.sentAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00\+09:00$/);
      }
    }
  });

  it("通話のシステムメッセージは開始と終了が対で、話者は実在する", () => {
    const messages = dmMessages();
    const starts = messages.filter((message) => message.body.includes("通話を開始しました"));
    const ends = messages.filter((message) => message.body.includes("通話を終了しました"));
    expect(starts.length).toBeGreaterThan(0);
    expect(starts.length).toBe(ends.length);
    for (const message of [...starts, ...ends]) {
      expect(message.system).toBe(true);
      expect(getUser(message.authorId)).toBeDefined();
      expect(message.body.startsWith(getUser(message.authorId)?.displayName ?? "-")).toBe(true);
    }
    // 開始のあとに終了が来る
    const firstStart = messages.findIndex((message) => message.body.includes("通話を開始しました"));
    const firstEnd = messages.findIndex((message) => message.body.includes("通話を終了しました"));
    expect(firstStart).toBeGreaterThanOrEqual(0);
    expect(firstEnd).toBeGreaterThan(firstStart);
  });

  it("voice-states は実在するユーザーとボイスチャンネルだけを指す", () => {
    const voiceChannels = listChannels(GUILD_ID).filter((channel) => channel.kind === "voice");
    const states = voiceChannels.flatMap((channel) => listVoiceStates(channel.id));
    expect(states.length).toBeGreaterThan(0);
    for (const channel of voiceChannels) {
      for (const state of listVoiceStates(channel.id)) {
        expect(getUser(state.userId)).toBeDefined();
        expect(getChannel(state.channelId)?.kind).toBe("voice");
        expect(state.joinedAt <= "2026-11-19T23:59:00+09:00").toBe(true);
      }
    }
    // 自分は既定では接続していない
    expect(states.some((state) => state.userId === SELF_USER_ID)).toBe(false);
  });

  it("量は DM 350〜450通、サーバー 700〜900通", () => {
    expect(dmMessages().length).toBeGreaterThanOrEqual(350);
    expect(dmMessages().length).toBeLessThanOrEqual(450);
    expect(serverMessages().length).toBeGreaterThanOrEqual(700);
    expect(serverMessages().length).toBeLessThanOrEqual(900);
  });

  it("期間ごとの 個人:サーバー 比が仕様の±20%に収まる", () => {
    const dm = dmMessages();
    const server = serverMessages();
    for (const period of PERIODS) {
      if (period.ratio === null) continue;
      const dmCount = dm.filter((message) =>
        inPeriod(message.sentAt, period.from, period.to),
      ).length;
      const serverCount = server.filter((message) =>
        inPeriod(message.sentAt, period.from, period.to),
      ).length;
      expect(dmCount).toBeGreaterThan(0);
      expect(serverCount).toBeGreaterThan(0);
      const actual = dmCount / serverCount;
      expect(actual).toBeGreaterThan(period.ratio * 0.8);
      expect(actual).toBeLessThan(period.ratio * 1.2);
    }
  });

  it("付き合った後の期間は毎日やり取りがある", () => {
    const dm = dmMessages();
    const days = new Set(
      dm
        .filter((message) => inPeriod(message.sentAt, "2026-09-01", "2026-11-19"))
        .map((message) => message.sentAt.slice(0, 10)),
    );
    const cursor = new Date("2026-09-01T00:00:00Z");
    const end = new Date("2026-11-19T00:00:00Z");
    const missing: string[] = [];
    while (cursor <= end) {
      const day = cursor.toISOString().slice(0, 10);
      if (!days.has(day)) missing.push(day);
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    expect(missing).toEqual([]);
  });

  it("一言だけの日・通話に移る日・長文の日が混ざっている", () => {
    const dm = dmMessages();
    const byDay = new Map<string, Message[]>();
    for (const message of dm) {
      const day = message.sentAt.slice(0, 10);
      byDay.set(day, [...(byDay.get(day) ?? []), message]);
    }
    const singleMessageDays = [...byDay.values()].filter((messages) => messages.length === 1);
    expect(singleMessageDays.length).toBeGreaterThan(0);

    const callDays = [...byDay.values()].filter((messages) =>
      messages.some((message) => message.body.includes("通話を開始しました")),
    );
    expect(callDays.length).toBeGreaterThan(0);

    // 長く話してから通話へ移る日（発言が多く、通話開始を含む日）がある
    const talkativeCallDays = [...byDay.values()].filter(
      (messages) =>
        messages.length >= 5 &&
        messages.some((message) => message.body.includes("通話を開始しました")),
    );
    expect(talkativeCallDays.length).toBeGreaterThan(0);
  });

  it("旧データのID（u1 / s1 / t1 系）が Discord のデータに残っていない", () => {
    const texts = [
      ...dmMessages().map((message) => `${message.id} ${message.channelId} ${message.authorId}`),
      ...serverMessages().map(
        (message) => `${message.id} ${message.channelId} ${message.authorId}`,
      ),
      ...listGuilds().flatMap((guild) => [
        guild.id,
        ...guild.channels.map((channel) => channel.id),
      ]),
      ...listDMThreads().map((thread) => `${thread.id} ${thread.participantIds.join(",")}`),
    ].join("\n");
    expect(texts).not.toMatch(/(^|\s)(u1|u2|s1|s2|s3|t1|t2)("|,|\s|$)/);
    expect(texts).not.toMatch(/s1-general|s1-vc|t1-\d/);
  });
});
