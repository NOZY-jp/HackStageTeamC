import type { Message } from "../types";

/**
 * #133 の DM 拡張（9スレッド・1,500通）の生成器。
 *
 * - 固定 seed で再現可能（決定性テストあり）
 * - 恋人（dm-maimai）は 2025-11〜2026-08 の各月に「会話しない日」を2日以上残し、
 *   連続して空くのは3日まで。2026-09〜11 は付き合った後なので毎日でよい
 * - 通話は合計34回（うち6回は不在着信）
 * - 2026-08 に一度ぶつかって謝り、関係が戻る
 * - 本文は関係ごとの語彙＋文型で組み立て、スレッド横断でユニーク（システム行は除く）
 */

export const DM_EXPANSION_SEED = 133133;
export const CALL_TARGET_TOTAL = 34;
export const CALL_MISSED_TOTAL = 6;

export type DMExpansionTarget = { threadId: string; personId: string; count: number };

export const DM_EXPANSION_TARGETS: DMExpansionTarget[] = [
  { threadId: "dm-maimai", personId: "maimai", count: 719 },
  { threadId: "dm-kai", personId: "kai", count: 90 },
  { threadId: "dm-taku", personId: "taku", count: 60 },
  { threadId: "dm-jun", personId: "jun", count: 45 },
  { threadId: "dm-miyu", personId: "miyu", count: 35 },
  { threadId: "dm-yama", personId: "yama", count: 40 },
  { threadId: "dm-ootsuka", personId: "ootsuka", count: 25 },
  { threadId: "dm-hayashi", personId: "hayashi", count: 30 },
  { threadId: "dm-gunlance", personId: "gunlance", count: 20 },
];

const MAIMAI_MONTHS: [string, number][] = [
  ["2025-11", 29],
  ["2025-12", 35],
  ["2026-01", 40],
  ["2026-02", 50],
  ["2026-03", 55],
  ["2026-04", 60],
  ["2026-05", 60],
  ["2026-06", 70],
  ["2026-07", 80],
  ["2026-08", 85],
  ["2026-09", 60],
  ["2026-10", 60],
  ["2026-11", 35],
];

const KAI_MONTHS: [string, number][] = [
  ["2026-02", 7],
  ["2026-03", 9],
  ["2026-04", 9],
  ["2026-05", 9],
  ["2026-06", 10],
  ["2026-07", 10],
  ["2026-08", 10],
  ["2026-09", 9],
  ["2026-10", 9],
  ["2026-11", 8],
];

const FRIEND_MONTHS: Record<string, [string, number][]> = {
  "dm-taku": [
    ["2025-12", 4],
    ["2026-01", 5],
    ["2026-02", 5],
    ["2026-03", 5],
    ["2026-04", 5],
    ["2026-05", 5],
    ["2026-06", 6],
    ["2026-07", 6],
    ["2026-08", 6],
    ["2026-09", 5],
    ["2026-10", 5],
    ["2026-11", 3],
  ],
  "dm-jun": [
    ["2026-01", 4],
    ["2026-02", 4],
    ["2026-03", 4],
    ["2026-04", 4],
    ["2026-05", 4],
    ["2026-06", 4],
    ["2026-07", 5],
    ["2026-08", 5],
    ["2026-09", 4],
    ["2026-10", 4],
    ["2026-11", 3],
  ],
  "dm-miyu": [
    ["2026-03", 3],
    ["2026-04", 3],
    ["2026-05", 4],
    ["2026-06", 4],
    ["2026-07", 4],
    ["2026-08", 4],
    ["2026-09", 4],
    ["2026-10", 5],
    ["2026-11", 4],
  ],
  "dm-yama": [
    ["2026-04", 4],
    ["2026-05", 5],
    ["2026-06", 5],
    ["2026-07", 5],
    ["2026-08", 5],
    ["2026-09", 6],
    ["2026-10", 6],
    ["2026-11", 4],
  ],
  "dm-ootsuka": [
    ["2026-05", 3],
    ["2026-06", 3],
    ["2026-07", 4],
    ["2026-08", 4],
    ["2026-09", 4],
    ["2026-10", 4],
    ["2026-11", 3],
  ],
  "dm-hayashi": [
    ["2026-04", 3],
    ["2026-05", 4],
    ["2026-06", 4],
    ["2026-07", 4],
    ["2026-08", 4],
    ["2026-09", 4],
    ["2026-10", 4],
    ["2026-11", 3],
  ],
  "dm-gunlance": [
    ["2026-03", 2],
    ["2026-04", 2],
    ["2026-05", 2],
    ["2026-06", 2],
    ["2026-07", 3],
    ["2026-08", 3],
    ["2026-09", 2],
    ["2026-10", 2],
    ["2026-11", 2],
  ],
};

const pad = (value: number) => String(value).padStart(2, "0");
const jst = (ms: number) => {
  const date = new Date(ms + 9 * 3600e3);
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:00+09:00`;
};

const TIME = [
  "7時",
  "8時",
  "9時",
  "10時",
  "12時",
  "13時",
  "15時",
  "17時",
  "18時",
  "20時",
  "21時",
  "22時",
  "23時",
  "深夜",
];
const SHOP = ["スーパー", "コンビニ", "ドラッグストア", "パン屋", "カフェ", "駅前"];
const FOOD = ["カレー", "パスタ", "鍋", "唐揚げ", "うどん", "寿司", "ケーキ", "コーヒー"];
const PLACE = ["家", "駅", "大学", "バイト先", "図書館", "公園", "カフェ"];
const MOOD = [
  "うれしい",
  "たのしい",
  "しんどい",
  "ねむい",
  "さみしい",
  "ほっとした",
  "びっくりした",
];
const REACT = [
  "うん",
  "わかった",
  "いいよ",
  "たしかに",
  "それな",
  "ありがとう",
  "ごめん",
  "だいじょうぶ",
];
const MONSTER = [
  "リオレウス",
  "タマミツネ",
  "イザリ",
  "ディアブロス",
  "古樹のモリガミ",
  "眠りのマドロミ",
];

const BODY_TEMPLATES: Record<string, (() => string)[]> = {
  "dm-maimai": [
    () => `${pickM(TIME)}から通話できる？`,
    () => `今日は${pickM(MOOD)}から${pickM(["ゲーム", "通話", "配信"])}見てる`,
    () => `${pickM(REACT)}。${pickM(TIME)}に${pickM(["通話", "連絡", "ゲーム"])}する`,
    () => `${pickM(MONSTER)}の話、${pickM(TIME)}にしよう`,
    () =>
      `おつかれ。${pickM(["今日", "明日", "週末"])}は${pickM(["ゆっくり", "のんびり", "早め"])}に`,
    () => `${pickM(["了解", "わかった", "いいね"])}。${pickM(["写真", "動画", "スクショ"])}送る`,
    () => `${pickM(TIME)}の件、${pickM(REACT)}`,
    () => `${pickM(["ゲーム", "通話", "配信"])}の${pickM(["調子", "準備", "予定"])}どう？`,
    () => `${pickM(MOOD)}。${pickM(TIME)}に${pickM(["ゲーム", "通話"])}しよ`,
    () =>
      `${pickM(["今日", "明日", "週末"])}は${pickM(["仕事", "残業", "休み"])}で${pickM(["ゆっくり", "ばたばた", "のんびり"])}`,
    () => `${pickM(["写真", "動画", "スクショ"])}ありがとう。${pickM(MOOD)}`,
  ],
  "dm-kai": [
    () =>
      `${pickM(["今日は", "明日は", "週末は"])}${pickM(["予定ありますか", "空いてますか", "連絡つきますか"])}`,
    () =>
      `${pickM(["了解", "承知"])}です。${pickM(["また連絡します", "予定を合わせます", "日程を見ます"])}`,
    () =>
      `${pickM(["ありがとうございます", "助かります", "お手数かけます"])}。${pickM(["助かりました", "参考にします", "助かります"])}`,
    () =>
      `${pickM(["体調", "予定", "天気"])}は${pickM(["大丈夫ですか", "問題ないですか", "落ち着いてますか"])}`,
    () =>
      `${pickM(["今日", "明日", "週末", "来週"])}の${pickM(["件", "話", "予定"])}、${pickM(["合わせます", "見ておきます", "連絡します"])}`,
    () =>
      `${pickM(["先ほど", "さっき", "昨日"])}の${pickM(["連絡", "話", "件"])}、${pickM(["了解しました", "受け取りました", "把握しました"])}`,
    () =>
      `${pickM(["念のため", "一応", "あとで"])}${pickM(["共有します", "連絡します", "送ります"])}`,
    () =>
      `${pickM(["無理せず", "焦らず", "ゆっくりで"])}${pickM(["で大丈夫です", "お願いします", "どうぞ"])}`,
  ],
  "dm-taku": [
    () => `${pickM(MONSTER)}行く？${pickM(TIME)}から`,
    () => `${pickM(REACT)}、${pickM(TIME)}に集合な`,
    () => `${pickM(MONSTER)}の${pickM(["装備", "素材", "立ち回り"])}どうする`,
    () => `${pickM(TIME)}なら${pickM(REACT)}`,
  ],
  "dm-jun": [
    () => `${pickM(TIME)}の${pickM(["講義", "バイト", "予定"])}どうなった`,
    () => `${pickM(REACT)}。${pickM(TIME)}に${pickM(PLACE)}な`,
    () => `${pickM(FOOD)}行く？${pickM(TIME)}なら空いてる`,
  ],
  "dm-miyu": [
    () => `${pickM(PLACE)}の${pickM(FOOD)}よかった`,
    () => `${pickM(TIME)}に${pickM(SHOP)}行くけど来る？`,
    () => `${pickM(REACT)}、${pickM(MOOD)}`,
  ],
  "dm-yama": [
    () => `${pickM(["レポート", "課題", "小テスト"])}の${pickM(["締切", "範囲", "提出先"])}わかる`,
    () => `${pickM(TIME)}の${pickM(["講義", "演習"])}出る？`,
    () => `${pickM(REACT)}、${pickM(TIME)}に${pickM(PLACE)}で`,
  ],
  "dm-ootsuka": [
    () => `${pickM(["履修", "研究室", "就活", "レポート"])}の件、${pickM(TIME)}なら大丈夫ですか`,
    () => `${pickM(["資料", "プリント"])}は${pickM(PLACE)}にあります。確認してください`,
    () => `${pickM(TIME)}に${pickM(PLACE)}来られますか`,
  ],
  // 先輩（ootsuka）への返信は hal が敬語
  "dm-ootsuka__hal": [
    () => `${pickM(TIME)}に${pickM(PLACE)}伺います。ありがとうございます`,
    () => `${pickM(["履修", "研究室", "就活"])}の件、${pickM(TIME)}に相談してもいいですか`,
    () => `${pickM(["資料", "プリント"])}、確認しました。助かります`,
    () => `すみません、${pickM(TIME)}は都合がつきます`,
  ],
  "dm-hayashi": [
    () =>
      `${pickM(["履修", "課題", "レポート"])}の${pickM(["書き方", "提出先", "範囲"])}どうしてる？`,
    () => `${pickM(TIME)}に${pickM(PLACE)}行くよ`,
    () => `${pickM(["見ておく", "教える", "確認する"])}ね`,
  ],
  // 後輩（hayashi）へは hal がタメ口、後輩は敬語
  "dm-hayashi__person": [
    () =>
      `${pickM(["履修", "課題", "レポート"])}の${pickM(["書き方", "提出先", "範囲"])}教えてください`,
    () => `${pickM(TIME)}に${pickM(PLACE)}行きます。よろしいですか`,
    () => `${pickM(["助かります", "確認します", "承知しました"])}`,
  ],
  "dm-gunlance": [
    () => `${pickM(MONSTER)}の${pickM(["装備", "スキル", "立ち回り"])}どうしてますか`,
    () => `${pickM(TIME)}から${pickM(MONSTER)}行きます`,
    () => `${pickM(REACT)}、${pickM(TIME)}に集会で`,
  ],
};

const KAI_INVESTIGATION: (() => string)[] = [
  () => `ログの${pickM(["3ページ目", "日付", "時刻", "添付"])}を確認しました`,
  () =>
    `${pickM(TIME)}の書き込み、${pickM(["矛盾しています", "辻褄が合いません", "出所が不明です"])}`,
  () =>
    `旧アカウントの${pickM(["投稿", "返信", "削除", "編集"])}が${pickM(["2件", "3件", "4件", "5件"])}ありました`,
  () => `集会の${pickM(["募集文", "参加者", "時刻", "返信"])}を照合しています`,
  () =>
    `${pickM(["画像", "スクリーンショット", "メタ情報"])}の${pickM(["日付", "撮影時刻", "Exif"])}を見ています`,
  () =>
    `進捗のみ共有します。${pickM(["まだ断定できません", "追加で確認します", "材料は揃ってきました"])}`,
];

const templates = new Map<string, (() => string)[]>();
let picker: <T>(list: T[]) => T = (list) => list[0];
const pickM = <T>(list: T[]): T => picker(list);

export type DMExpansionInput = {
  seed?: number;
  existingTimes: Iterable<string>;
  /** dm-maimai で既に発言がある日（2025-11〜2026-08） */
  existingMaimaiDays: string[];
  existingCallStarts: number;
  /** 既存の通話区間（新規の通話をここに重ねない） */
  existingCallWindows?: { start: number; end: number }[];
  existingLastMaimaiAt: string;
};

export type DMExpansionResult = {
  additions: Record<string, Message[]>;
  calls: { startedAt: string; missed: boolean }[];
};

export function generateDmExpansion(input: DMExpansionInput): DMExpansionResult {
  const seed = input.seed ?? DM_EXPANSION_SEED;
  let state = seed;
  const rand = () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
  const pick = <T>(list: T[]): T => list[Math.floor(rand() * list.length)];
  const int = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));
  picker = pick;
  for (const [threadId, build] of Object.entries(BODY_TEMPLATES)) templates.set(threadId, build);

  const usedTimes = new Set(input.existingTimes);
  const existingDays = new Set(input.existingMaimaiDays);
  const additions: Record<string, Message[]> = {};
  for (const target of DM_EXPANSION_TARGETS) additions[target.threadId] = [];

  // 物語の最後（2026-11-19 23:52 の「住所を特定しました」）より前で止める
  const CAP = Date.parse("2026-11-19T23:45:00+09:00");
  const nextTime = (ms: number): { at: number; key: string } => {
    let at = Math.min(ms, CAP - 60000);
    let key = jst(at);
    let guard = 0;
    while (usedTimes.has(key) && guard < 600) {
      at += 60000;
      key = jst(at);
      guard += 1;
    }
    usedTimes.add(key);
    return { at, key };
  };

  // 恋人: 月ごとに「静かな日」を2日以上、連続3日までにして日を埋める
  const calls: { startedAt: string; missed: boolean }[] = [];
  let callBudget = Math.max(0, CALL_TARGET_TOTAL - input.existingCallStarts);
  let missedBudget = CALL_MISSED_TOTAL;
  const quarrelDay = "2026-08-14";

  for (const [month, count] of MAIMAI_MONTHS) {
    const daysInMonth =
      month === "2026-11"
        ? 19
        : new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)).getUTCDate();
    const needsSilent = month >= "2025-11" && month <= "2026-08";
    // 静かな日は「既存にも発言が無い日」から選ぶ。連続3日を超えないよう4日以上離す
    const silent = new Set<number>();
    if (needsSilent) {
      // 既存にも発言が無い日を、4日以上間隔を空けて2日選ぶ
      for (let day = 2; day <= daysInMonth && silent.size < 2; day += 4) {
        if (existingDays.has(`${month}-${pad(day)}`)) continue;
        const tooClose = [...silent].some((picked) => Math.abs(picked - day) < 4);
        if (!tooClose) silent.add(day);
      }
    }
    const activeDays: number[] = [];
    for (let day = 1; day <= daysInMonth; day += 1) {
      if (silent.has(day)) continue;
      activeDays.push(day);
    }
    // 各活動日に1通ずつ置き、残りを配る
    const plan = activeDays.map(() => 0);
    let remaining = count;
    plan.forEach((_, index) => {
      if (remaining > 0) {
        plan[index] += 1;
        remaining -= 1;
      }
    });
    while (remaining > 0) {
      plan[int(0, plan.length - 1)] += 1;
      remaining -= 1;
    }
    activeDays.forEach((day, index) => {
      const dayMessages = plan[index];
      if (dayMessages === 0) return;
      let at = Date.parse(`${month}-${pad(day)}T${pad(int(8, 21))}:${pad(int(0, 59))}:00+09:00`);
      const isQuarrel = `${month}-${pad(day)}` === quarrelDay;
      for (let i = 0; i < dayMessages; i += 1) {
        at += int(1, 15) * 60000;
        const { key } = nextTime(at);
        // 同じ人が3連続しないよう、発言者を交互にする
        const isMaimai = additions["dm-maimai"].length % 2 === 0;
        let body: string | null = null;
        if (isQuarrel && i === 0) {
          body = "昨日の言い方、傷ついた";
        } else if (isQuarrel && i === 1) {
          body = "ごめん、言いすぎた。ちゃんと話したい";
        } else {
          for (let attempt = 0; attempt < 300; attempt += 1) {
            const candidate = pick(templates.get("dm-maimai") ?? [])();
            if (![...additions["dm-maimai"]].some((message) => message.body === candidate)) {
              body = candidate;
              break;
            }
          }
        }
        additions["dm-maimai"].push({
          id: `dm-maimai-x${String(additions["dm-maimai"].length + 1).padStart(4, "0")}`,
          channelId: "dm-maimai",
          authorId: isMaimai ? "maimai" : "hal",
          sentAt: key,
          body: body ?? "うん",
        });
      }
    });
  }

  // 通話（開始・終了の対。6回は不在着信）。本文の予算から54件を空ける
  const maimaiList = additions["dm-maimai"];
  const callLines = callBudget * 2;
  // 通話54件分は月次予算から差し引く（本文を54件減らす）
  for (let index = 0; index < callLines && maimaiList.length > 0; index += 1) {
    let target = -1;
    for (let i = maimaiList.length - 1; i >= 0; i -= 1) {
      if (!maimaiList[i].system) {
        target = i;
        break;
      }
    }
    if (target >= 0) maimaiList.splice(target, 1);
  }
  // 通話は1日1回まで（同じ日に開始が並ばないよう、日付を重複させない）
  const callDays = [...new Set(maimaiList.map((message) => message.sentAt.slice(0, 10)))];
  const windows = input.existingCallWindows ?? [];
  const overlaps = (at: number) =>
    windows.some((w) => at > w.start - 60 * 60000 && at < w.end + 60 * 60000);
  for (let index = 0; index < callBudget; index += 1) {
    if (callDays.length === 0) break;
    let day = callDays.splice(int(0, callDays.length - 1), 1)[0];
    let guardDay = 0;
    while (day && overlaps(Date.parse(`${day}T23:00:00+09:00`)) && guardDay < 60) {
      day = callDays.splice(int(0, callDays.length - 1), 1)[0];
      guardDay += 1;
    }
    if (!day) break;
    // 通話は夜〜深夜に始まる（早朝は始めない）
    // 23時台に収める（日付をまたぐと静かな日を潰すため）
    let start = nextTime(Date.parse(`${day}T23:${pad(int(0, 20))}:00+09:00`));
    for (let minute = 59; start.key.slice(0, 10) !== day && minute >= 30; minute -= 1) {
      const key = `${day}T23:${pad(minute)}:00+09:00`;
      if (usedTimes.has(key)) continue;
      usedTimes.add(key);
      start = { at: Date.parse(key), key };
      break;
    }
    const starter = index % 2 === 0 ? "maimai" : "hal";
    const displayName = starter === "maimai" ? "MaiMai" : "琥珀";
    const missed = missedBudget > 0 && index < CALL_MISSED_TOTAL;
    if (missed) missedBudget -= 1;
    maimaiList.push({
      id: `dm-maimai-x${String(maimaiList.length + 1).padStart(4, "0")}`,
      channelId: "dm-maimai",
      authorId: starter,
      sentAt: start.key,
      body: `${displayName} が通話を開始しました`,
      system: true,
    });
    let end = nextTime(start.at + int(8, 75) * 60000);
    // 終了も同じ日に収める（日付をまたぐと翌日が会話なしでなくなる）
    if (end.key.slice(0, 10) !== day) {
      for (let minute = 59; minute >= 0; minute -= 1) {
        const key = `${day}T23:${pad(minute)}:00+09:00`;
        if (usedTimes.has(key) || Date.parse(key) <= start.at) continue;
        usedTimes.add(key);
        end = { at: Date.parse(key), key };
        break;
      }
    }
    const ender = missed ? starter : starter === "maimai" ? "hal" : "maimai";
    const endName = ender === "maimai" ? "MaiMai" : "琥珀";
    maimaiList.push({
      id: `dm-maimai-x${String(maimaiList.length + 1).padStart(4, "0")}`,
      channelId: "dm-maimai",
      authorId: ender,
      sentAt: end.key,
      body: missed ? `${endName} が 応答がありませんでした` : `${endName} が 通話を終了しました`,
      system: true,
    });
    calls.push({ startedAt: start.key, missed });
  }
  callBudget = 0;

  // 依頼主（kai）: 進捗のみ。最後の「住所を特定しました」より前
  // 最後のメッセージ（住所を特定しました / 23:52）より前に必ず置く
  const kaiLimit = Date.parse("2026-11-19T23:40:00+09:00");
  for (const [month, count] of KAI_MONTHS) {
    const daysInMonth =
      month === "2026-11"
        ? 19
        : new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)).getUTCDate();
    // 「回」＝会話の機会（日）。月6日以下にまとめる
    const opportunityDays = Math.max(1, Math.min(6, Math.ceil(count / 2)));
    const dayPool: number[] = [];
    while (dayPool.length < opportunityDays) {
      const candidate = int(1, daysInMonth);
      if (!dayPool.includes(candidate)) dayPool.push(candidate);
    }
    dayPool.sort((a, b) => a - b);
    for (let index = 0; index < count; index += 1) {
      const day = dayPool[index % dayPool.length];
      let at = Date.parse(`${month}-${pad(day)}T${pad(int(9, 23))}:${pad(int(0, 59))}:00+09:00`);
      if (at >= kaiLimit) at = kaiLimit - int(30, 600) * 60000;
      const { at: safeAt, key } = nextTime(at);
      if (safeAt >= kaiLimit) continue;
      const isKai = additions["dm-kai"].length % 2 === 0;
      let body: string | null = null;
      for (let attempt = 0; attempt < 300; attempt += 1) {
        const pool =
          month >= "2026-10"
            ? [...KAI_INVESTIGATION, ...(templates.get("dm-kai") ?? [])]
            : (templates.get("dm-kai") ?? []);
        const candidate = pick(pool)();
        if (!additions["dm-kai"].some((message) => message.body === candidate)) {
          body = candidate;
          break;
        }
      }
      additions["dm-kai"].push({
        id: `dm-kai-x${String(additions["dm-kai"].length + 1).padStart(4, "0")}`,
        channelId: "dm-kai",
        authorId: isKai ? "kai" : "hal",
        sentAt: key,
        body:
          body ??
          (() => {
            throw new Error("dm-kai: 本文を一意にできませんでした");
          })(),
      });
    }
  }

  // 友人・先輩・後輩・モンハン仲間
  for (const target of DM_EXPANSION_TARGETS) {
    if (["dm-maimai", "dm-kai"].includes(target.threadId)) continue;
    const months = FRIEND_MONTHS[target.threadId] ?? [];
    const list = additions[target.threadId];
    for (const [month, count] of months) {
      const daysInMonth =
        month === "2026-11"
          ? 19
          : new Date(
              Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0),
            ).getUTCDate();
      for (let index = 0; index < count; index += 1) {
        const day = int(1, daysInMonth);
        const at = Date.parse(
          `${month}-${pad(day)}T${pad(int(9, 23))}:${pad(int(0, 59))}:00+09:00`,
        );
        const { key } = nextTime(at);
        // fromMe = hal の番（偶数番目は相手、奇数番目は hal）
        const fromMe = list.length % 2 === 1;
        const poolKey =
          target.threadId === "dm-ootsuka" && fromMe
            ? "dm-ootsuka__hal"
            : target.threadId === "dm-hayashi" && !fromMe
              ? "dm-hayashi__person"
              : target.threadId;
        let body: string | null = null;
        for (let attempt = 0; attempt < 300; attempt += 1) {
          const candidate = pick(templates.get(poolKey) ?? templates.get(target.threadId) ?? [])();
          if (!list.some((message) => message.body === candidate)) {
            body = candidate;
            break;
          }
        }
        list.push({
          id: `${target.threadId}-x${String(list.length + 1).padStart(4, "0")}`,
          channelId: target.threadId,
          authorId: fromMe ? "hal" : target.personId,
          sentAt: key,
          body: body ?? "うん",
        });
      }
    }
  }

  // 月次表の合計は目標と一致していること（パディングで水増ししない）
  for (const target of DM_EXPANSION_TARGETS) {
    const list = additions[target.threadId];
    if (!list) continue;
    if (list.length !== target.count) {
      throw new Error(`${target.threadId}: ${list.length} !== ${target.count}`);
    }
  }

  for (const [threadId, list] of Object.entries(additions)) {
    list.sort((a, b) => a.sentAt.localeCompare(b.sentAt));
    list.forEach((message, index) => {
      message.id = `${threadId}-x${String(index + 1).padStart(4, "0")}`;
    });
  }
  return { additions, calls };
}
