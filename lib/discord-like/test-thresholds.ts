/**
 * 会話データの量・自然さ・品質のしきい値（#154・#119）。
 * 下げるとテストが落ちる前提で、実測より少し緩い側にだけ置く。
 */

/** 人物関係とサーバーの設計で合意した値。 */
export const VOLUME_LIMITS = {
  guildCount: 3,
  dmThreads: 9,
  /** dm-maimai の通数（2026-11-21 実測 1,666） */
  dmMaimai: { min: 1300, max: 2000 },
  /** DM 全体の通数（実測 1,853） */
  dmTotal: { min: 1600, max: 2300 },
  /** サーバーの通数（実測 799。VC の入退室を含む） */
  serverTotal: { min: 1200, max: 1700 },
  /** 付き合った後の週あたりの日数と、空けてよい日数 */
  datingWeek: { minDays: 5, maxGapDays: 3 },
  /** 未返信で終わる DM スレッドの割合の下限（実測 3/9） */
  unrepliedThreadRatioMin: 0.2,
  /** 1分未満で返す割合の上限と、返信間隔の中央値の範囲（実測 4%・3分） */
  replyWithinMinuteRatioMax: 0.15,
  replyMedianMinutes: { min: 1, max: 8 },
  /** 8通以上の日が同じ件数で続いてよい日数（実測 2） */
  maxSameDailyCountStreak: 3,
  /** 通話開始が夜〜深夜に寄る割合の下限（実測 6/6） */
  callEveningRatioMin: 0.5,
  /** カイとの DM は月6日まで、MaiMai との DM は週7日まで */
  dmKaiMonthlyMax: 6,
  dmMaimaiWeeklyDaysMax: 7,
  /** 後半の月平均が前半の何倍以上か（実測 2.4倍） */
  laterDensityRatioMin: 1.5,
} as const;

/**
 * 人間らしさの痕跡（件数のノルマは置かない）。
 * 種類ごとに「存在すること」だけを必須にし、多すぎないことだけ上限で見る。
 * 2026-11-21 の実測: 既読スルー17.8%、連投17.1%。
 */
export const NOISE_LIMITS = {
  /** 既読スルー（30分以上返事が来ない発言）の割合の上限 */
  readThroughRatioMax: 0.35,
  /** 連投（同じ人が続けて発言する）割合の上限 */
  consecutivePostsRatioMax: 0.35,
} as const;

/** 会話の自然さ（#154 の6指標）。 */
export const NATURALNESS_LIMITS = {
  /** ① 誰も答えない質問の割合 */
  unansweredQuestionRatio: 0.15,
  /** ② 評価語だけの単独発言（チャンネルごと） */
  standaloneReactionPerChannel: 1,
  /** ③ バーストの定義と下限 */
  burstWindowMinutes: 30,
  burstMinMessages: 3,
  burstMessageRatio: 0.6,
  medianGapMinutes: 10,
  /** ④ 時刻と内容の整合 */
  morning: { from: 5, to: 11 },
  night: { from: 21, to: 26 },
  commute: { from: 6, to: 10 },
  /** ⑤ 呼称表の正本 */
  peopleDoc: "docs/discord/03-people.md",
} as const;

/** 「モンハンコミュニティ」に発言を載せる人物と、カイの登場範囲。 */
export const QUALITY_LIMITS = {
  mhcSpeakers: ["hal", "maimai", "gunlance", "mina", "haruka", "slime", "jijii", "master", "kai"],
  kaiInMhc: 5,
} as const;
