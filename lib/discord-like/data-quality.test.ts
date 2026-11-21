import { describe, expect, it } from "vitest";
import { FRIEND_MEMBERS, UNIV_MEMBERS } from "./data/guilds/members";
import { ACQUAINTANCE_NOTES } from "./data/people/acquaintance-notes";
import { FIRST_SEEN } from "./generators/people-rules";
import { listChannels, listDMMessages, listDMThreads, listGuilds, listMessages } from "./index";
import { QUALITY_LIMITS as Q } from "./test-thresholds";
import type { Message } from "./types";

const allMessages = (): Message[] => {
  const server = listGuilds().flatMap((guild) =>
    listChannels(guild.id)
      // voice も含める（VC の開始/終了も sentAt 一意の対象）
      .flatMap((channel) => listMessages({ channelId: channel.id, limit: 5000 }).messages),
  );
  const dm = listDMThreads().flatMap(
    (thread) => listDMMessages({ threadId: thread.id, limit: 5000 }).messages,
  );
  return [...server, ...dm];
};

const messages = allMessages();

describe("Discord の会話データの配置", () => {
  it("mhc の発言者は許可リストの人物だけ、kai は静的ログでは dm-kai 以外で発言せず、mhc では0件（D10）", () => {
    let kaiInMhc = 0;
    for (const guild of listGuilds()) {
      if (guild.id !== "mhc") continue;
      for (const channel of listChannels(guild.id).filter((item) => item.kind === "text")) {
        for (const message of listMessages({ channelId: channel.id, limit: 5000 }).messages) {
          expect(Q.mhcSpeakers, `${message.id} ${message.authorId}`).toContain(message.authorId);
          if (message.authorId === "kai") kaiInMhc += 1;
        }
      }
    }
    expect(kaiInMhc).toBeLessThanOrEqual(Q.kaiInMhc);
    for (const message of messages) {
      if (message.authorId === "kai") {
        expect(message.channelId, message.id).toBe("dm-kai");
      }
    }
  });

  it("メッセージの ID と sentAt はサーバー・DM をまたいで一意", () => {
    const ids = new Set<string>();
    const times = new Set<string>();
    for (const message of messages) {
      expect(ids.has(message.id), message.id).toBe(false);
      expect(times.has(message.sentAt), `${message.id} ${message.sentAt}`).toBe(false);
      ids.add(message.id);
      times.add(message.sentAt);
    }
  });

  it("#144: friend は現実の友達だけで、MaiMai・かのんが発言しない", () => {
    const friend = listGuilds().find((guild) => guild.id === "friend");
    expect(friend).toBeDefined();
    const speakers = new Set<string>();
    for (const channel of listChannels("friend")) {
      for (const message of listMessages({ channelId: channel.id, limit: 5000 }).messages) {
        expect(FRIEND_MEMBERS, message.id).toContain(message.authorId);
        speakers.add(message.authorId);
      }
    }
    expect(speakers.has("maimai")).toBe(false);
    expect(speakers.has("kanon")).toBe(false);
  });

  it("#144: univ は hal＋同級生18＋先輩6＋後輩9 の34人が発言する", () => {
    const speakers = new Set<string>();
    for (const channel of listChannels("univ")) {
      for (const message of listMessages({ channelId: channel.id, limit: 5000 }).messages) {
        expect(UNIV_MEMBERS, message.id).toContain(message.authorId);
        if (message.system !== true) speakers.add(message.authorId);
      }
    }
    expect(speakers.size).toBe(34);
  });

  it("#144: 初出より前に発言しない（docs の初出と一致）", () => {
    const firstSeen = new Map<string, string>();
    for (const [id, note] of Object.entries(ACQUAINTANCE_NOTES)) {
      const match = /^(\d{4})-(\d{2})/.exec(note.firstSeen);
      if (match) firstSeen.set(id, `${match[1]}-${match[2]}`);
    }
    // パースが空振りしていないこと（タイポでテストが素通りするのを防ぐ）
    expect(firstSeen.size).toBeGreaterThanOrEqual(30);
    expect(FIRST_SEEN.ishikawa).toBe("2026-01");
    for (const message of messages) {
      const seen = firstSeen.get(message.authorId);
      if (!seen) continue;
      expect(
        message.sentAt.slice(0, 7) >= seen,
        `${message.id} ${message.authorId} ${message.sentAt} < ${seen}`,
      ).toBe(true);
    }
  });

  it("voice チャンネルには入室/退出のシステムメッセージしか無い（#129 で VoiceSession を追加）", () => {
    for (const guild of listGuilds()) {
      for (const channel of listChannels(guild.id).filter((item) => item.kind === "voice")) {
        for (const message of listMessages({ channelId: channel.id, limit: 500 }).messages) {
          expect(message.system, message.id).toBe(true);
        }
      }
    }
  });
});

describe("本文の品質（旧 data-quality から復活）", () => {
  it("本文に生成の穴（undefined・null・NaN・{{ }}・TODO）が無い", () => {
    const bad = messages.filter((message) =>
      /undefined|null|NaN|\{\{|\}\}|TODO|FIXME/.test(message.body),
    );
    expect(bad.map((message) => message.id)).toEqual([]);
  });

  it("英語の定型文が無い（ASCII だけの長い本文を作らない）", () => {
    const asciiOnly = messages.filter(
      (message) => message.body.length >= 20 && /^[ -~]+$/.test(message.body.trim()),
    );
    // リンクだけの投稿は本文ではなく URL として扱う
    const bad = asciiOnly.filter((message) => !/^https?:\/\/\S+$/.test(message.body.trim()));
    expect(bad.map((message) => message.id)).toEqual([]);
  });

  it("8文字以上の本文のユニーク率は95%以上（短い相槌は重複してよい）", () => {
    const bodies = messages
      .filter((message) => message.system !== true && message.body.length >= 8)
      .map((message) => message.body);
    expect(bodies.length).toBeGreaterThan(500);
    expect(new Set(bodies).size / bodies.length).toBeGreaterThanOrEqual(0.95);
  });

  it("サーバーごと・月ごとに発言があり、月の後半にも続く", () => {
    for (const guild of listGuilds()) {
      const days = new Map<string, Set<string>>();
      for (const channel of listChannels(guild.id).filter((item) => item.kind === "text")) {
        for (const message of listMessages({ channelId: channel.id, limit: 5000 }).messages) {
          const month = message.sentAt.slice(0, 7);
          const set = days.get(month) ?? new Set<string>();
          set.add(message.sentAt.slice(0, 10));
          days.set(month, set);
        }
      }
      for (const [month, set] of days) {
        // すべての月を見る。最初の月（2025-11）だけはサーバーを作った時期なので1日から
        if (month < "2025-11" || month > "2026-11") continue;
        expect(set.size, `${guild.id} ${month}`).toBeGreaterThanOrEqual(
          month === "2025-11" ? 1 : 3,
        );
        if (month >= "2025-12") {
          expect(
            [...set].some((day) => Number(day.slice(8, 10)) >= 20),
            `${guild.id} ${month} 後半`,
          ).toBe(true);
        }
      }
    }
  });
});
