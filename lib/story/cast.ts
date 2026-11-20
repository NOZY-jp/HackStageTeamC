import type { CastMember } from "./types";

/**
 * 人物の台帳（試作）。表示名はここだけを正とする。
 * 本名は置かない（作中でも本文には出さない）。
 */
export const cast: CastMember[] = [
  {
    id: "ryo",
    displayName: "リョウ",
    pronoun: "僕",
    role: "プレイヤー。昔のブログの書き手",
    accounts: [
      { platform: "pochiblo", handle: "denden0102" },
      { platform: "discord", handle: "kohakunchos0117" },
    ],
    oldNames: [{ name: "でんちゃん", knownBy: ["kanon"] }],
  },
  {
    id: "yui",
    displayName: "ゆい",
    pronoun: "私",
    role: "写真コンテストで受賞した同級生",
    accounts: [
      { platform: "leaf", handle: "mai_yoru" },
      { platform: "twixer", handle: "yui_photo" },
    ],
    oldNames: [],
  },
  {
    id: "kai",
    displayName: "カイ",
    pronoun: "俺",
    role: "Discord で連絡してくる調査役",
    accounts: [
      { platform: "discord", handle: "kai_lab" },
      { platform: "twixer", handle: "kai_dev" },
    ],
    oldNames: [],
  },
  {
    id: "kanon",
    displayName: "かのん",
    pronoun: "あたし",
    role: "昔の呼び方を知っている幼なじみ",
    accounts: [
      { platform: "discord", handle: "kanon_23" },
      { platform: "pochiblo", handle: "kanon_days" },
    ],
    oldNames: [],
  },
];

/** 台帳から1人引く。 */
export function getCastMember(id: CastMember["id"]): CastMember | undefined {
  return cast.find((member) => member.id === id);
}

/** 表示名（台帳に無いIDはIDのまま返す）。 */
export function castName(id: CastMember["id"]): string {
  return getCastMember(id)?.displayName ?? id;
}
