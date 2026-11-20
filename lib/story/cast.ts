import type { CastMember } from "./types";

/**
 * 人物の台帳（試作）。表示名はここだけを正とする。
 * 本名は置かない（本名は順序8で初めて分かる答え）。作中テキストにも出さない。
 */
export const cast: CastMember[] = [
  {
    id: "ryo",
    displayName: "リョウ",
    pronoun: "僕",
    role: "プレイヤー。彼女とゲームで知り合った",
    accounts: [{ platform: "discord", handle: "kohakunchos0117" }],
    oldNames: [],
  },
  {
    id: "mai",
    displayName: "MaiMai",
    pronoun: "わたし",
    role: "ゲームで出会った恋人（2025年）",
    accounts: [
      { platform: "twixer", handle: "mai2mai2" },
      { platform: "twixer", handle: "hunter_denden0102" },
      { platform: "discord", handle: "maimaimaimai" },
      { platform: "discord", handle: "hunter_denden3243" },
      { platform: "leaf", handle: "mai_yoru" },
    ],
    oldNames: [{ name: "でんちゃん", knownBy: ["kanon"] }],
  },
  {
    id: "kai",
    displayName: "カイ",
    pronoun: "俺",
    role: "調査を手伝ってくれる知り合い",
    accounts: [
      { platform: "discord", handle: "imperial_chi" },
      { platform: "twixer", handle: "kaiser018023071" },
    ],
    oldNames: [],
  },
  {
    id: "kanon",
    displayName: "かのん",
    pronoun: "私",
    role: "彼女の中高の大親友",
    accounts: [
      { platform: "twixer", handle: "kanon__dayo" },
      // Discord は正本に値が無いため仮値（分かり次第差し替える）
      { platform: "discord", handle: "kanon_23" },
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
