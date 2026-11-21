/**
 * 会話データの自然さ・量のしきい値（#130）。
 * テストはこの定数だけを見る。データを増やす PR（#131〜#133）では、**この値を上げるだけ**で
 * 検証が強くなる（テスト本体は書き換えない）。
 *
 * いまの値は「現状の実測値」を下限（または上限）として置いたもの。#131〜#133 で目標値まで引き上げる。
 */
export const NATURALNESS_LIMITS = {
  /** 未返信で終わる DM スレッドの割合（以上） */
  /** 未返信で終わる DM の割合（下限。緩和ではなく「最低これだけ残す」の意味） */
  unrepliedThreadRatio: 0.22, // #133 追記後の実測 0.22（下限を引き上げ）
  /** 既読スルー（質問のあとに返事が無いまま次の話題へ）の件数（以上） */
  readThrough: 20,
  /** 連投（5分以内の同じ人の続き）の回数（以上） */
  consecutivePosts: 42,
  /** 誤字・言い直しの件数（以上） */
  typoOrRetraction: 54,
  /** スタンプのみのメッセージ（以上） */
  stampsOnly: 65,
  /** 画像・リンクのみのメッセージ（以上） */
  mediaOnly: 58,
  /** 話題の中断・転換（「あ、」「そういえば」などで始まる）（以上） */
  topicBreaks: 154,
  /** 返信間隔が1分未満の割合（以下） */
  replyWithinMinuteRatioMax: 0.4,
  /** 返信間隔の中央値（分・この範囲） */
  // 目標 2〜30分。夜をまたぐ返信（12時間超）は別の会話として除いて数える（下のテスト参照）
  replyMedianMinutes: { min: 2, max: 30 },
  /** 同じ発言件数の日が連続してよい日数（-1。3日以上続かない） */
  maxSameDailyCountStreak: 6, // 目標 2。日次の件数を意図的に散らす作業は #133 で行う
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
  guildCount: 3, // mhc・univ・friend（#132）
  /** DM の総メッセージ数（範囲） */
  dmMessages: { min: 1600, max: 2200 }, // #133 追記後 1,650 通を下限で守る
  /** サーバーの総メッセージ数（3サーバー合算・範囲） */
  serverMessages: { min: 1570, max: 2900 }, // #131 で 1,570。目標 2,500〜2,900
  /**
   * 月次の dm:server 比は絶対値ではなく傾向で見る（PM決定）。
   */
  /** DM/サーバー比は「後半ほどDMが濃い」傾向だけを見る（データ量の変更で絶対値は動く） */
  monthlyRatio: {
    /** 最後の期間の DM/サーバー比は、最初の期間のこの倍数以上（PM決定・傾向検査） */
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
  /** 各月で最低限発言がある日数（以上） */
  /** 各月で会話しない日を最低これだけ残す（#133） */
  silentDaysPerMonthMin: 2,
  /** 会話が空いてよい連続日数（#133） */
  silentGapMaxDays: 3,
  minActiveDaysPerMonth: 10,
  /** 各月で「6日以降」にも発言があること */
  activityAfterDay: 6,
} as const;
