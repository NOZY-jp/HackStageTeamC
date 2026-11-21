import { describe, expect, it } from "vitest";
import { SELF_USER_ID } from "@/app/(discord-like)/_components/self-user";
import {
  availableBeats,
  choose,
  completeBeat,
  completedChats,
  initialState,
  setFlag,
} from "@/lib/story";
import { getMessageImage, OLD_GAMER_ID } from "./data/message-images";
import {
  channelMessages as staticChannelMessages,
  dmMessages as staticDmMessages,
} from "./data/messages";
import {
  HAL_HANDLE,
  HAL_NAME,
  MAIMAI_HANDLE,
  MAIMAI_NAME,
  OLD_BLOG_ARCHIVE_URL,
  OLD_DISPLAY_NAME,
  OLD_HANDLE,
} from "./data/names";
import { GAME_NOW } from "./data/now";
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
import { buildSearchIndex } from "./search";
import { VOLUME_LIMITS } from "./test-thresholds";
import type { Message } from "./types";
import { listMemberViews } from "./view";

const GUILD_ID = "mhc";
const DM_THREAD_ID = "dm-maimai";
const DISCORD_SCREENSHOT = "screenshot-2026.png";
const OLD_BLOG_IMAGE = "screenshot-2018.png";

const inPeriod = (sentAt: string, from: string, to: string): boolean => {
  const day = sentAt.slice(0, 10);
  return day >= from && day <= to;
};

const dmMessages = (): Message[] =>
  listDMMessages({ threadId: DM_THREAD_ID, limit: Number.POSITIVE_INFINITY }).messages;
const serverMessages = (): Message[] =>
  listChannels(GUILD_ID)
    .filter((channel) => channel.kind === "text")
    .flatMap((channel) => listMessages({ channelId: channel.id, limit: 1000 }).messages);
/** サーバー全体（現状は mhc のみ。3サーバーになっても合算で数えられる）。 */
const allServerMessages = (): Message[] =>
  listGuilds().flatMap((guild) =>
    listChannels(guild.id)
      .filter((channel) => channel.kind === "text")
      .flatMap((channel) => listMessages({ channelId: channel.id, limit: 2000 }).messages),
  );
/** Discord 全体（全サーバーの text チャンネル＋全 DM スレッド）。#132 以降のサーバーも含む。 */
const discordMessages = (): Message[] => [
  ...allServerMessages(),
  ...listDMThreads().flatMap(
    (thread) => listDMMessages({ threadId: thread.id, limit: 3000 }).messages,
  ),
];

describe("ダミーデータの整合性", () => {
  it("サーバーは決められた数だけあり、旧3サーバーは残っていない", () => {
    const guilds = listGuilds();
    expect(guilds).toHaveLength(VOLUME_LIMITS.guildCount);
    expect(guilds[0].name).toBe("モンハンコミュニティ");
    const names = guilds.map((guild) => guild.name);
    for (const old of ["開発ラボ", "創作サークル", "ゲーム部"]) {
      expect(names).not.toContain(old);
    }
    expect(getGuild("s1")).toBeUndefined();
  });

  it("自分（琥珀）と MaiMai がいて、汎用の「メンバー01」名は残っていない", () => {
    const self = getUser(SELF_USER_ID);
    expect(self?.displayName).toBe(HAL_NAME);
    expect(self?.handle).toBe(HAL_HANDLE);
    const mai = getUser("maimai");
    expect(mai?.displayName).toBe(MAIMAI_NAME);
    expect(mai?.handle).toBe(MAIMAI_HANDLE);

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

  it("DM スレッドは9本（恋人・依頼主・友人・先輩・後輩。#133）", () => {
    const threads = listDMThreads();
    expect(threads.map((thread) => thread.id).sort()).toEqual([
      "dm-gunlance",
      "dm-hayashi",
      "dm-jun",
      "dm-kai",
      DM_THREAD_ID,
      "dm-miyu",
      "dm-ootsuka",
      "dm-taku",
      "dm-yama",
    ]);
    const mai = threads.find((thread) => thread.id === DM_THREAD_ID);
    expect(mai?.participantIds).toEqual([SELF_USER_ID, "maimai"]);
    const kai = threads.find((thread) => thread.id === "dm-kai");
    expect(kai?.participantIds).toEqual([SELF_USER_ID, "kai"]);
    for (const thread of threads) {
      for (const id of thread.participantIds) {
        expect(getUser(id), id).toBeDefined();
      }
    }
  });

  it("DM の発言者は全員そのスレッドの参加者である", () => {
    for (const thread of listDMThreads()) {
      const { messages } = listDMMessages({ threadId: thread.id, limit: Number.POSITIVE_INFINITY });
      for (const message of messages) {
        expect(thread.participantIds, message.id).toContain(message.authorId);
      }
    }
  });

  it("lastMessageAt は最終メッセージと一致し、未読数は自分の発言以降の相手の発言数と一致する", () => {
    for (const thread of listDMThreads()) {
      const messages = listDMMessages({
        threadId: thread.id,
        limit: Number.POSITIVE_INFINITY,
      }).messages;
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
      const messages = listMessages({
        channelId: channel.id,
        limit: Number.POSITIVE_INFINITY,
      }).messages;
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
      }
    }
  });

  it("通話のシステムメッセージは開始と終了が対で、話者は実在する（不在着信は終了扱い）", () => {
    const messages = dmMessages();
    const starts = messages.filter((message) => message.body.includes("通話を開始しました"));
    const ends = [
      ...messages.filter((message) => message.body.includes("通話を終了しました")),
      // 応答が無かった通話も「終了」として数える（#130）
      ...messages.filter((message) => message.body.includes("応答がありませんでした")),
    ];
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

  it("付き合った後は週5日以上やり取りし、空いても3日まで（#130 で新仕様化）", () => {
    // 受入条件そのもの（週5日以上・空き3日まで）を固定する。緩めるとここで落ちる
    expect(VOLUME_LIMITS.datingWeek.minDays).toBe(5);
    expect(VOLUME_LIMITS.datingWeek.maxGapDays).toBe(3);
    const dm = dmMessages();
    const days = [
      ...new Set(
        dm
          .filter((message) => inPeriod(message.sentAt, "2026-09-01", "2026-11-19"))
          .map((message) => message.sentAt.slice(0, 10)),
      ),
    ].sort();
    expect(days.length).toBeGreaterThan(0);

    // 週ごとの日数（日曜始まり）
    const weeks = new Map<string, Set<string>>();
    for (const day of days) {
      const date = new Date(`${day}T00:00:00Z`);
      const weekStart = new Date(date);
      weekStart.setUTCDate(date.getUTCDate() - date.getUTCDay());
      const key = weekStart.toISOString().slice(0, 10);
      const set = weeks.get(key) ?? new Set<string>();
      set.add(day);
      weeks.set(key, set);
    }
    // 月の途中で切れる最初と最後の週は除く（データ端の週は日数が少なくて当然）
    const fullWeeks = [...weeks.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(1, -1);
    for (const [week, weekDays] of fullWeeks) {
      expect(weekDays.size, week).toBeGreaterThanOrEqual(VOLUME_LIMITS.datingWeek.minDays);
    }
    // 連続して空く日数（日付の差 − 1。隣り合う日は 0 日空き）
    let maxGap = 0;
    for (let i = 1; i < days.length; i += 1) {
      const gap = Math.round((Date.parse(days[i]) - Date.parse(days[i - 1])) / 86_400_000) - 1;
      maxGap = Math.max(maxGap, gap);
    }
    expect(maxGap).toBeLessThanOrEqual(VOLUME_LIMITS.datingWeek.maxGapDays);
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

describe("謎解きの手がかり（順序1・4・5・6・9・11）", () => {
  it("旧ハンドルと完全一致するユーザーが、ずっとオフラインで存在する（順序5）", () => {
    const users = [
      "hal",
      "maimai",
      "gunlance",
      "mina",
      "haruka",
      "slime",
      "jijii",
      "master",
      "kai",
      "denden",
    ];
    const old = users.map((id) => getUser(id)).find((user) => user?.handle === OLD_HANDLE);
    expect(old).toBeDefined();
    expect(old?.displayName).toBe(OLD_DISPLAY_NAME);
    expect(old?.status).toBe("offline");
    // 現在の自分のハンドルとは別（同じIDではない）
    expect(getUser(SELF_USER_ID)?.handle).not.toBe(OLD_HANDLE);
  });

  it("そのユーザーのプロフィールは記事一覧URL（トップではない）（順序6）", () => {
    const old = [
      "hal",
      "maimai",
      "gunlance",
      "mina",
      "haruka",
      "slime",
      "jijii",
      "master",
      "kai",
      "denden",
    ]
      .map((id) => getUser(id))
      .find((user) => user?.handle === OLD_HANDLE);
    expect(old?.profileUrl).toBe(OLD_BLOG_ARCHIVE_URL);
    expect(old?.profileUrl?.endsWith("/")).toBe(false);
    expect(old?.profileUrl).toBe(OLD_BLOG_ARCHIVE_URL);
  });

  it("中3の頃の攻略ブログの話が会話にあり、検索語を含む（順序1）", () => {
    const messages = dmMessages();
    const haystack = messages.map((message) => message.body).join(" / ");
    expect(haystack).toContain("中3");
    expect(haystack).toContain("攻略ブログ");
    expect(haystack).toMatch(/note/);
  });

  it("ブログの回想はリョウが問い、MaiMai が自分のこととして答える（#102 指摘）", () => {
    const messages = dmMessages();
    const byId = (id: string) => messages.find((message) => message.id === id);
    // 「中3の頃って何して遊んでた？」はリョウの質問（MaiMai の自問自答にしない）
    expect(byId("dm-maimai-0059")?.authorId).toBe("hal");
    expect(byId("dm-maimai-0060")?.authorId).toBe("maimai");
    expect(byId("dm-maimai-0060")?.body).toContain("攻略ブログ");
    // スクショを貼るのも MaiMai 本人（ゲームの話の流れで、ブログの話より前）
    expect(byId("dm-maimai-0062")?.authorId).toBe("maimai");
    expect(byId("dm-maimai-0062")?.body).not.toContain("なつかしい");
    const shotOrder = messages.findIndex((message) => message.id === "dm-maimai-0062");
    const blogOrder = messages.findIndex((message) => message.id === "dm-maimai-0059");
    expect(shotOrder).toBeGreaterThanOrEqual(0);
    expect(shotOrder).toBeLessThan(blogOrder);
    // ブログは閉鎖済み（2020-02 に note へ移行）として運ぶ。リョウは聞かされていない知識を先に言わない
    expect(byId("dm-maimai-0061")?.authorId).toBe("hal");

    expect(byId("dm-maimai-0064")?.authorId).toBe("maimai");
    expect(byId("dm-maimai-0064")?.body).toContain("note");
    expect(byId("dm-maimai-0064")?.body).toMatch(/2020年.*2月|2020-02/);
    // 「前の記事は残してある」は閉鎖済みと矛盾するので書かない
    expect(byId("dm-maimai-0064")?.body).not.toContain("残してある");
  });

  it("IDが違うスクショが添付されている（順序4・本文で説明しない）", () => {
    const messages = dmMessages();
    const withImage = messages.filter((message) =>
      (message.attachments ?? []).some((attachment) => attachment.kind === "image"),
    );
    expect(withImage.length).toBeGreaterThan(0);
    const explained = messages.filter((message) =>
      /古いアカウント|別のアカウント|IDが違/.test(message.body),
    );
    expect(explained).toEqual([]);
  });

  it("ログに住所そのものを書かない", () => {
    const all = discordMessages();
    expect(all.some((message) => /丁目|番地|号室/.test(message.body))).toBe(false);
  });
});

describe("名前の差し替え（#76 の確定値）", () => {
  it("旧垢は現在のどのハンドルとも一致しない（別ID）", () => {
    const handles = [
      "hal",
      "maimai",
      "gunlance",
      "mina",
      "haruka",
      "slime",
      "jijii",
      "master",
      "kai",
      "denden",
      "kanon",
    ]
      .map((id) => getUser(id)?.handle)
      .filter((handle): handle is string => Boolean(handle));
    expect(handles).toContain(OLD_HANDLE);
    expect(handles).toContain(HAL_HANDLE);
    expect(handles).toContain(MAIMAI_HANDLE);
    expect(OLD_HANDLE).not.toBe(HAL_HANDLE);
    expect(OLD_HANDLE).not.toBe(MAIMAI_HANDLE);
  });

  it("旧垢の連鎖（ブログ → 旧Twixer → 旧Discord）が矛盾しない", () => {
    // ブログ名「でんでんの狩猟記録」に連なる旧垢のハンドル（別PFの旧アカウントを経由）
    expect(OLD_HANDLE.startsWith("hunter_denden")).toBe(true);
    expect(OLD_DISPLAY_NAME).toBe("hunter_denden");
    expect(OLD_BLOG_ARCHIVE_URL).toBe("/pochiblo/mylist/k7q2m9d4");
  });

  it("順序4の向き: Discord のスクショは現ID、旧ブログの画像は旧ID", () => {
    // 画像の実体ではなく、1か所の定義（message-images.ts）で向きを固定する
    const discordImage = getMessageImage(DISCORD_SCREENSHOT);
    expect(discordImage.owner).toBe("current");
    expect(discordImage.handle).toBe(MAIMAI_HANDLE);
    expect(discordImage.handle).not.toBe(OLD_GAMER_ID);

    const blogImage = getMessageImage(OLD_BLOG_IMAGE);
    expect(blogImage.owner).toBe("old");
    expect(blogImage.handle).toBe(OLD_GAMER_ID);
    expect(blogImage.handle).not.toBe(MAIMAI_HANDLE);
    // 旧ブログの画像に現在のハンドルは写らない
    expect(blogImage.handle).not.toBe(HAL_HANDLE);
  });
});

describe("メンバー一覧", () => {
  it("一覧にオフラインの旧垢が居て、プロフィールは記事一覧URL", () => {
    const members = listMemberViews(GUILD_ID);
    const old = members.find((member) => member.handle === OLD_HANDLE);
    expect(old).toBeDefined();
    expect(old?.status).toBe("offline");
    expect(old?.profileUrl).toBe(OLD_BLOG_ARCHIVE_URL);
    expect(old?.profileUrl).toBe("/pochiblo/mylist/k7q2m9d4");
    expect(old?.profileUrl?.endsWith("/")).toBe(false);
    // オンラインとオフラインの両方が居る（見出し分けの前提）
    expect(members.some((member) => member.status !== "offline")).toBe(true);
  });
});

describe("量と会話の構造（#154・#119）", () => {
  it("通数が決めた範囲に収まり、DM とサーバーの両方がある", () => {
    const dm = listDMThreads().flatMap(
      (thread) => listDMMessages({ threadId: thread.id, limit: 5000 }).messages,
    );
    const server = listGuilds().flatMap((guild) =>
      listChannels(guild.id).flatMap(
        (channel) => listMessages({ channelId: channel.id, limit: 5000 }).messages,
      ),
    );
    const maimai = listDMMessages({ threadId: "dm-maimai", limit: 5000 }).messages.length;
    expect(maimai).toBeGreaterThanOrEqual(VOLUME_LIMITS.dmMaimai.min);
    expect(maimai).toBeLessThanOrEqual(VOLUME_LIMITS.dmMaimai.max);
    expect(dm.length).toBeGreaterThanOrEqual(VOLUME_LIMITS.dmTotal.min);
    expect(dm.length).toBeLessThanOrEqual(VOLUME_LIMITS.dmTotal.max);
    expect(server.length).toBeGreaterThanOrEqual(VOLUME_LIMITS.serverTotal.min);
    expect(server.length).toBeLessThanOrEqual(VOLUME_LIMITS.serverTotal.max);
    expect(listDMThreads()).toHaveLength(VOLUME_LIMITS.dmThreads);
  });

  it("月ごとに会話があり、1か月に偏っていない（傾向）", () => {
    const all = [
      ...listGuilds().flatMap((guild) =>
        listChannels(guild.id).flatMap(
          (channel) => listMessages({ channelId: channel.id, limit: 5000 }).messages,
        ),
      ),
      ...listDMThreads().flatMap(
        (thread) => listDMMessages({ threadId: thread.id, limit: 5000 }).messages,
      ),
    ];
    const months = new Map<string, number>();
    for (const message of all) {
      const month = message.sentAt.slice(0, 7);
      months.set(month, (months.get(month) ?? 0) + 1);
    }
    // 2025-11 から 2026-11 まで、抜けた月が無い
    const expected: string[] = [];
    for (let year = 2025, month = 11; year < 2027; ) {
      expected.push(`${year}-${String(month).padStart(2, "0")}`);
      if (year === 2026 && month === 11) break;
      month += 1;
      if (month === 13) {
        month = 1;
        year += 1;
      }
    }
    for (const month of expected) {
      expect(months.get(month) ?? 0, month).toBeGreaterThanOrEqual(50);
    }
    const busiest = Math.max(...expected.map((month) => months.get(month) ?? 0));
    expect(busiest / all.length).toBeLessThanOrEqual(0.2);
  });

  it("どのチャンネルも一人の独白になっていない", () => {
    for (const guild of listGuilds()) {
      for (const channel of listChannels(guild.id).filter((item) => item.kind === "text")) {
        const list = listMessages({ channelId: channel.id, limit: 5000 }).messages.filter(
          (message) => message.system !== true,
        );
        if (list.length < 10) continue;
        expect(new Set(list.map((message) => message.authorId)).size, channel.id).toBeGreaterThan(
          1,
        );
      }
    }
    for (const thread of listDMThreads()) {
      const list = listDMMessages({ threadId: thread.id, limit: 5000 }).messages.filter(
        (message) => message.system !== true,
      );
      expect(new Set(list.map((message) => message.authorId)).size, thread.id).toBeGreaterThan(1);
    }
  });

  it("静的ログ・検索に、カイの進捗助言と結末が無い", () => {
    const plot = /本名で検索|でんちゃん|住所を特定しました|例の件、どこまで進んだ|使い回してる/;
    const staticMessages = [
      ...Object.values(staticDmMessages).flat(),
      ...Object.values(staticChannelMessages).flat(),
    ];
    expect(staticMessages.filter((message) => plot.test(message.body))).toEqual([]);
    expect(buildSearchIndex().documents.filter((doc) => plot.test(doc.body))).toEqual([]);
  });

  it("静的ログはすべてゲームの現在より前", () => {
    const all = [
      ...listGuilds().flatMap((guild) =>
        listChannels(guild.id).flatMap(
          (channel) => listMessages({ channelId: channel.id, limit: 5000 }).messages,
        ),
      ),
      ...listDMThreads().flatMap(
        (thread) => listDMMessages({ threadId: thread.id, limit: 5000 }).messages,
      ),
    ];
    for (const message of all) {
      expect(Date.parse(message.sentAt), message.id).toBeLessThan(Date.parse(GAME_NOW));
    }
  });
});

describe("カイの進捗は進行のときだけ読める（#119）", () => {
  it("進捗が未達なら、カイの助言のビートは始まらない", () => {
    expect(availableBeats(initialState).some((beat) => beat.place === "discord:dm-kai")).toBe(
      false,
    );
    expect(completedChats(initialState)).toEqual([]);
  });

  it("達成するとカイの助言がビートで届き、結末は選んだときだけ残る", () => {
    const atName = setFlag(initialState, "s08-real-name");
    const contact = availableBeats(atName).find((beat) => beat.place === "discord:dm-kai");
    if (!contact) throw new Error("カイの連絡が始まらない");
    const afterContact = completeBeat(atName, contact);
    expect(completedChats(afterContact)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ from: "kai", text: expect.stringContaining("本名で検索") }),
      ]),
    );
    // 結末は選択するまで出ない
    expect(completedChats(afterContact).some((chat) => chat.text === "住所を特定しました")).toBe(
      false,
    );
    const atMatch = setFlag(afterContact, "s10-talkup-match");
    const report = availableBeats(atMatch).find((beat) => beat.place === "discord:dm-kai");
    if (!report?.choices) throw new Error("結末の選択肢がない");
    const ended = choose(atMatch, report, "send");
    expect(completedChats(ended)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ from: "ryo", text: "住所を特定しました" }),
      ]),
    );
  });
});

describe("会話の多様性と文章（main から戻した検査）", () => {
  it("一言だけの日・通話に移る日・長文の日が混ざっている", () => {
    const all = [
      ...listGuilds().flatMap((guild) =>
        listChannels(guild.id).flatMap(
          (channel) => listMessages({ channelId: channel.id, limit: 5000 }).messages,
        ),
      ),
      ...listDMThreads().flatMap(
        (thread) => listDMMessages({ threadId: thread.id, limit: 5000 }).messages,
      ),
    ];
    const byDay = new Map<string, { count: number; long: boolean; call: boolean }>();
    for (const message of all) {
      const day = message.sentAt.slice(0, 10);
      const entry = byDay.get(day) ?? { count: 0, long: false, call: false };
      entry.count += 1;
      entry.long ||= message.body.length >= 40;
      entry.call ||= message.body.includes("通話を開始しました");
      byDay.set(day, entry);
    }
    const days = [...byDay.values()];
    expect(days.filter((day) => day.count === 1).length).toBeGreaterThan(0);
    expect(days.filter((day) => day.call).length).toBeGreaterThan(0);
    expect(days.filter((day) => day.long).length).toBeGreaterThan(0);
  });

  it("通話は夜〜深夜に始まり、早朝4〜6時台には始まらない", () => {
    const all = [
      ...Object.values(staticChannelMessages).flat(),
      ...Object.values(staticDmMessages).flat(),
    ].filter((message) => message.body.includes("通話を開始しました"));
    expect(all.length).toBeGreaterThan(5);
    const hours = all.map((message) => Number(message.sentAt.slice(11, 13)));
    expect(
      hours.filter((hour) => hour >= 19 || hour <= 2).length / hours.length,
    ).toBeGreaterThanOrEqual(0.5);
    expect(hours.some((hour) => hour >= 4 && hour < 7)).toBe(false);
  });

  it("後半ほど DM が濃くなる（月平均で後半が前半の1.5倍以上）", () => {
    const dm = listDMThreads().flatMap(
      (thread) => listDMMessages({ threadId: thread.id, limit: 5000 }).messages,
    );
    const months = new Map<string, number>();
    for (const message of dm) {
      const month = message.sentAt.slice(0, 7);
      months.set(month, (months.get(month) ?? 0) + 1);
    }
    const sorted = [...months.entries()].sort(([a], [b]) => a.localeCompare(b));
    const half = Math.floor(sorted.length / 2);
    const average = (rows: [string, number][]) =>
      rows.reduce((sum, [, count]) => sum + count, 0) / rows.length;
    const first = average(sorted.slice(0, half));
    const second = average(sorted.slice(half));
    expect(second / first).toBeGreaterThanOrEqual(1.5);
  });

  it("不自然な漢字の連結（回来・去来・行来）が無い", () => {
    const all = [
      ...Object.values(staticChannelMessages).flat(),
      ...Object.values(staticDmMessages).flat(),
    ];
    const bad = all.filter((message) =>
      /(?:^|[^0-9一二三四五六七八九十])回来|去来|行来/.test(message.body),
    );
    expect(bad.map((message) => message.id)).toEqual([]);
  });

  it("同じ本文が3通続かない（募集文のコピー防止）", () => {
    for (const [channelId, list] of Object.entries(staticChannelMessages)) {
      for (let i = 2; i < list.length; i += 1) {
        const same = list[i].body === list[i - 1].body && list[i].body === list[i - 2].body;
        expect(same, `${channelId} ${list[i].id}`).toBe(false);
      }
    }
  });

  it("募集文に助詞の重複（をを・がが・にに）が無い", () => {
    const lfg = listMessages({ channelId: "mhc-lfg", limit: 5000 }).messages;
    const bad = lfg.filter((message) => /をを|がが|にに|からから/.test(message.body));
    expect(bad.map((message) => message.id)).toEqual([]);
  });
});
