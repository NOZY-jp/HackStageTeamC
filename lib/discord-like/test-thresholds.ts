/**
 * 会話データの量・自然さ・品質のしきい値（#154・#119）。
 * 下げるとテストが落ちる前提で、実測より少し緩い側にだけ置く。
 */

/** 人物関係とサーバーの設計で合意した値。 */
export const VOLUME_LIMITS = {
  guildCount: 3,
  dmThreads: 9,
  /** dm-maimai の通数（#252 実測 1,960） */
  dmMaimai: { min: 1950, max: 2100 },
  /** DM 全体の通数（#252 実測 2,395） */
  dmTotal: { min: 2370, max: 2400 },
  /** サーバーの通数（#252 実測 2,395。VC の入退室を含む） */
  serverTotal: { min: 2370, max: 2400 },
  /** 付き合った後の週あたりの日数と、空けてよい日数 */
  datingWeek: { minDays: 5, maxGapDays: 3 },
  /** dm-maimai の通話と不在着信の下限（#181 実測 18・5） */
  dmCalls: { total: 22, missed: 6 },
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
  mhcSpeakers: [
    "hal",
    "maimai",
    "gunlance",
    "mina",
    "haruka",
    "slime",
    "jijii",
    "master",
    "denden",
  ],
  kaiInMhc: 0,
} as const;

/**
 * 第6ラウンド精度指標（#252: 返信の温度差・話題の引き継ぎ・未読の現実味・通話の文脈・会話長の分布）。
 * 各しきい値は水増し・機械的おうむ返しを排した自然文の実測値に基づいて設定している。
 */
export const TEMPERATURE_LIMITS = {
  tone: {
    /** 応答語形 3×3 χ²（実測 63.31 → 下限 30） */
    chi2Min: 30,
    /** 水増し禁止で dm-maimai 内の softEmoji が実測9件のため期待度数下限は2（実測 2.30 → 下限 2; 発話全体χ²=579.21でも分離を確認） */
    minExpectedCount: 2,
    /** 恋人 dm-maimai の softEmoji 件数（実測 9 → 下限 8） */
    loverSoftCountMin: 8,
    /** 敬語関係の敬語比率（実測 28/35=0.800 → 下限 0.65） */
    academicKeigoShareMin: 0.65,
    /** リア友・mhc常連のタメ口比率（実測 32/53=0.604 → 下限 0.55） */
    regularTameShareMin: 0.55,
    /** リア友・身内のタメ口比率（実測 18/30=0.600 → 下限 0.55） */
    friendsOnlyTameShareMin: 0.55,
    /** 発話全体の文末・文体 3×3 χ²（実測 579.21 → 下限 200） */
    styleChi2Min: 200,
  },
  continuity: {
    /** 境界・活用判定厳密化後の DM グループ別引き継ぎ率 */
    dmGroupMin: {
      lover: 0.045, // 実測 0.053 (72/1359) → 下限 0.045
      kai: 0.06, // 実測 0.078 (6/77) → 下限 0.06
      academicDm: 0.05, // 実測 0.065 (5/77) → 下限 0.05
      friendsDm: 0.04, // 実測 0.046 (7/151) → 下限 0.04
    },
    /** 境界・活用判定厳密化後の テキスト16ch 別引き継ぎ率 */
    serverChannelMin: {
      "mhc-lfg": 0.08, // 実測 0.099 (18/182) → 下限 0.08
      "mhc-chat": 0.05, // 実測 0.059 (20/340) → 下限 0.05
      "mhc-questions": 0.15, // 実測 0.170 (15/88) → 下限 0.15
      "mhc-clips": 0.06, // 実測 0.078 (5/64) → 下限 0.06
      "mhc-notice": 0.04, // 実測 0.048 (3/62) → 下限 0.04
      "mhc-gear": 0.06, // 実測 0.075 (6/80) → 下限 0.06
      "mhc-intro": 0.12, // 実測 0.154 (4/26) → 下限 0.12
      "univ-contact": 0.1, // 実測 0.119 (10/84) → 下限 0.10
      "univ-class": 0.05, // 実測 0.059 (7/118) → 下限 0.05
      "univ-chat": 0.03, // 実測 0.036 (6/169) → 下限 0.03
      "univ-job": 0.07, // 実測 0.085 (5/59) → 下限 0.07
      "univ-report": 0.13, // 実測 0.157 (17/108) → 下限 0.13
      "univ-any": 0.01, // 実測 0.014 (1/71) → 下限 0.01
      "friend-chat": 0.02, // 実測 0.026 (5/190) → 下限 0.02
      "friend-plan": 0.04, // 実測 0.052 (5/96) → 下限 0.04
      "friend-memory": 0.03, // 実測 0.042 (3/71) → 下限 0.03
    },
  },
  unread: {
    /** 未読スレッド本数（実測 3本: dm-ootsuka, dm-hayashi, dm-gunlance） */
    threadsMin: 2,
    threadsMax: 4,
    /** 24時間以上放置された未読（実測 2本: dm-ootsuka 29.2h, dm-hayashi 27.1h） */
    staleHoursMin: 24,
    staleThreadsMin: 1,
  },
  callContext: {
    preInviteRateMin: 0.9, // 実測 0.955 (21/22) → 下限 0.90
    postImpressionRateMin: 0.9, // 実測 1.000 (16/16) → 下限 0.90
    missedCallbackRateMin: 1.0, // 実測 1.000 (6/6) → 下限 1.00
  },
  burstDistribution: {
    lover: { median: { min: 6, max: 11 }, p90: { min: 10, max: 18 } }, // 実測 med=8, p90=13
    kai: { median: { min: 4, max: 7 }, p90: { min: 6, max: 10 } }, // 実測 med=5, p90=7
    friendsUnivDm: { median: { min: 3, max: 6 }, p90: { min: 5, max: 9 } }, // 実測 med=4, p90=6
    serverChannels: { median: { min: 3, max: 6 }, p90: { min: 6, max: 10 } }, // 実測 med=5, p90=7
  },
} as const;
