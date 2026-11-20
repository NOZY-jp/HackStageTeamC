import type { Character, CharacterId, Nickname } from "./types";

/**
 * 人物の台帳。値は Issue #76「名前とハンドルの確定」と Google Docs の人物設定に合わせる。
 *
 * 本名はここに置かない（#76: 本名は作中に出さない。到達するのは順序8・10だけ）。
 * 彼女は作中では「MaiMai」。リョウは本名を知らないので、作中のテキストで本名由来の名前を使わない。
 */
export const characters: Record<CharacterId, Character> = {
  ryo: {
    id: "ryo",
    name: "リョウ",
    age: 22,
    firstPerson: "僕",
    secondPerson: "君",
    note: "主人公（プレイヤー）。大学4年、内定済みで卒論だけ。フランクでお人好し、ゲームで熱くなると口が悪くなる。人見知りをこじらせている",
    accounts: { discordName: "琥珀", discordId: "kohakunchos0117", twixer: "kohakunchos0117" },
  },
  maimai: {
    id: "maimai",
    name: "MaiMai",
    age: 23,
    firstPerson: "わたし",
    note: "彼女。2018年1月（中3）に MHW で攻略ブログを始め、2020年に閉鎖して note（leaf）へ。2021年の受験で更新停止。2025年春にワイルズでリョウと出会い、2026年8月から付き合っている。突然連絡が途絶える",
    accounts: {
      discordName: "MaiMai",
      discordId: "maimaimaimai",
      discordOldName: "hunter_denden",
      discordOldId: "hunter_denden3243",
      twixer: "mai2mai2",
      twixerOld: "hunter_denden0102",
      leaf: "maimai",
      blog: "でんでんの狩猟記録",
      talkup: "（本名。作中のテキストには出さない）",
    },
  },
  kai: {
    id: "kai",
    name: "カイ",
    age: 23,
    firstPerson: "俺",
    note: "協力者に見える友人（黒幕。作中では明かさない）。大学院2年、内定複数。さわやかで草食系だが頼もしい。リョウとは別ゲームで知り合い、その後 MaiMai と知り合った",
    accounts: { discordName: "χ", discordId: "imperial_chi", twixer: "kaiser018023071" },
  },
  kanon: {
    id: "kanon",
    name: "かのん",
    age: 23,
    firstPerson: "私",
    note: "MaiMai のいちばんの親友（中学・高校が同じ、BFF）。大学進学以来、自然に疎遠",
    accounts: { twixer: "kanon__dayo" },
  },
};

/**
 * 呼び名（#76「呼称」「名前セット最終確定」）。
 * 「でんちゃん」は祖母だけが使っていた昔の呼び方で、旧ブログのコメント欄に一度だけ残っている（#79）。
 * カイが「でんちゃんと呼ぶと喜ぶ」と助言し、リョウがそれを使ってしまうのが事件の発端。
 */
export const nicknames: Nickname[] = [
  {
    of: "maimai",
    text: "まいまい",
    usedBy: ["ryo", "kai"],
    note: "リョウの呼び方（Discord の表示名から）",
  },
  {
    of: "maimai",
    text: "でんちゃん",
    usedBy: ["ryo", "kai"],
    note: "昔の呼び方。カイの助言でリョウが使ってしまう",
  },
];

/** 作中のテキストに出してはいけない語（台本のテストで確認する） */
export const FORBIDDEN_WORDS = ["ゆい", "ゆっちゃん", "服部", "由比"];

export function getCharacter(id: CharacterId): Character {
  return characters[id];
}
