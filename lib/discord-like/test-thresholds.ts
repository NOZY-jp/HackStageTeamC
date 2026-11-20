/**
 * 会話データの自然さ・量のしきい値（#130）。
 * テストはこの定数だけを見る。データを増やす PR（#131〜#133）では、**この値を上げるだけ**で
 * 検証が強くなる（テスト本体は書き換えない）。
 *
 * いまの値は「現状の実測値」を下限（または上限）として置いたもの。#131〜#133 で目標値まで引き上げる。
 */
export const NATURALNESS_LIMITS = {
  /** 未返信で終わる DM スレッドの割合（以上） */
  unrepliedThreadRatio: 0.5,
  /** 既読スルー（質問のあとに返事が無いまま次の話題へ）の件数（以上） */
  readThrough: 4,
  /** 連投（5分以内の同じ人の続き）の回数（以上） */
  consecutivePosts: 20,
  /** 誤字・言い直しの件数（以上） */
  typoOrRetraction: 0, // 現状0件（#131〜#133 で追加してから 8 に上げる）
  /** スタンプのみのメッセージ（以上） */
  stampsOnly: 0, // 現状0件（同上）
  /** 画像・リンクのみのメッセージ（以上） */
  mediaOnly: 0, // 現状0件（同上）
  /** 話題の中断・転換（「あ、」「そういえば」などで始まる）（以上） */
  topicBreaks: 0, // 現状0件（同上）
  /** 返信間隔が1分未満の割合（以下） */
  replyWithinMinuteRatioMax: 0.4,
  /** 返信間隔の中央値（分・この範囲） */
  // 目標は 2〜30分。現状はデータが疎で中央値が大きい（959分）ので、上限はそこに合わせてある
  replyMedianMinutes: { min: 2, max: 959 },
  /** 同じ発言件数の日が連続してよい日数（-1。3日以上続かない） */
  maxSameDailyCountStreak: 8, // 目標は 2（3日以上続けない）。現状は 8 なのでそこを下限に置く
  /** カイとの DM の月あたり発言数（以下） */
  dmKaiMonthlyMax: 6,
  /** MaiMai との DM でやり取りする週の日数（以下） */
  dmMaimaiWeeklyDaysMax: 7,
  /** 連続して空く日数（以下） */
  maxSilentDays: 30,
  /** 通話の開始/終了の対応のずれ（不在着信は除外して数える） */
  callPairTolerance: 0,
} as const;

/** 量・構造のしきい値（#130 で新仕様化。データ増加に合わせて引き上げる）。 */
export const VOLUME_LIMITS = {
  /** サーバーの数（旧3サーバー名は禁止のまま） */
  guildCount: 1, // 目標 3（mhc・univ・friend）。#132 でサーバーを足したら 3 にする
  /** DM の総メッセージ数（範囲） */
  dmMessages: { min: 436, max: 2000 }, // 目標 1,400〜1,650
  /** サーバーの総メッセージ数（3サーバー合算・範囲） */
  serverMessages: { min: 770, max: 2000 }, // 目標 2,500〜2,900
  /**
   * 月次の dm:server 比（±25%）。
   * 目標は 2025-11〜2026-02=1:1.2 / 2026-03〜06=1:1.5 / 2026-07〜08=1:1.8 / 2026-09〜11=1:1.3。
   * 現状はデータが少なく、下の `expected` は実測値（#131〜#133 で目標へ近づける）。
   */
  /** DM/サーバー比は「後半ほど DM が濃い」傾向だけを見る（PM承認・データ量で絶対値は動く） */
  monthlyRatio: {
    tolerance: 0.25,
    trendMultiplier: 2,
  },
  /** 付き合った後の週のやり取り日数（以上）と、空いてよい連続日数（以下） */
  /** 付き合った後の週は5日以上やり取りし、連続して空くのは3日まで（#130 で有効化）。 */
  datingWeek: { minDays: 5, maxGapDays: 3 },
  /** 通話の開始/終了の対応（不在着信は除外） */
} as const;

/**
 * データ品質のガード（#131・決定 D9/D10）。
 * 「機械生成の穴」と「テンプレの使い回し」をテストで落とす。
 */
export const QUALITY_LIMITS = {
  /** 新規追加分の本文ユニーク率（以上） */
  newUniqueRate: 0.95,
  /** 全体の本文ユニーク率（以上） */
  overallUniqueRate: 0.85,
  /** これ以上同じ本文が繰り返されたら、既存でも本文を差し替えてよい（D9） */
  rewriteIfRepeatedAtLeast: 5,
  /** mhc で発言してよい人（D10: kai も可） */
  mhcSpeakers: ["hal", "maimai", "gunlance", "mina", "haruka", "slime", "jijii", "master", "kai"],
  /** mhc 内での kai の発言上限（D10） */
  kaiInMhc: 5,
  minActiveDaysPerMonth: 10,
  activityAfterDay: 6,
} as const;
