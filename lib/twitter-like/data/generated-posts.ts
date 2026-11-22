import type { Post, Profile, TwitterUser } from "../types";

/**
 * #248: Twixer のアカウントと投稿を増やすための決定的な生成データ。
 * 乱数は使わず、添字から名前・handle・本文を組み立てる（同じ入力なら常に同じ結果）。
 * 本文は「導入・話題・具体・気持ち」を組み合わせ、完全一致と書き出しの偏りを避ける。
 */

const FAMILY = ["佐伯", "高瀬", "森下", "藤堂", "小野寺", "日向", "朝倉", "桐生", "若林", "真壁"];
const GIVEN = [
  "あかり",
  "ゆうと",
  "みさき",
  "そうた",
  "かなで",
  "りく",
  "ひなた",
  "あおい",
  "けい",
  "つむぎ",
];
const ROMAJI = [
  "akari",
  "yuto",
  "misaki",
  "sota",
  "kanade",
  "riku",
  "hinata",
  "aoi",
  "kei",
  "tsumugi",
];

const BIO = [
  "週末はゲームと散歩。気になったことは最後まで見てしまう。",
  "写真を撮るのが好き。フィルムと digital を行き来しています。",
  "喫茶店めぐりと読書。静かな場所を探しています。",
  "モンハン歴は長いけど、まだまだ下手です。",
  "夜型。深夜の集会所にいます。",
  "カメラとコーヒー。旅先で撮った写真を上げます。",
  "ゲームの話と日常の話を半々で。",
  "装備を考えるのが趣味。強さより使いやすさ。",
  "本と紅茶。積読が増える一方です。",
  "昔のゲームを引っ張り出して遊んでいます。",
];

const OPENERS = [
  "今日は",
  "さっき",
  "さっきまで",
  "帰りに",
  "朝から",
  "昼すぎに",
  "夜になって",
  "土日に",
  "久しぶりに",
  "ふと",
  "仕事のあとで",
  "休みの日に",
  "買い物の途中で",
  "散歩のついでに",
  "寝る前に",
  "起きてすぐ",
  "雨の日に",
  "晴れた日に",
  "夕方に",
  "昼休みに",
  "昨日の夜",
  "今朝",
  "三日前に",
  "一昨日",
  "来週の話だけど",
  "来月の話だけど",
  "また",
  "やっと",
  "ようやく",
  "思ったより",
  "案外",
  "結局",
  "ちょっと",
  "かなり",
  "珍しく",
  "いつも通り",
  "予定外に",
  "予想外に",
  "気づいたら",
  "いつの間にか",
];

const TOPICS = [
  "モンハンのクエスト",
  "ブログの更新",
  "弓の装備",
  "写真コンテスト",
  "でんでん",
  "ストーカー対策",
  "集会所の募集",
  "新しい装備",
  "カメラの設定",
  "喫茶店のメニュー",
  "レポートの締切",
  "ゼミの発表",
  "就活の面接",
  "バイトのシフト",
  "ゲームのアップデート",
  "古いゲーム",
  "散歩のコース",
  "本屋の棚",
  "料理の失敗",
  "洗濯物",
];

/** メモの枚数・件数（整理の話に使う） */
const AMOUNTS = ["十枚", "二十枚", "三十枚", "五件", "十二件", "二十件"];
/** 人・回数（集まりや挑戦の話に使う） */
const COUNTS = ["五人で集まって", "三回目で", "半年ぶりに", "四年ぶりに", "二度目で"];
/** 歩いた場所（散歩の話に使う） */
const SPOTS = [
  "駅前の店",
  "川沿いの道",
  "商店街の端",
  "図書館の席",
  "公園のベンチ",
  "改札の前",
  "河川敷",
  "商店街",
  "坂の上",
  "海までの道",
];
/** 整理が進んだ具合（メモを片づけた話の結び） */
const PROGRESS = [
  "少し進んだ",
  "まだ終わらない",
  "先が見えた",
  "案外まとまった",
  "手が止まった",
  "ようやく片づいた",
];

const FEELINGS = [
  "思ったより楽しかった",
  "少し疲れた",
  "また行きたい",
  "当分いいかな",
  "癖になりそう",
  "ちょっと失敗した",
  "今度こそ",
  "悪くない",
  "想像と違った",
  "ようやく慣れた",
];

const CLUES = [
  "モンハン",
  "ブログ",
  "弓",
  "写真コンテスト",
  "でんでん",
  "ストーカー",
  "集会所",
  "装備",
  "カメラ",
  "喫茶店",
  "レポート",
  "就活",
  // #248: モンハンの語彙で検索しても0択・1択にならないようにする
  "狩猟",
  "レイド",
  "双剣",
  "大剣",
  "太刀",
];

const DATE_START = Date.UTC(2024, 9, 1, 9, 0, 0);

export const generatedUsers: TwitterUser[] = Array.from({ length: 200 }, (_, index) => {
  const family = FAMILY[index % FAMILY.length];
  const given = GIVEN[Math.floor(index / FAMILY.length) % GIVEN.length];
  const romaji = `${ROMAJI[Math.floor(index / FAMILY.length) % ROMAJI.length]}${String(index + 1).padStart(3, "0")}`;
  return {
    id: `tw-gen-${index + 1}`,
    displayName: `${family}${given}`,
    handle: romaji,
    avatarColor: `hsl(${(index * 37) % 360} 45% 45%)`,
  };
});

export const generatedProfiles: Profile[] = generatedUsers.map((user, index) => ({
  userId: user.id,
  bio: BIO[index % BIO.length],
  location: ["東京", "神奈川", "大阪", "京都", "福岡", "名古屋"][index % 6],
  joinedAt: `${2020 + (index % 5)}-0${(index % 9) + 1}-15`,
  followingCount: 20 + ((index * 7) % 180),
  followersCount: 10 + ((index * 11) % 200),
}));

/** 添字から決まる擬似乱数（同じ入力なら常に同じ値。乱数APIは使わない）。 */
const hash = (index: number, salt: number): number => {
  let x = Math.imul(index + salt * 7919, 0x9e3779b1);
  x ^= x >>> 16;
  x = Math.imul(x, 0x85ebca6b);
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35);
  return (x ^ (x >>> 16)) >>> 0;
};
/** 語の一覧から、添字と役割（salt）で決まる1つを選ぶ。 */
const pick = <T>(list: readonly T[], index: number, salt: number): T =>
  list[hash(index, salt) % list.length];

const bodyFor = (index: number, attempt = 0): string => {
  const salt = attempt * 100 + 1;
  const opener = pick(OPENERS, index, salt);
  const topic = pick(TOPICS, index, salt + 1);
  const clue = pick(CLUES, index, salt + 2);
  const amount = pick(AMOUNTS, index, salt + 3);
  const count = pick(COUNTS, index, salt + 4);
  const spot = pick(SPOTS, index, salt + 5);
  const progress = pick(PROGRESS, index, salt + 6);
  const feeling = pick(FEELINGS, index, salt + 7);
  const variant = index % 3;
  if (variant === 0) return `${opener}${topic}の話をした。${count}、${feeling}。`;
  if (variant === 1) return `${opener}${spot}まで歩いた。${topic}のことを考えながら、${feeling}。`;
  return `${opener}${topic}を整理していた。${clue}のメモが${amount}分たまっていて、${progress}。`;
};

const at = (index: number): string => {
  const day = new Date(DATE_START + index * 9 * 60 * 60 * 1000);
  return day.toISOString().replace(".000Z", "+00:00");
};

/** 一度使った本文を避けて、全投稿を一意にする */
const usedBodies = new Set<string>();
const uniqueBodyFor = (index: number): string => {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const body = bodyFor(index, attempt);
    if (!usedBodies.has(body)) {
      usedBodies.add(body);
      return body;
    }
  }
  return `${bodyFor(index, 0)}（${index + 1}）`;
};

export const generatedPosts: Post[] = Array.from({ length: 2000 }, (_, index) => ({
  id: `post-g${String(index + 1).padStart(4, "0")}`,
  authorId: generatedUsers[index % generatedUsers.length].id,
  postedAt: at(index),
  body: uniqueBodyFor(index),
  replyCount: 0,
  repostCount: index % 9,
  likeCount: index % 41,
}));
