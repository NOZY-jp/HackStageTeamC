import type { Message } from "../types";

/**
 * univ / friend のメッセージ生成器（#132・#144 の指摘反映）。
 *
 * - 人物制約: friend は「現実の友達」だけ（MaiMai・かのんは入らない）。univ は hal＋同級生18＋先輩6＋後輩9。
 * - 月次: 2025-11〜2026-11 の各月に10日以上の活動日を作る（1日1通以上）。
 * - 本文: 語彙＋文型の組み合わせでユニークにし、**数字や記号で一意に見せた文は作らない**（D9）。
 * - 固定 seed で再現可能。
 */

export const SERVERS_SEED = 132144;

export const UNIV_PEERS = [
  "yama",
  "sato",
  "okada",
  "suzuki",
  "takahashi",
  "tanaka",
  "ito",
  "watanabe",
  "yamamoto",
  "nakamura",
  "kobayashi",
  "kato",
  "yoshida",
  "yamada",
  "sasaki",
  "matsui",
  "inoue",
  "kimura",
];
export const UNIV_SENIORS = ["ootsuka", "kubo", "nishimura", "maeda", "fujita", "ogawa"];
export const UNIV_JUNIORS = [
  "hayashi",
  "shimizu",
  "mori",
  "ikeda",
  "hashimoto",
  "ishikawa",
  "hasegawa",
  "ueda",
  "kondo",
];
export const UNIV_MEMBERS = ["hal", ...UNIV_PEERS, ...UNIV_SENIORS, ...UNIV_JUNIORS];
/** friend は現実の友達だけ（MaiMai・かのんは入れない） */
export const FRIEND_MEMBERS = ["hal", "taku", "jun", "miyu", "riku", "nao", "yuuto"];

const SERVERS: {
  id: string;
  members: string[];
  months: [string, number][];
  channels: [string, number][];
}[] = [
  {
    id: "univ",
    members: UNIV_MEMBERS,
    months: [
      ["2025-11", 40],
      ["2025-12", 45],
      ["2026-01", 70],
      ["2026-02", 55],
      ["2026-03", 45],
      ["2026-04", 45],
      ["2026-05", 50],
      ["2026-06", 50],
      ["2026-07", 80],
      ["2026-08", 40],
      ["2026-09", 50],
      ["2026-10", 55],
      ["2026-11", 75],
    ],
    channels: [
      ["univ-contact", 60],
      ["univ-class", 260],
      ["univ-chat", 200],
      ["univ-job", 70],
      ["univ-report", 60],
      ["univ-any", 50],
    ],
  },
  {
    id: "friend",
    members: FRIEND_MEMBERS,
    months: [
      ["2025-11", 25],
      ["2025-12", 30],
      ["2026-01", 30],
      ["2026-02", 30],
      ["2026-03", 30],
      ["2026-04", 30],
      ["2026-05", 32],
      ["2026-06", 32],
      ["2026-07", 40],
      ["2026-08", 35],
      ["2026-09", 32],
      ["2026-10", 45],
      ["2026-11", 29],
    ],
    channels: [
      ["friend-chat", 240],
      ["friend-plan", 120],
      ["friend-memory", 60],
    ],
  },
];

const P = {
  time: [
    "1限",
    "2限",
    "3限",
    "4限",
    "5限",
    "1限前",
    "昼休み",
    "放課後",
    "夕方",
    "夜",
    "明日",
    "明後日",
    "来週",
    "月曜",
    "水曜",
    "金曜",
  ],
  place: [
    "学食",
    "生協",
    "購買",
    "図書館",
    "ゼミ室",
    "1号館",
    "3号館",
    "駅前",
    "カフェ",
    "コンビニ",
    "キャンパス",
    "教室",
  ],
  task: [
    "レポート",
    "課題",
    "小テスト",
    "発表資料",
    "輪読",
    "実習ノート",
    "卒論の中間",
    "実験レポート",
    "英語の宿題",
    "線形の課題",
  ],
  teacher: [
    "大塚先生",
    "岡田先生",
    "久保先生",
    "中村先生",
    "田中先生",
    "伊藤先生",
    "佐藤先生",
    "清水先生",
  ],
  class: [
    "線形代数",
    "解析学",
    "情報基礎",
    "社会学概論",
    "英語",
    "統計",
    "プログラミング",
    "化学実験",
    "経済学",
    "心理学",
  ],
  food: [
    "カレー",
    "ラーメン",
    "パスタ",
    "唐揚げ",
    "定食",
    "うどん",
    "丼",
    "パン",
    "おにぎり",
    "コーヒー",
  ],
  job: [
    "インターン",
    "説明会",
    "ES",
    "面接",
    "筆記試験",
    "合同説明会",
    "OB訪問",
    "ポートフォリオ",
    "適性検査",
  ],
  company: [
    "IT企業",
    "メーカー",
    "広告代理店",
    "出版社",
    "自治体",
    "商社",
    "コンサル",
    "ゲーム会社",
    "銀行",
    "研究所",
  ],
  friendThing: [
    "ゲーム",
    "モンハン",
    "写真",
    "動画",
    "カラオケ",
    "ボウリング",
    "ドライブ",
    "旅行",
    "花火",
    "誕生日",
  ],
  plan: [
    "土曜",
    "日曜",
    "来週末",
    "連休",
    "夏休み",
    "冬休み",
    "テスト後",
    "バイト後",
    "20時",
    "21時",
    "昼",
    "夜",
  ],
  mood: [
    "たのしい",
    "しんどい",
    "ねむい",
    "うれしい",
    "びっくり",
    "ありがたい",
    "かなしい",
    "おもしろい",
  ],
  reaction: [
    "わかる",
    "それな",
    "いいね",
    "たしかに",
    "なるほど",
    "ありがと",
    "助かる",
    "了解",
    "おつかれ",
    "うん",
  ],
  topic: ["そういえば", "ところで", "ちなみに", "あ、", "ねえ"],
  tail: [
    "この前の話",
    "次の予定",
    "あの件",
    "例のやつ",
    "写真の話",
    "ゲームの話",
    "バイトの話",
    "テストの話",
    "旅行の話",
    "学科の話",
  ],
  weather: ["寒い", "暑い", "雨", "晴れ", "風つよい", "雪", "むしむしする", "涼しい"],
  game: [
    "狩り",
    "クエスト",
    "集会",
    "装備",
    "素材",
    "討伐",
    "ランク",
    "モンハン",
    "協力プレイ",
    "回復",
  ],
  seniorTalk: ["履修", "研究室", "就活", "レポート", "卒論", "単位"],
  juniorTalk: ["履修", "課題", "レポート", "テスト", "サークル", "バイト"],
};

type Builder = (pick: <T>(list: T[]) => T) => string;

const TEMPLATES: Record<string, Builder[]> = {
  "univ-contact": [
    (p) => `${p(P.teacher)}の${p(P.class)}、${p(P.time)}の分の連絡です`,
    (p) => `${p(P.time)}の${p(P.class)}、教室が${p(P.place)}に変更`,
    (p) => `${p(P.task)}の提出先は${p(P.place)}のBOXです`,
    (p) => `${p(P.teacher)}に${p(P.time)}聞いてみます`,
    (p) => `事務から連絡。${p(P.task)}の締切は${p(P.time)}`,
  ],
  "univ-class": [
    (p) => `${p(P.class)}の${p(P.task)}、${p(P.time)}までに出さないと`,
    (p) => `${p(P.teacher)}の授業、${p(P.time)}から${p(P.place)}です`,
    (p) => `${p(P.class)}の${p(["プリント", "スライド", "資料", "ノート"])}誰か持ってる`,
    (p) => `${p(P.class)}むずすぎ。${p(P.task)}手つかず`,
    (p) => `${p(P.time)}の${p(P.class)}出る人いる`,
    (p) => `${p(P.task)}終わった。${p(P.class)}のは${p(P.time)}から`,
  ],
  "univ-chat": [
    (p) => `今日は${p(P.weather)}ね`,
    (p) => `${p(P.place)}の${p(P.food)}うまかった`,
    (p) => `${p(P.time)}から${p(P.place)}行く`,
    (p) => `${p(P.task)}おわらない`,
    (p) => `${p(P.reaction)}、${p(P.tail)}`,
    (p) => `${p(P.topic)}${p(P.tail)}、${p(P.time)}のやつ`,
    (p) => `${p(P.place)}混んでた。${p(P.food)}待ち`,
    (p) => `${p(P.class)}のあと${p(P.place)}寄る`,
    (p) => `${p(P.seniorTalk)}の話、${p(P.time)}に聞ける`,
    (p) => `${p(P.juniorTalk)}の相談に${p(P.time)}乗る`,
  ],
  "univ-job": [
    (p) => `${p(P.company)}の${p(P.job)}、${p(P.time)}から`,
    (p) => `${p(P.job)}の${p(["締切", "日程", "結果", "準備"])}どうする`,
    (p) => `${p(P.company)}の${p(P.job)}受けた。${p(P.mood)}`,
    (p) => `${p(P.job)}対策で${p(P.place)}行く`,
    (p) => `${p(P.company)}の${p(P.job)}、${p(P.time)}までに出す`,
  ],
  "univ-report": [
    (p) => `${p(P.class)}の${p(P.task)}、${p(P.time)}締切`,
    (p) => `${p(P.task)}の${p(["図", "表", "引用", "構成"])}どうしてる`,
    (p) => `${p(P.teacher)}の${p(P.task)}、${p(["文字数", "形式", "枚数"])}指定ある`,
    (p) => `${p(P.place)}で${p(P.task)}やってる`,
    (p) => `${p(P.task)}${p(["8割", "半分", "あと少し", "手つかず"])}`,
  ],
  "univ-any": [
    (p) => `${p(P.topic)}${p(P.tail)}、${p(P.time)}の話`,
    (p) => `${p(P.reaction)}。${p(P.tail)}は${p(P.mood)}`,
    (p) => `${p(P.place)}の${p(["Wi-Fi", "電源", "席", "静かさ"])}どう`,
    (p) => `${p(P.time)}の${p(P.class)}、${p(P.place)}である`,
    (p) => `${p(P.tail)}で${p(P.time)}空いてる人いる`,
  ],
  "friend-chat": [
    (p) => `${p(P.friendThing)}やろう`,
    (p) => `${p(P.game)}の調子いい`,
    (p) => `${p(P.time)}から${p(P.friendThing)}`,
    (p) => `${p(P.reaction)}、${p(P.time)}ね`,
    (p) => `${p(P.friendThing)}の${p(["写真", "動画", "話"])}送る`,
    (p) => `${p(P.topic)}${p(P.tail)}、${p(P.time)}の件`,
    (p) => `今日${p(P.weather)}から${p(P.friendThing)}やる`,
    (p) => `${p(P.game)}で${p(["勝った", "負けた", "事故った", "笑った"])}`,
  ],
  "friend-plan": [
    (p) => `${p(P.plan)}に${p(P.friendThing)}やる？`,
    (p) => `${p(P.plan)}の${p(["集合", "時間", "場所"])}どうする`,
    (p) => `${p(P.plan)}、${p(P.time)}に${p(P.place)}集合で`,
    (p) => `${p(P.friendThing)}の予定、${p(P.plan)}は空いてる`,
    (p) => `${p(P.plan)}に${p(P.place)}行きたい`,
  ],
  "friend-memory": [
    (p) => `${p(P.friendThing)}の話、${p(P.time)}が${p(P.mood)}だった`,
    (p) => `あの${p(P.friendThing)}、${p(P.plan)}のやつ`,
    (p) => `${p(P.time)}の${p(P.friendThing)}、まだ${p(P.mood)}`,
    (p) => `${p(P.topic)}${p(P.tail)}、${p(P.plan)}の`,
    (p) => `${p(P.friendThing)}で${p(P.reaction)}って話したね`,
  ],
};

const pad = (n: number) => String(n).padStart(2, "0");
const jst = (ms: number) => {
  const d = new Date(ms + 9 * 3600e3);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:00+09:00`;
};

/** 数字・記号で一意に見せた文（水増し）を弾く */
/** 「〜の件／〜の話」の継ぎはぎ（水増し）を弾く */
export const looksSpliced = (body: string): boolean => /(の件|の話)[、。].*(の件|の話)/.test(body);

export const looksPadded = (body: string): boolean => {
  const trimmed = body.trim();
  // URL だけを貼った投稿で、パス末尾が番号なのは水増し（本文があれば許す）
  if (/^https?:\/\/\S+\/\d+$/.test(trimmed)) return true;
  // 本文付きの URL は数字を含んでもよい（本文を数字で水増ししたものだけを弾く）
  if (/https?:\/\//.test(body)) return false;
  return /[（(]\s*\d{1,4}\s*[)）]\s*$/.test(body) || /\d{3,}\s*$/.test(body);
};

export function generateServers(
  seed = SERVERS_SEED,
  existingTimes: Iterable<string> = [],
  firstSeen: Record<string, string> = {},
): Record<string, Message[]> {
  let state = seed;
  const rand = () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
  const pick = <T>(list: T[]): T => list[Math.floor(rand() * list.length)];
  const int = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));
  const usedTimes = new Set(existingTimes);
  const usedBody = new Set<string>();
  const out: Record<string, Message[]> = {};

  // 初出より前には発言させない（ノイズ経路も含めて共通化）
  const pickAuthor = (server: { members: string[] }, at: string) => {
    const month = at.slice(0, 7);
    const eligible = server.members.filter((id) => !firstSeen[id] || month >= firstSeen[id]);
    return pick(eligible.length > 0 ? eligible : ["hal"]);
  };

  for (const server of SERVERS) {
    for (const [channelId] of server.channels) out[channelId] = [];
    const queue: { ch: string; at: number; kind?: string }[] = [];
    for (const [month, count] of server.months) {
      const days =
        month === "2026-11"
          ? 19
          : new Date(
              Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0),
            ).getUTCDate();
      // 各月10日以上。全活動日に1通以上置く
      const active = new Set<number>();
      const targetDays = 10;
      for (let day = 1; day <= days && active.size < targetDays; day += 1)
        if (rand() < 0.6) active.add(day);
      for (let day = 1; active.size < targetDays && day <= days; day += 1) active.add(day);
      const daysList = [...active].sort((a, b) => a - b);
      const counts = daysList.map(() => 1);
      let left = count - daysList.length;
      while (left > 0) {
        counts[int(0, counts.length - 1)] += 1;
        left -= 1;
      }
      daysList.forEach((day, index) => {
        let at = Date.parse(`${month}-${pad(day)}T${pad(int(8, 22))}:${pad(int(0, 59))}:00+09:00`);
        // 1日の発言は同じチャンネルにまとめる（チャンネル内で会話が続くように）
        const dayChannel = pick(server.channels.map(([id]) => id));
        for (let i = 0; i < counts[index]; i += 1) {
          at += int(1, 15) * 60000;
          let key = jst(at);
          let guard = 0;
          while (usedTimes.has(key) && guard < 400) {
            at += 60000;
            key = jst(at);
            guard += 1;
          }
          usedTimes.add(key);
          queue.push({ ch: dayChannel, at });
        }
      });
    }
    // チャンネル配分を目標へ寄せる
    const target = new Map(server.channels);
    const countOf = (ch: string) => queue.filter((item) => item.ch === ch).length;
    for (let pass = 0; pass < 50000; pass += 1) {
      const over = server.channels.find(([ch]) => countOf(ch) > (target.get(ch) ?? 0));
      const under = server.channels.find(([ch]) => countOf(ch) < (target.get(ch) ?? 0));
      if (!over || !under) break;
      const item = queue.find((entry) => entry.ch === over[0]);
      if (!item) break;
      item.ch = under[0];
    }
    queue.sort((a, b) => a.at - b.at);
    // 自然さのための揺らぎ（誤字・スタンプのみ・リンクのみ）
    queue.forEach((item, index) => {
      if (index % 12 === 0) item.kind = "stamp";
      else if (index % 22 === 5) item.kind = "typo";
      else if (index % 19 === 7) item.kind = "link";
    });
    for (const item of queue) {
      if (item.kind === "stamp") {
        const body = `:mm_stamp_${String(out[item.ch].length + 1).padStart(2, "0")}:`;
        out[item.ch].push({
          id: `${item.ch}-m${String(out[item.ch].length + 1).padStart(4, "0")}`,
          channelId: item.ch,
          authorId: pickAuthor(server, jst(item.at)),
          sentAt: jst(item.at),
          body,
        });
        continue;
      }
      if (item.kind === "typo") {
        const body = `${pick(["誤字った", "言い直すと", "間違えた"])}。${pick(P.tail)}の${pick(P.time)}のこと`;
        usedBody.add(body);
        out[item.ch].push({
          id: `${item.ch}-m${String(out[item.ch].length + 1).padStart(4, "0")}`,
          channelId: item.ch,
          authorId: pickAuthor(server, jst(item.at)),
          sentAt: jst(item.at),
          body,
        });
        continue;
      }
      if (item.kind === "link") {
        const body = `https://example.com/${item.ch}/${pick(P.tail)}`;
        usedBody.add(body);
        out[item.ch].push({
          id: `${item.ch}-m${String(out[item.ch].length + 1).padStart(4, "0")}`,
          channelId: item.ch,
          authorId: pickAuthor(server, jst(item.at)),
          sentAt: jst(item.at),
          body,
        });
        continue;
      }
      let body = "";
      for (let attempt = 0; attempt < 3000; attempt += 1) {
        const candidate = pick(TEMPLATES[item.ch])(pick);
        if (usedBody.has(candidate) || looksPadded(candidate) || looksSpliced(candidate)) continue;
        body = candidate;
        break;
      }
      if (!body) {
        for (let attempt = 0; attempt < 3000; attempt += 1) {
          const candidate = `${pick(TEMPLATES[item.ch])(pick)}、${pick(P.time)}の${pick(P.tail)}`;
          if (usedBody.has(candidate) || looksPadded(candidate) || looksSpliced(candidate))
            continue;
          body = candidate;
          break;
        }
      }
      usedBody.add(body);
      // 初出より前には発言させない（docs の初出と整合）
      const month = jst(item.at).slice(0, 7);
      const eligible = server.members.filter((id) => !firstSeen[id] || month >= firstSeen[id]);
      const author = pick(eligible.length > 0 ? eligible : ["hal"]);
      out[item.ch].push({
        id: `${item.ch}-m${String(out[item.ch].length + 1).padStart(4, "0")}`,
        channelId: item.ch,
        authorId: author,
        sentAt: jst(item.at),
        body,
      });
    }
  }

  // VC の履歴（開始→30分後に終了）。univ 5回・friend 2回
  const vcPlan: [string, string[], string[]][] = [
    [
      "univ-vc-1",
      ["ootsuka", "kubo", "hayashi", "yama", "sato"],
      [
        "2026-01-10T21:00:00+09:00",
        "2026-02-14T22:00:00+09:00",
        "2026-05-09T21:00:00+09:00",
        "2026-07-04T20:00:00+09:00",
        "2026-10-17T22:00:00+09:00",
      ],
    ],
    ["friend-vc", ["taku", "riku"], ["2026-03-07T21:00:00+09:00", "2026-09-12T22:00:00+09:00"]],
  ];
  for (const [channelId, speakers, starts] of vcPlan) {
    out[channelId] = out[channelId] ?? [];
    starts.forEach((startedAt, index) => {
      const person = speakers[index % speakers.length];
      // 既存の mhc・DM と衝突したら1分ずらす（時刻は全横断で一意）
      let startMs = Date.parse(startedAt);
      let guard = 0;
      // 開始・終了の両方が空くまで1分ずつずらす（無限ループ防止の上限つき）
      while (
        (usedTimes.has(jst(startMs)) || usedTimes.has(jst(startMs + 30 * 60000))) &&
        guard < 600
      ) {
        startMs += 60000;
        guard += 1;
      }
      const endMs = startMs + 30 * 60000;
      const startedKey = jst(startMs);
      const end = jst(endMs);
      usedTimes.add(startedKey);
      usedTimes.add(end);
      out[channelId].push({
        id: `${channelId}-vc${index}a`,
        channelId,
        authorId: person,
        sentAt: startedKey,
        body: "通話を開始しました",
        system: true,
      });
      out[channelId].push({
        id: `${channelId}-vc${index}b`,
        channelId,
        authorId: person,
        sentAt: end,
        body: "通話を終了しました",
        system: true,
      });
    });
  }
  // 既読スルー: 質問のあとに同じ人が続く箇所を作る
  for (const [channelId, list] of Object.entries(out)) {
    list.sort((a, b) => a.sentAt.localeCompare(b.sentAt));
    for (let i = 0; i < list.length - 1; i += 1) {
      if (list[i].system) continue;
      if (list[i + 1].authorId !== list[i].authorId) continue;
      if (/[?？]$/.test(list[i].body.trim())) continue;
      list[i].body = `${list[i].body.replace(/[。、]$/, "")}？`;
    }
    out[channelId] = list;
  }
  return out;
}
