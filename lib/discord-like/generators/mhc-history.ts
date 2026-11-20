import type { Message } from "../types";

/**
 * #131 の mhc 追加履歴（800通）の生成器。
 *
 * 方針（D9）:
 * - 語彙バンク＋文型のスロット組み合わせで本文を組み立て、**全行ユニーク**を機械的に保証する
 * - 固定 seed の線形合同法で乱数を回すため、**同じ seed なら同じ結果**になる（決定性テストあり）
 * - 各月は「活動日10日以上」かつ「どの活動日にも1通以上」を保証する
 * - 発言者は mhc の9人（kai は D10 の上限5件まで）
 * - 時刻は既存の mhc・DM と衝突しないよう1分ずつずらす
 */

export const MHC_HISTORY_SEED = 131131;

const MONTHS: [string, number][] = [
  ["2025-11", 45],
  ["2025-12", 50],
  ["2026-01", 35],
  ["2026-02", 45],
  ["2026-03", 50],
  ["2026-04", 60],
  ["2026-05", 55],
  ["2026-06", 65],
  ["2026-07", 95],
  ["2026-08", 90],
  ["2026-09", 80],
  ["2026-10", 75],
  ["2026-11", 55],
];

export const MHC_HISTORY_CHANNELS: [string, number][] = [
  ["mhc-lfg", 300],
  ["mhc-chat", 220],
  ["mhc-questions", 90],
  ["mhc-clips", 60],
  ["mhc-gear", 60],
  ["mhc-notice", 20],
  ["mhc-intro", 50],
];

const SPEAKERS = ["hal", "maimai", "gunlance", "mina", "haruka", "slime", "jijii", "master", "kai"];
const REGULARS = ["gunlance", "mina", "haruka", "slime", "jijii"];
export const KAI_LIMIT_IN_MHC = 5;

const P = {
  time: [
    "20時",
    "21時",
    "21時半",
    "22時",
    "22時半",
    "23時",
    "週末の昼",
    "土曜の夜",
    "日曜の午後",
    "今夜",
    "明日の夜",
    "金曜の夜",
  ],
  quest: [
    "リオレウス",
    "タマミツネ",
    "イザリ",
    "ディアブロス",
    "古樹のモリガミ",
    "巨大魚のオオヌシ",
    "歴戦の個体",
    "眠りのマドロミ",
    "月見ヶ原の主",
    "紅色の牙",
  ],
  slot: ["あと1枠", "あと2枠", "あと3枠", "1枠だけ", "あと1人", "残り2席"],
  mood: ["ゆるく", "ガチめ", "初心者OK", "周回", "のんびり", "練習中", "初見歓迎"],
  weather: ["寒い", "雨", "風つよい", "あたたかい", "くもり", "夕方から冷える", "夜は冷える"],
  food: ["カレー", "ラーメン", "パスタ", "弁当", "惣菜パン", "学食", "定食", "うどん", "おにぎり"],
  place: ["学食", "生協", "駅前", "コンビニ", "ゼミ室", "図書館", "カフェ", "購買"],
  class: ["1限", "2限", "3限", "4限", "5限", "月曜の1限", "金曜の3限", "午後の演習"],
  task: ["レポート", "課題", "小テスト", "発表資料", "履修登録", "実習のレポート", "ゼミの輪読"],
  gear: [
    "双剣",
    "弓",
    "太刀",
    "ガンランス",
    "大剣",
    "スラアク",
    "操虫棍",
    "ハンマー",
    "片手剣",
    "ライトボウガン",
  ],
  skill: ["会心", "攻撃", "属性", "回避距離", "耳栓", "集中", "砲術", "体術", "納刀", "耐力"],
  part: ["頭", "胴", "腕", "腰", "脚", "護石", "装飾品"],
  morning: ["おはよう", "おはよ", "起きた", "ねむい", "今日も眠い", "朝から雨"],
  night: ["おやすみ", "ねる", "もう寝る", "ねむい", "あと5分", "今日は早く寝る"],
  replyShort: [
    "わかる",
    "それな",
    "いいね",
    "たしかに",
    "おつかれ",
    "了解",
    "ありがと",
    "助かる",
    "なるほど",
    "それで",
  ],
  topic: ["そういえば", "ところで", "ちなみに", "あ、"],
  topicTail: [
    "明日の集会どうする",
    "新イベントいつから",
    "集会所の空気",
    "装備の話",
    "週末の予定",
    "次のアプデ",
    "護石の厳選",
    "弓の立ち回り",
    "レポートの締切",
    "バイトのシフト",
    "履修の抽選",
    "ゼミの発表",
    "新しいモンスター",
    "集会の募集文",
    "双剣の強化",
    "クラッチクローの話",
    "導きの地",
    "装飾品の集め方",
    "フレンドの話",
    "集会所のマスター",
  ],
};

const buildTemplates = (pick: <T>(list: T[]) => T): Record<string, (() => string)[]> => ({
  "mhc-lfg": [
    () => `${pick(P.quest)}｜${pick(P.time)}〜｜${pick(P.slot)} ${pick(P.mood)}`,
    () => `【募集】${pick(P.quest)}｜${pick(P.time)}開始｜${pick(P.slot)}`,
    () => `${pick(P.time)}から${pick(P.quest)}行きます。${pick(P.slot)}、${pick(P.mood)}で`,
    () => `${pick(P.quest)}周回したい。${pick(P.time)}から${pick(P.slot)}`,
    () => `${pick(P.time)}に${pick(P.quest)}の募集立てます。${pick(P.slot)} ${pick(P.mood)}`,
    () => `【再募集】${pick(P.quest)}｜${pick(P.slot)}｜${pick(P.time)}〜`,
  ],
  "mhc-chat": [
    () => `今日は${pick(P.weather)}ね`,
    () => `${pick(P.food)}食べた`,
    () => `${pick(P.place)}混んでた`,
    () => `${pick(P.class)}つらい`,
    () => `${pick(P.task)}終わらない`,
    () => `${pick(P.time)}から${pick(P.quest)}行く人いる？`,
    () => `${pick(P.replyShort)}、${pick(P.topicTail)}`,
    () => `${pick(P.topic)}${pick(P.topicTail)}`,
    () => `${pick(P.morning)}。${pick(P.weather)}`,
    () => `${pick(P.night)}。${pick(P.time)}まで`,
    () => `${pick(P.gear)}の調子いい。${pick(P.skill)}はそのまま`,
    () => `${pick(P.skill)}盛れてる？${pick(P.gear)}の話だけど`,
  ],
  "mhc-questions": [
    () =>
      `${pick(P.gear)}の${pick(P.skill)}って${pick(["どこまで", "どのくらい", "最初はどう", "優先度は"])}必要ですか`,
    () => `${pick(P.quest)}の${pick(["立ち回り", "対策", "弱点", "おすすめ装備"])}を教えてください`,
    () =>
      `${pick(P.part)}の${pick(["厳選", "強化", "入手"])}って${pick(["どこで", "いつから", "どのくらい"])}ですか`,
    () =>
      `${pick(P.task)}の${pick(["提出期限", "書き方", "テンプレ"])}って${pick(["どこ", "いつ", "どれ"])}ですか`,
    () => `${pick(P.class)}の${pick(["教室", "資料", "出席"])}わかる人いますか`,
  ],
  "mhc-clips": [
    () => `${pick(P.quest)}の${pick(["討伐", "最後の一撃", "被弾", "抜刀"])}`,
    () => `${pick(P.time)}の${pick(["月見ヶ原", "古代樹の森", "紅葉の谷", "眠りの火山"])}`,
    () => `${pick(P.gear)}で${pick(["決まった", "外した", "当たった", "避けた"])}瞬間`,
    () => `${pick(P.quest)}の${pick(["3乙", "初見", "ソロ", "4人"])}記録`,
  ],
  "mhc-gear": [
    () => `${pick(P.gear)}の${pick(P.skill)}構成どうしてますか`,
    () => `${pick(P.part)}を${pick(["変えたい", "厳選中", "強化した", "見直したい"])}`,
    () => `${pick(P.skill)}と${pick(P.skill)}って両立できますか`,
    () => `${pick(P.gear)}なら${pick(["属性", "会心", "攻撃"])}どっち優先ですか`,
  ],
  "mhc-notice": [
    () =>
      `【お知らせ】${pick(["次回メンテ", "集会所のルール", "週末イベント", "募集文の書き方"])}について`,
    () => `【注意】${pick(["開始時刻", "人数", "目的"])}を書いてください（${pick(P.time)}の募集）`,
  ],
  "mhc-intro": [
    () => `はじめまして。${pick(P.gear)}メインで${pick(["夜", "週末", "深夜", "昼"])}に遊んでます`,
    () =>
      `${pick(["復帰勢", "始めたばかり", "3年目"])}です。${pick(["ゆるく", "まったり", "がっつり"])}やりたいです`,
    () =>
      `${pick(P.gear)}と${pick(P.gear)}を使ってます。${pick(["よろしく", "よろしくお願いします", "仲良くしてください"])}`,
  ],
});

const pad = (value: number) => String(value).padStart(2, "0");
const jst = (ms: number) => {
  const date = new Date(ms + 9 * 3600e3);
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:00+09:00`;
};

const CLIP_IMAGES = ["0211-1", "0826-3", "0920-2", "1109-7", "1117-8", "0204-8"];

/** 決定性のある生成。同じ seed なら常に同じ配列を返す。 */
export function generateMhcHistory(
  seed = MHC_HISTORY_SEED,
  existingTimes: Iterable<string> = [],
): Record<string, Message[]> {
  let state = seed;
  const rand = () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
  const pick = <T>(list: T[]): T => list[Math.floor(rand() * list.length)];
  const int = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));

  const TEMPLATES = buildTemplates(pick);
  const usedTimes = new Set(existingTimes);
  // 物語の最後（2026-11-19 23:52 の「住所を特定しました」）より前で止める
  const CAP = Date.parse("2026-11-19T23:45:00+09:00");
  const all: { ch: string; at: number; key: string; body: string; author: string }[] = [];

  for (const [month, total] of MONTHS) {
    const days =
      month === "2026-11"
        ? 19
        : new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)).getUTCDate();
    // 活動日: 6日以降を中心に、必ず10日以上。どの活動日にも1通以上置く
    const active = new Set<number>();
    const targetDays = Math.max(10, Math.min(13, Math.ceil(total / 6)));
    for (let day = 6; day <= days && active.size < targetDays; day += 1)
      if (rand() < 0.6) active.add(day);
    for (let day = 1; active.size < targetDays && day <= days; day += 1) active.add(day);
    const activeDays = [...active].sort((a, b) => a - b);
    const counts = activeDays.map(() => 1);
    let left = total - activeDays.length;
    while (left > 0) {
      counts[int(0, counts.length - 1)] += 1;
      left -= 1;
    }
    activeDays.forEach((day, index) => {
      const count = counts[index];
      let burstStart = Date.parse(
        `${month}-${pad(day)}T${pad(rand() < 0.35 ? int(21, 23) : int(8, 20))}:${pad(int(0, 59))}:00+09:00`,
      );
      let remaining = count;
      while (remaining > 0) {
        const size = Math.min(remaining, int(1, 4));
        const ch = pick(MHC_HISTORY_CHANNELS.map(([id]) => id));
        for (let k = 0; k < size; k += 1) {
          let at = Math.min(burstStart + (k === 0 ? 0 : int(1, 15)) * 60000, CAP - 60000);
          let key = jst(at);
          let guard = 0;
          while (usedTimes.has(key) && guard < 400) {
            at += 60000;
            key = jst(at);
            guard += 1;
          }
          usedTimes.add(key);
          all.push({ ch, at, key, body: "", author: "" });
        }
        remaining -= size;
        burstStart += int(40, 180) * 60000;
      }
    });
  }

  // チャンネル配分を目標値へ寄せる
  const target = new Map(MHC_HISTORY_CHANNELS);
  const countOf = (ch: string) => all.filter((item) => item.ch === ch).length;
  for (let pass = 0; pass < 40000; pass += 1) {
    const over = MHC_HISTORY_CHANNELS.find(([ch]) => countOf(ch) > (target.get(ch) ?? 0));
    const under = MHC_HISTORY_CHANNELS.find(([ch]) => countOf(ch) < (target.get(ch) ?? 0));
    if (!over || !under) break;
    const item = all.find((entry) => entry.ch === over[0]);
    if (!item) break;
    item.ch = under[0];
  }

  const usedBody = new Set<string>();
  let typoCount = 0;
  let stampCount = 0;
  let mediaCount = 0;
  let topicCount = 0;
  const withAttachment = new Set<string>();

  for (const item of all) {
    const roll = rand();
    let body: string | null = null;
    if (item.ch === "mhc-clips" && roll < 0.35 && mediaCount < 22) {
      body = "";
      mediaCount += 1;
    } else if (roll < 0.03 && stampCount < 14) {
      body = `:mm_stamp_${pad(stampCount + 1)}:`;
      stampCount += 1;
    } else if (roll < 0.05) {
      for (let attempt = 0; attempt < 100; attempt += 1) {
        const candidate = `https://example.com/${pick(["guide", "clips", "build", "notes"])}/${pick(P.gear)}-${int(1000, 9999)}`;
        if (!usedBody.has(candidate)) {
          body = candidate;
          break;
        }
      }
      if (!body) body = `https://example.com/notes/${int(10000, 99999)}`;
    } else if (roll < 0.09 && typoCount < 40) {
      for (let attempt = 0; attempt < 300; attempt += 1) {
        const candidate = `${pick(["誤字った", "言い直すと", "いや、違う", "間違えた"])}。${pick(P.quest)}の${pick(["話", "件", "やつ"])}、${pick(P.time)}のこと`;
        if (!usedBody.has(candidate)) {
          body = candidate;
          break;
        }
      }
      typoCount += 1;
    } else if (roll < 0.28 && topicCount < 120) {
      for (let attempt = 0; attempt < 2000; attempt += 1) {
        const candidate = `${pick(P.topic)}${pick(P.topicTail)}、${pick(P.time)}の${pick(["話", "件", "やつ"])}`;
        if (!usedBody.has(candidate)) {
          body = candidate;
          break;
        }
      }
      topicCount += 1;
    }
    if (body === null) {
      for (let attempt = 0; attempt < 500; attempt += 1) {
        const candidate = pick(TEMPLATES[item.ch])();
        if (!usedBody.has(candidate)) {
          body = candidate;
          break;
        }
      }
    }
    if (body === null) {
      for (let attempt = 0; attempt < 2000; attempt += 1) {
        const candidate = `${pick(TEMPLATES[item.ch])()}${pick(["。", "！", "…", " かな", " だと思う"])}${pick(P.time)}の${pick(P.quest)}`;
        if (!usedBody.has(candidate)) {
          body = candidate;
          break;
        }
      }
    }
    usedBody.add(body ?? "");
    item.body = body ?? "";
    if (item.body === "") withAttachment.add(item.key);
    item.author =
      item.ch === "mhc-notice" ? "master" : rand() < 0.7 ? pick(REGULARS) : pick(SPEAKERS);
  }

  all.sort((a, b) => a.at - b.at);

  // 連投・同文の3連続を崩す
  const merged = all;
  for (let i = 2; i < merged.length; i += 1) {
    if (merged[i].author === merged[i - 1].author && merged[i].author === merged[i - 2].author) {
      merged[i].author = merged[i].author === "hal" ? "maimai" : "hal";
    }
    if (
      merged[i].body &&
      merged[i].body === merged[i - 1].body &&
      merged[i].body === merged[i - 2].body
    ) {
      merged[i].body = `${merged[i].body}。`;
    }
  }

  // kai は D10 の上限まで（残りは他の常連へ）
  let kaiCount = 0;
  for (const item of merged) {
    if (item.author !== "kai") continue;
    kaiCount += 1;
    if (kaiCount > KAI_LIMIT_IN_MHC) item.author = pick(REGULARS);
  }

  // スタンプのみを最低12件は確保する（自然さのしきい値のため）
  const countStamps = () => merged.filter((item) => /^:[a-z0-9_]+:$/.test(item.body)).length;
  for (let index = 0; countStamps() < 12 && index < merged.length * 4; index += 1) {
    const target = merged[index % merged.length];
    if (!target.body || /^:[a-z0-9_]+:$/.test(target.body) || /^https?:\/\//.test(target.body))
      continue;
    target.body = `:mm_stamp_${pad(countStamps() + 1)}:`;
  }

  const out: Record<string, (typeof all)[number][]> = {};
  for (const [ch] of MHC_HISTORY_CHANNELS) out[ch] = [];
  for (const item of merged) out[item.ch].push(item);
  const result: Record<string, Message[]> = {};
  for (const [ch, list] of Object.entries(out)) {
    list.sort((a, b) => a.at - b.at);
    // チャンネル内でも同文3連続を崩す
    for (let i = 2; i < list.length; i += 1) {
      let guard = 0;
      while (guard < 10 && list[i].body === list[i - 1].body && list[i].body === list[i - 2].body) {
        list[i].body = `${list[i].body}。`;
        guard += 1;
      }
    }
    result[ch] = list.map((item, index) => {
      const id = `${ch}-h${String(index + 1).padStart(4, "0")}`;
      const message: Message = {
        id,
        channelId: ch,
        authorId: item.author,
        sentAt: item.key,
        body: item.body,
      };
      if (withAttachment.has(item.key)) {
        message.attachments = [
          {
            id: `${id}-att`,
            name: `clip-${CLIP_IMAGES[index % CLIP_IMAGES.length]}.png`,
            kind: "image",
            sizeLabel: "1.8 MB",
          },
        ];
      }
      return message;
    });
  }
  return result;
}
