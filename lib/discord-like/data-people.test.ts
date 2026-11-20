import fs from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { ONLINE_USER_IDS, SPEAKING_USER_IDS, users } from "./data/people";
import { ACQUAINTANCE_NOTES } from "./data/people/acquaintance-notes";
import { acquaintances } from "./data/people/acquaintances";
import { buildBackgroundUsers } from "./data/people/background";
import { named } from "./data/people/named";
import { listChannels, listDMMessages, listDMThreads, listMessages } from "./index";

const OTHER_PREFIXES = [
  "hal",
  "maimai",
  "gunlance",
  "mina",
  "haruka",
  "slime",
  "jijii",
  "master",
  "kai",
  "kanon",
];

/** 全会話（サーバーの公開チャンネル＋全部の DM）の authorId。 */
function allAuthorIds(): string[] {
  const guildMessages = listChannels("mhc")
    .filter((channel) => channel.kind === "text")
    .flatMap((channel) => listMessages({ channelId: channel.id, limit: 2000 }).messages);
  const dmMessages = listDMThreads().flatMap(
    (thread) => listDMMessages({ threadId: thread.id, limit: 2000 }).messages,
  );
  return [...guildMessages, ...dmMessages].map((message) => message.authorId);
}

describe("サーバーのメッセージ集計単位（#132）", () => {
  const textCount = (guildId: string) =>
    listChannels(guildId)
      .filter((channel) => channel.kind === "text")
      .reduce(
        (total, channel) =>
          total + listMessages({ channelId: channel.id, limit: 5000 }).messages.length,
        0,
      );
  const voiceCount = (guildId: string) =>
    listChannels(guildId)
      .filter((channel) => channel.kind === "voice")
      .reduce(
        (total, channel) =>
          total + listMessages({ channelId: channel.id, limit: 5000 }).messages.length,
        0,
      );

  it("text の合計は 2,690（mhc 1,570・univ 700・friend 420）", () => {
    expect(textCount("mhc")).toBe(1570);
    expect(textCount("univ")).toBe(700);
    expect(textCount("friend")).toBe(420);
    expect(textCount("mhc") + textCount("univ") + textCount("friend")).toBe(2690);
  });

  it("VC の入室/退出システムメッセージは voice チャンネルにだけある（univ 6・friend 2）", () => {
    expect(voiceCount("univ")).toBe(6);
    expect(voiceCount("friend")).toBe(2);
    expect(voiceCount("mhc")).toBe(0);
    for (const guildId of ["univ", "friend"]) {
      for (const channel of listChannels(guildId).filter((item) => item.kind === "voice")) {
        for (const message of listMessages({ channelId: channel.id, limit: 100 }).messages) {
          expect(message.system, message.id).toBe(true);
          expect(message.body, message.id).toMatch(/通話を(開始|終了)しました/);
        }
      }
    }
  });
});

describe("人物データ400人（#128）", () => {
  it("全部で400人・オンライン30人・発言する50人", () => {
    expect(users).toHaveLength(400);
    expect(users.filter((user) => user.status === "online")).toHaveLength(30);
    expect(ONLINE_USER_IDS).toHaveLength(30);
    // ネームド10（denden を除く）＋アンネームド39＋denden
    expect(SPEAKING_USER_IDS).toHaveLength(50);
    expect(SPEAKING_USER_IDS).toContain("denden");
    expect(new Set(SPEAKING_USER_IDS).size).toBe(50);
    expect(SPEAKING_USER_IDS).toEqual(expect.arrayContaining(acquaintances.map((user) => user.id)));
  });

  it("背景350人は発言しない（全会話を走査）", () => {
    const authors = allAuthorIds();
    const backgroundIds = new Set(
      users.filter((user) => user.id.startsWith("bg-")).map((u) => u.id),
    );
    expect(backgroundIds.size).toBe(350);
    expect(authors.filter((id) => backgroundIds.has(id))).toEqual([]);
    // 会話に出るのは発言する50人の範囲だけ
    const speakers = new Set(SPEAKING_USER_IDS);
    for (const id of new Set(authors)) {
      expect(speakers.has(id), id).toBe(true);
    }
  });

  it("ID・ハンドル・表示名は一意", () => {
    for (const key of ["id", "handle", "displayName"] as const) {
      const values = users.map((user) => user[key]);
      expect(new Set(values).size, key).toBe(values.length);
    }
  });

  it("並びは決定的（2回作っても同じ）", () => {
    expect(buildBackgroundUsers()).toEqual(buildBackgroundUsers());
    expect(users.map((user) => user.id)).toEqual(
      [...named, ...acquaintances, ...buildBackgroundUsers()].map((u) => u.id),
    );
  });

  it("既存11人の値は変えていない・旧ハンドルは1か所だけ", () => {
    expect(named.map((user) => user.id)).toEqual([
      ...OTHER_PREFIXES.slice(0, 9),
      "denden",
      "kanon",
    ]);
    expect(named.find((user) => user.id === "denden")?.handle).toBe("hunter_denden3243");
    expect(users.filter((user) => user.handle === "hunter_denden3243")).toHaveLength(1);
    for (const id of OTHER_PREFIXES) {
      expect(
        named.some((user) => user.id === id),
        id,
      ).toBe(true);
    }
  });

  it("docs/discord/03-people.md の39人の表はコードと一字一句一致する", async () => {
    const doc = await fs.readFile("docs/discord/03-people.md", "utf8");
    expect(acquaintances).toHaveLength(39);
    // Biome が表の桁を揃えるので、空白を1つに潰してから突き合わせる（文字は変えない）
    const normalize = (line: string) => line.replace(/\s+/g, " ").trim();
    const section = doc.slice(doc.indexOf("### 39人の表"));
    const rows = section
      .split("\n")
      .filter((line) => line.startsWith("|"))
      .map(normalize)
      .filter((line) => /^\| `[a-z0-9_]+` \|/.test(line));
    expect(rows).toHaveLength(39);
    for (const user of acquaintances) {
      const note = ACQUAINTANCE_NOTES[user.id];
      expect(note, user.id).toBeDefined();
      const row = normalize(
        `| \`${user.id}\` | ${user.displayName} | \`${user.handle}\` | ${note.calledByMe} / ${note.callsMe} | ${note.relation} | ${note.quirk} | ${note.frequency} | ${note.firstSeen} |`,
      );
      expect(rows, user.id).toContain(row);
    }
  });

  it("アンネームドは本名（漢字フルネーム）を持たない・呼び名も表と一致", () => {
    for (const user of acquaintances) {
      // 表示名は名字ベースのカタカナ or あだ名（漢字を含まない）
      expect(user.displayName, user.id).not.toMatch(/[一-龠]/);
      expect(user.handle, user.id).toMatch(/^[a-z0-9_]+$/);
      const note = ACQUAINTANCE_NOTES[user.id];
      expect(note.calledByMe.length).toBeGreaterThan(0);
      expect(note.callsMe.length).toBeGreaterThan(0);
    }
  });
});
