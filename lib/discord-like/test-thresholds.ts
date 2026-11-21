/** 人物関係とサーバーの設計で合意した値。 */
export const VOLUME_LIMITS = {
  guildCount: 3,
  datingWeek: { minDays: 5, maxGapDays: 3 },
} as const;

/** 「モンハンコミュニティ」に発言を載せる人物と、カイの登場範囲。 */
export const QUALITY_LIMITS = {
  mhcSpeakers: ["hal", "maimai", "gunlance", "mina", "haruka", "slime", "jijii", "master", "kai"],
  kaiInMhc: 5,
} as const;
