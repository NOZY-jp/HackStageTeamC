import type { CastMember } from "./types";

/**
 * 人物の台帳（試作）。表示名・呼称はここだけを正とする。
 * 本名は置かない（本名は順序8で初めて分かる答え）。作中テキストにも出さない。
 * ブログや SNS の名前は、当時その人が使っていた名前を accounts に置く。
 */
export const cast: CastMember[] = [
  {
    id: "ryo",
    displayName: "リョウ",
    pronoun: "僕",
    role: "プレイヤー。彼女とゲームで知り合った",
    accounts: [
      // Discord の表示名は「琥珀」
      { platform: "discord", handle: "kohakunchos0117", displayName: "琥珀" },
      { platform: "twixer", handle: "kohakunchos0117" },
    ],
    oldNames: [],
  },
  {
    id: "mai",
    displayName: "MaiMai",
    // 作中の呼称（ハンドルから「まいまい」へ）
    nickname: "まいまい",
    pronoun: "わたし",
    role: "ゲームで出会った恋人（2025年）",
    accounts: [
      // 旧ブログ（ぽちブロ）の書き手。表示名は「でんでん」
      { platform: "pochiblo", handle: "denden0102", displayName: "でんでん" },
      { platform: "twixer", handle: "mai2mai2" },
      { platform: "twixer", handle: "hunter_denden0102", displayName: "hunter_denden" },
      { platform: "discord", handle: "maimaimaimai" },
      { platform: "discord", handle: "hunter_denden3243", displayName: "hunter_denden" },
      { platform: "leaf", handle: "mai_yoru" },
    ],
    // 呼び名の根拠は旧ブログのコメント欄1件だけ（知っている人としての紐付けはしない）
    oldNames: [
      {
        name: "でんちゃん",
        knownBy: [],
        source: "旧ブログのコメント欄に祖母が一度だけ書いた",
      },
    ],
  },
  {
    id: "kai",
    displayName: "カイ",
    pronoun: "俺",
    role: "調査を手伝ってくれる知り合い",
    accounts: [
      // Discord の表示名は「χ」
      { platform: "discord", handle: "imperial_chi", displayName: "χ" },
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

/** 作中で使う呼称（無ければ表示名）。 */
export function castCallName(id: CastMember["id"]): string {
  const member = getCastMember(id);
  return member?.nickname ?? member?.displayName ?? id;
}
