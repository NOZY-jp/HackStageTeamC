import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getGuild } from "../../index";
import { dmThreads } from "../dm-threads";
import { FRIEND_MEMBER_IDS, MHC_MEMBER_IDS, UNIV_MEMBER_IDS } from "../members";
import { users } from "../users";
import { FRIEND_MEMBERS, UNIV_MEMBERS } from "./members";

const ids = (list: readonly { id: string }[]) => new Set(list.map((user) => user.id));

describe("サーバーごとのメンバー定義（#163）", () => {
  it("人数が決めた数（初期 mhc 259・univ 120・friend 20）と一致し、重複しない", () => {
    expect(MHC_MEMBER_IDS).toHaveLength(259);
    expect(UNIV_MEMBER_IDS).toHaveLength(120);
    expect(FRIEND_MEMBER_IDS).toHaveLength(20);
    for (const list of [MHC_MEMBER_IDS, UNIV_MEMBER_IDS, FRIEND_MEMBER_IDS]) {
      expect(new Set(list).size).toBe(list.length);
    }
    expect(getGuild("mhc")?.memberIds).toEqual(MHC_MEMBER_IDS);
    expect(getGuild("univ")?.memberIds).toEqual(UNIV_MEMBER_IDS);
    expect(getGuild("friend")?.memberIds).toEqual(FRIEND_MEMBER_IDS);
  });

  it("全メンバーが users（400人）に存在し、発言者は必ずそのサーバーのメンバー", () => {
    const known = ids(users);
    expect(users).toHaveLength(400);
    for (const [guildId, list] of [
      ["mhc", MHC_MEMBER_IDS],
      ["univ", UNIV_MEMBER_IDS],
      ["friend", FRIEND_MEMBER_IDS],
    ] as const) {
      for (const id of list) {
        expect(known.has(id), `${guildId}:${id}`).toBe(true);
      }
    }
    // 発言する人は、そのサーバーのメンバーに入っている
    for (const id of UNIV_MEMBERS) expect(UNIV_MEMBER_IDS).toContain(id);
    for (const id of FRIEND_MEMBERS) expect(FRIEND_MEMBER_IDS).toContain(id);
    // かのんはどのサーバーにも入れない（面識なし）
    expect(MHC_MEMBER_IDS).not.toContain("kanon");
    expect(UNIV_MEMBER_IDS).not.toContain("kanon");
    expect(FRIEND_MEMBER_IDS).not.toContain("kanon");
  });

  it("DM の相手は、その人が居るサーバーのメンバーでもある", () => {
    const mhc = new Set(MHC_MEMBER_IDS);
    const univ = new Set(UNIV_MEMBER_IDS);
    const friend = new Set(FRIEND_MEMBER_IDS);
    const thread = (id: string) => dmThreads.find((item) => item.id === id);
    // モンハン仲間・オンラインの知人（kai は第四章で旧垢報告後に動的参加するため初期は gunlance のみ）
    expect(mhc.has("gunlance")).toBe(true);
    expect(mhc.has("kai")).toBe(false);
    expect(thread("dm-kai")?.participantIds).toContain("kai");
    // 学科の先輩・後輩
    for (const id of ["ootsuka", "hayashi", "yama"]) {
      expect(univ.has(id), id).toBe(true);
    }
    // リア友
    for (const id of ["taku", "jun", "miyu"]) {
      expect(friend.has(id), id).toBe(true);
    }
    // 恋人（MaiMai）は mhc の常連でもある
    expect(thread("dm-maimai")?.participantIds).toContain("maimai");
    expect(mhc.has("maimai")).toBe(true);
  });

  it("旧 generators への参照が data 配下に残っていない", () => {
    const root = join(process.cwd(), "lib/discord-like/data");
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) walk(path);
        else if (/\.(ts|tsx)$/.test(name) && !name.endsWith(".test.ts")) files.push(path);
      }
    };
    walk(root);
    const offenders = files.filter((path) =>
      /from\s+["'][^"']*generators\//.test(readFileSync(path, "utf8")),
    );
    expect(offenders.map((path) => path.replace(process.cwd(), ""))).toEqual([]);
  });
});
