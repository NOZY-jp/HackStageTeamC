import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { listChannels, listDMMessages, listDMThreads, listGuilds, listMessages } from "./index";

/**
 * docs/discord/02-timeline-volume.md の台本内訳と、実データの通数を突き合わせる。
 * 文書全体の部分一致ではなく、行を抽出してセル単位で比べる（別の行の数値では通らない）。
 */
const doc = readFileSync(resolve(process.cwd(), "docs/discord/02-timeline-volume.md"), "utf8");

const cellOf = (labelPattern: RegExp): { count: number; line: string } => {
  const line = doc.split("\n").find((candidate) => labelPattern.test(candidate));
  if (!line) throw new Error(`docs/02 に行がありません: ${labelPattern}`);
  const cells = line.split("|").map((cell) => cell.trim());
  const value = cells[2]?.replace(/[*,\s]/g, "");
  if (!value || !/^\d+$/.test(value))
    throw new Error(`docs/02 の通数が数値ではありません: ${line}`);
  return { count: Number(value), line };
};

const dmCount = (threadId: string): number =>
  listDMMessages({ threadId, limit: 5000 }).messages.length;
const guildCount = (guildId: string): number =>
  listChannels(guildId).reduce(
    (sum, channel) => sum + listMessages({ channelId: channel.id, limit: 5000 }).messages.length,
    0,
  );

const dmThreads = listDMThreads();
const dmTotal = dmThreads.reduce((sum, thread) => sum + dmCount(thread.id), 0);
const serverTotal = listGuilds().reduce((sum, guild) => sum + guildCount(guild.id), 0);

describe("docs/02 の台本内訳は実データと一致する", () => {
  it("DM の各行（まいまい・カイ・その他）が実測と一致する", () => {
    expect(cellOf(/^\|\s*`dm-maimai`/).count).toBe(dmCount("dm-maimai"));
    expect(cellOf(/^\|\s*`dm-kai`/).count).toBe(dmCount("dm-kai"));
    const others = dmThreads
      .filter((thread) => thread.id !== "dm-maimai" && thread.id !== "dm-kai")
      .reduce((sum, thread) => sum + dmCount(thread.id), 0);
    expect(cellOf(/^\|\s*その他のDM/).count).toBe(others);
  });

  it("サーバーの各行（mhc・学科・いつメン）が実測と一致する", () => {
    expect(cellOf(/^\|\s*モンハンコミュニティ/).count).toBe(guildCount("mhc"));
    expect(cellOf(/^\|\s*◯◯大学/).count).toBe(guildCount("univ"));
    expect(cellOf(/^\|\s*いつメン/).count).toBe(guildCount("friend"));
  });

  it("小計と合計が実測と一致する", () => {
    expect(cellOf(/^\|\s*\*\*DM 小計\*\*/).count).toBe(dmTotal);
    expect(cellOf(/^\|\s*\*\*サーバー 小計\*\*/).count).toBe(serverTotal);
    expect(cellOf(/^\|\s*\*\*合計\*\*/).count).toBe(dmTotal + serverTotal);
  });

  it("行数（9スレッド・mhc 7ch・16テキストch）が実データと一致する", () => {
    expect(dmThreads).toHaveLength(9);
    expect(cellOf(/^\|\s*\*\*DM 小計\*\*/).line).toContain("9スレッド");
    const mhcText = listChannels("mhc").filter((channel) => channel.kind === "text");
    expect(mhcText).toHaveLength(7);
    const serverText = listGuilds().flatMap((guild) =>
      listChannels(guild.id).filter((channel) => channel.kind === "text"),
    );
    expect(serverText).toHaveLength(16);
    const serverRow = cellOf(/^\|\s*\*\*サーバー 小計\*\*/).line;
    expect(serverRow).toContain("16テキストch");
    expect(serverRow).toContain("mhc 7ch");
  });
});
