import { describe, expect, it } from "vitest";
import { SELF_USER_ID } from "@/app/(discord-like)/_components/self-user";
import { getMessageImage, OLD_GAMER_ID } from "./data/message-images";
import {
  HAL_HANDLE,
  HAL_NAME,
  KAI_DISPLAY_NAME,
  MAIMAI_HANDLE,
  MAIMAI_NAME,
  OLD_BLOG_ARCHIVE_URL,
  OLD_DISPLAY_NAME,
  OLD_HANDLE,
} from "./data/names";
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
import { listMemberViews } from "./view";

const GUILD_ID = "mhc";
const DM_THREAD_ID = "dm-maimai";
const DISCORD_SCREENSHOT = "screenshot-2026.png";
const OLD_BLOG_IMAGE = "screenshot-2018.png";

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
    expect(byId("dm-maimai-0061")?.body).toBe("読んでみたい");
    expect(byId("dm-maimai-0064")?.authorId).toBe("maimai");
    expect(byId("dm-maimai-0064")?.body).toContain("note");
    expect(byId("dm-maimai-0064")?.body).toMatch(/2020年.*2月|2020-02/);
    // 「前の記事は残してある」は閉鎖済みと矛盾するので書かない
    expect(byId("dm-maimai-0064")?.body).not.toContain("残してある");
    expect(byId("dm-maimai-0063")?.authorId).toBe("hal");
    expect(byId("dm-maimai-0063")?.body).toBe("そうなんだ");
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

  it("カイからの進捗連絡があり、カイは実在する（順序9）", () => {
    const kai = getUser("kai");
    expect(kai?.displayName).toBe(KAI_DISPLAY_NAME);
    const fromKai = serverMessages().filter(
      (message) => message.authorId === "kai" && message.body.includes("進んだ"),
    );
    expect(fromKai.length).toBeGreaterThan(0);
    // 「黒幕」などの答えは書かない
    expect(serverMessages().some((message) => message.body.includes("黒幕"))).toBe(false);
  });

  it("最後のメッセージは「住所を特定しました」で、住所そのものは書かない（順序11）", () => {
    const all = [...serverMessages(), ...dmMessages()].sort((a, b) =>
      a.sentAt.localeCompare(b.sentAt),
    );
    const last = all[all.length - 1];
    expect(last.body).toBe("住所を特定しました");
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

describe("メンバー一覧と順序9のヒント", () => {
  it("一覧にオフラインの旧垢が居て、プロフィールは記事一覧URL", () => {
    const members = listMemberViews();
    const old = members.find((member) => member.handle === OLD_HANDLE);
    expect(old).toBeDefined();
    expect(old?.status).toBe("offline");
    expect(old?.profileUrl).toBe(OLD_BLOG_ARCHIVE_URL);
    expect(old?.profileUrl).toBe("/pochiblo/mylist/k7q2m9d4");
    expect(old?.profileUrl?.endsWith("/")).toBe(false);
    // オンラインとオフラインの両方が居る（見出し分けの前提）
    expect(members.some((member) => member.status !== "offline")).toBe(true);
  });

  it("順序9のヒント語（Facebook / 本名 / 検索）がサーバーの会話にある", () => {
    const text = serverMessages()
      .map((message) => message.body)
      .join(" / ");
    expect(text).toMatch(/facebook/i);
    expect(text).toContain("本名");
    expect(text).toContain("検索");
  });

  it("不自然な漢字の連結（回来・去来・行来など）が無い", () => {
    const all = [...serverMessages(), ...dmMessages()].map((message) => message.body);
    for (const body of all) {
      expect(body).not.toMatch(/回来|去来|行来|来た来/);
    }
  });

  it("同じ言い回しの3連続が無い（募集文の重複コピー防止）", () => {
    const bodies = serverMessages().map((message) => message.body);
    let streak = 1;
    for (let i = 1; i < bodies.length; i += 1) {
      streak = bodies[i] === bodies[i - 1] ? streak + 1 : 1;
      expect(streak).toBeLessThan(3);
    }
  });

  it("募集文に助詞の重複（からから・のの・をを等）が無い", () => {
    const all = [...serverMessages(), ...dmMessages()].map((message) => message.body);
    for (const body of all) {
      expect(body).not.toMatch(/からから|のの|をを|がが|にに|はは/);
    }
  });
});

describe("DM の同一発言の重複（#88）", () => {
  it("同じ発言者が続けて完全に同じ本文を送っていない", () => {
    const messages = dmMessages();
    const offenders: string[] = [];
    for (let i = 1; i < messages.length; i += 1) {
      const prev = messages[i - 1];
      const current = messages[i];
      if (prev.authorId !== current.authorId) continue;
      // 相づち（「うん」→「うん、そうだね」）は正常なので、完全一致だけを重複とみなす
      if (prev.body.trim() === current.body.trim()) {
        offenders.push(`${prev.id} -> ${current.id} "${current.body}"`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("DM は時刻順に並び、同じ人の3連投が無い（スクショの1枚送りまでは許す）", () => {
    const messages = dmMessages();
    for (let i = 1; i < messages.length; i += 1) {
      expect(messages[i].sentAt >= messages[i - 1].sentAt, messages[i].id).toBe(true);
    }
    // 連投は「10分以内の同じ人の続き」とみなす（時間が空けば別の会話）
    const BURST_MS = 10 * 60 * 1000;
    let streak = 1;
    for (let i = 1; i < messages.length; i += 1) {
      const sameAuthor = messages[i].authorId === messages[i - 1].authorId;
      const gap = Date.parse(messages[i].sentAt) - Date.parse(messages[i - 1].sentAt);
      // スクショの1枚送りのように、2連投までは自然に許す（3連投はNG）
      streak = sameAuthor && gap <= BURST_MS ? streak + 1 : 1;
      expect(streak, messages[i].id).toBeLessThan(3);
    }
  });

  it("2026-04-18 23:11 の「休み」のあとに「休み」で始まる発言が続かない", () => {
    const messages = dmMessages();
    const index = messages.findIndex((message) => message.id === "dm-maimai-0065");
    expect(index).toBeGreaterThanOrEqual(0);
    expect(messages[index].body).toBe("休み");
    expect(messages[index + 1]?.id).toBe("dm-maimai-0059");
    expect(messages[index + 1].body.startsWith("休み")).toBe(false);
  });
});
