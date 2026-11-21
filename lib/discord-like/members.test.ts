import { describe, expect, it } from "vitest";
import { FORBIDDEN_WORDS } from "../story/characters";
import { acquaintances } from "./data/people/acquaintances";
import {
  FRIEND_MEMBERS,
  UNIV_JUNIORS,
  UNIV_MEMBERS,
  UNIV_PEERS,
  UNIV_SENIORS,
} from "./data/guilds/members";
import { getGuild, getUser, listChannels, listGuilds, listMessages } from "./index";
import { listMemberViews } from "./view";

/** 学科に所属するアンネームド（同級生・先輩・後輩）。 */
const UNIV_ACQUAINTANCE_IDS = [...UNIV_PEERS, ...UNIV_SENIORS, ...UNIV_JUNIORS];
/** リア友（friend で発言する hal 以外の6人）。 */
const FRIEND_ONLY_IDS = FRIEND_MEMBERS.filter((id) => id !== "hal");

describe("サーバーごとのメンバー（#163）", () => {
  it("memberIds は実在するユーザーで、サーバー内で重複しない", () => {
    for (const guild of listGuilds()) {
      expect(new Set(guild.memberIds).size, guild.id).toBe(guild.memberIds.length);
      for (const id of guild.memberIds) {
        expect(getUser(id), `${guild.id}:${id}`).toBeDefined();
      }
    }
  });

  it("人数は docs/discord/03-people.md §5 の表どおり（mhc 260・univ 120・friend 20）", () => {
    expect(getGuild("mhc")?.memberIds).toHaveLength(260);
    expect(getGuild("univ")?.memberIds).toHaveLength(120);
    expect(getGuild("friend")?.memberIds).toHaveLength(20);
  });

  it("mhc はモンハンコミュニティの人だけ（旧垢・常連・背景ハンター）", () => {
    const ids = new Set(getGuild("mhc")?.memberIds);
    // 必須: 発言する常連＋オフラインの旧垢
    for (const id of [
      "hal",
      "maimai",
      "kai",
      "gunlance",
      "mina",
      "haruka",
      "slime",
      "jijii",
      "master",
      "denden",
    ]) {
      expect(ids.has(id), id).toBe(true);
    }
    // 学科の人・リア友は mhc に出ない
    for (const id of [...UNIV_ACQUAINTANCE_IDS, ...FRIEND_ONLY_IDS]) {
      expect(ids.has(id), id).toBe(false);
    }
    // かのんはどのサーバーにも入れない
    expect(ids.has("kanon")).toBe(false);
    // 残りは背景アカウントだけ（ネームドは上の10人ちょうど）
    const namedIds = (getGuild("mhc")?.memberIds ?? []).filter((id) => !id.startsWith("bg-"));
    expect([...namedIds].sort()).toEqual(
      [
        "hal",
        "maimai",
        "kai",
        "gunlance",
        "mina",
        "haruka",
        "slime",
        "jijii",
        "master",
        "denden",
      ].sort(),
    );
  });

  it("univ は hal＋学科の全員＋背景だけ（mhc の人・リア友・MaiMai・かのんは出ない）", () => {
    const ids = new Set(getGuild("univ")?.memberIds);
    for (const id of UNIV_MEMBERS) {
      expect(ids.has(id), id).toBe(true);
    }
    for (const id of [
      "maimai",
      "kai",
      "gunlance",
      "mina",
      "haruka",
      "slime",
      "jijii",
      "master",
      "denden",
      "kanon",
      ...FRIEND_ONLY_IDS,
    ]) {
      expect(ids.has(id), id).toBe(false);
    }
  });

  it("friend は hal＋リア友6＋背景だけ（MaiMai・かのん・学科の人は出ない）", () => {
    const ids = new Set(getGuild("friend")?.memberIds);
    for (const id of FRIEND_MEMBERS) {
      expect(ids.has(id), id).toBe(true);
    }
    for (const id of [
      "maimai",
      "kanon",
      "gunlance",
      "mina",
      "haruka",
      "slime",
      "jijii",
      "master",
      "kai",
      "denden",
      ...UNIV_ACQUAINTANCE_IDS,
    ]) {
      expect(ids.has(id), id).toBe(false);
    }
  });

  it("学科・リア友の背景メンバーはサーバーに合った名前（ハンター名は mhc だけ）", () => {
    const hunterName = (id: string) => {
      const user = getUser(id);
      return (
        /^ハンター\d{4}$/.test(user?.displayName ?? "") || /^hunter_\d{4}$/.test(user?.handle ?? "")
      );
    };
    const backgroundOf = (guildId: string) =>
      (getGuild(guildId)?.memberIds ?? []).filter((id) => id.startsWith("bg-"));
    // mhc の背景はハンター名のまま（モンハン鯖では自然）
    for (const id of backgroundOf("mhc")) {
      expect(hunterName(id), `mhc:${id}`).toBe(true);
    }
    // 学科・リア友ではハンター名を使わない
    for (const id of [...backgroundOf("univ"), ...backgroundOf("friend")]) {
      expect(hunterName(id), id).toBe(false);
    }
  });

  it("メンバーの表示名・ハンドルに禁止語（本名の読みのカタカナ・ローマ字含む）が入らない", () => {
    for (const guild of listGuilds()) {
      for (const id of guild.memberIds) {
        const user = getUser(id);
        for (const word of FORBIDDEN_WORDS) {
          const lowered = word.toLowerCase();
          expect(
            user?.displayName?.toLowerCase().includes(lowered) ?? false,
            `${guild.id}:${id} displayName「${word}」`,
          ).toBe(false);
          expect(
            user?.handle?.toLowerCase().includes(lowered) ?? false,
            `${guild.id}:${id} handle「${word}」`,
          ).toBe(false);
        }
      }
    }
    // 大小文字混在の反例（"Hattori"・"HATTORI_0408" 系）もこの比較で検出できる
    for (const mixed of ["Hattori", "HATTORI_0408", "hattori_1231"]) {
      expect(mixed.toLowerCase().includes("hattori"), mixed).toBe(true);
    }
  });

  it("発言する人は必ずそのサーバーのメンバー（全チャンネル・全メッセージ）", () => {
    for (const guild of listGuilds()) {
      const members = new Set(guild.memberIds);
      for (const channel of listChannels(guild.id)) {
        for (const message of listMessages({ channelId: channel.id, limit: 5000 }).messages) {
          expect(members.has(message.authorId), `${channel.id}:${message.authorId}`).toBe(true);
        }
      }
    }
  });

  it("hal（自分）は全サーバーに入っている", () => {
    for (const guild of listGuilds()) {
      expect(guild.memberIds, guild.id).toContain("hal");
    }
  });
});

describe("listMemberViews（ギルド単位のメンバー一覧）", () => {
  it("表示中ギルドのメンバーだけを memberIds の順で返す", () => {
    for (const guild of listGuilds()) {
      const members = listMemberViews(guild.id);
      expect(
        members.map((member) => member.id),
        guild.id,
      ).toEqual(guild.memberIds);
      expect(members).toHaveLength(guild.memberIds.length);
    }
  });

  it("mhc の一覧に hunter_denden（オフライン・記事一覧リンクつき）が居る", () => {
    const old = listMemberViews("mhc").find((member) => member.id === "denden");
    expect(old).toBeDefined();
    expect(old?.displayName).toBe("hunter_denden");
    expect(old?.handle).toBe("hunter_denden3243");
    expect(old?.status).toBe("offline");
    expect(old?.profileUrl).toBe("/pochiblo/mylist/k7q2m9d4");
  });

  it("mhc の一覧には学科・リア友・かのんが出ない", () => {
    const ids = new Set(listMemberViews("mhc").map((member) => member.id));
    for (const id of [...UNIV_ACQUAINTANCE_IDS, ...FRIEND_ONLY_IDS, "kanon"]) {
      expect(ids.has(id), id).toBe(false);
    }
  });

  it("知らないギルドIDなら空", () => {
    expect(listMemberViews("no-such-guild")).toEqual([]);
  });

  it("学科のアンネームド全員が univ の一覧に居る", () => {
    const ids = new Set(listMemberViews("univ").map((member) => member.id));
    for (const user of acquaintances.filter((item) => UNIV_ACQUAINTANCE_IDS.includes(item.id))) {
      expect(ids.has(user.id), user.id).toBe(true);
    }
  });
});
