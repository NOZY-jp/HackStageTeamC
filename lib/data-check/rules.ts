import type { DataItem, Platform } from "./corpus";

/**
 * 仮データの検査の決まり（純関数）。正本は Issue #76（謎解きの順序・名前・出してはいけない語）。
 * 決まりを足すときは、ここに関数を足して RULES に並べ、data-check.test.ts が全部を流す。
 */

export type Violation = {
  rule: RuleId;
  /** どのデータか（"discord/dmMessages/dm-kai-0005" のように、プラットフォーム/データ/ID） */
  ref: string;
  /** 何がいけないか（人が読む説明） */
  detail: string;
};

export type RuleId =
  | "forbidden-word"
  | "real-name-outside-allowed"
  | "story-only-phrase"
  | "invalid-time"
  | "after-game-now"
  | "duplicate-id";

const refOf = (item: DataItem) => `${item.platform}/${item.dataset}/${item.id}`;

/** 作中のどこにも出さない語（#76: 「ゆい」「ゆっちゃん」は作中に出さない） */
export const FORBIDDEN_WORDS = ["ゆい", "ゆっちゃん"];

/**
 * 本名。プレイヤーが本名にたどり着くのは段階8（コンテストの結果ページ）と段階10（talkup）だけ（#76）。
 * 彼女の本名は talkup にだけ置いてよい。ほかの人物の本名は、どこにも置かない
 */
export const REAL_NAMES: { words: string[]; allowedOn: Platform[] }[] = [
  { words: ["服部", "由比"], allowedOn: ["talkup"] },
  { words: ["小路", "花音", "尾崎", "海斗", "杉浦"], allowedOn: [] },
];

/**
 * 物語の進み具合に合わせて届く文言。静的な過去のデータに置くと、ゲームを始めた直後に読めてしまう（#119）。
 * 物語の場面（lib/story/scenario）からだけ流す
 */
export const STORY_ONLY_PHRASES = ["住所を特定しました", "本名で検索したら"];

/**
 * ゲームの「いま」。静的な過去のデータは、すべてこれより前に置く（#119）。
 * #159 の STORY_NOW と同じ値。#159 がマージされたら、そちらを import する
 */
export const GAME_NOW = "2026-11-25T23:30:00+09:00";

/** 日時の形。時刻つきはタイムゾーン必須（+09:00 か Z）。登録日のような日付だけの値は YYYY-MM-DD */
const DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export function forbiddenWords(items: DataItem[]): Violation[] {
  return items.flatMap((item) =>
    FORBIDDEN_WORDS.flatMap((word) =>
      item.texts.some((text) => text.includes(word))
        ? [{ rule: "forbidden-word" as const, ref: refOf(item), detail: `「${word}」がある` }]
        : [],
    ),
  );
}

export function realNames(items: DataItem[]): Violation[] {
  return items.flatMap((item) =>
    REAL_NAMES.flatMap(({ words, allowedOn }) =>
      allowedOn.includes(item.platform)
        ? []
        : words.flatMap((word) =>
            item.texts.some((text) => text.includes(word))
              ? [
                  {
                    rule: "real-name-outside-allowed" as const,
                    ref: refOf(item),
                    detail: `本名の「${word}」がある（置いてよいのは ${allowedOn.join("・") || "どこにもない"}）`,
                  },
                ]
              : [],
          ),
    ),
  );
}

export function storyOnlyPhrases(items: DataItem[]): Violation[] {
  return items.flatMap((item) =>
    STORY_ONLY_PHRASES.flatMap((phrase) =>
      item.texts.some((text) => text.includes(phrase))
        ? [
            {
              rule: "story-only-phrase" as const,
              ref: refOf(item),
              detail: `物語で届くはずの「${phrase}」が、静的なデータにある`,
            },
          ]
        : [],
    ),
  );
}

export function invalidTimes(items: DataItem[]): Violation[] {
  return items.flatMap((item) =>
    item.times.flatMap(({ key, value }) =>
      DATE_TIME.test(value) || DATE_ONLY.test(value)
        ? []
        : [
            {
              rule: "invalid-time" as const,
              ref: refOf(item),
              detail: `${key} の「${value}」は ISO 8601（タイムゾーンつき、または YYYY-MM-DD）ではない`,
            },
          ],
    ),
  );
}

export function afterGameNow(items: DataItem[], now = GAME_NOW): Violation[] {
  const limit = Date.parse(now);
  return items.flatMap((item) =>
    item.times.flatMap(({ key, value }) =>
      Date.parse(value) > limit
        ? [
            {
              rule: "after-game-now" as const,
              ref: refOf(item),
              detail: `${key} の「${value}」が、ゲームのいま（${now}）より後`,
            },
          ]
        : [],
    ),
  );
}

export function duplicateIds(items: DataItem[]): Violation[] {
  const seen = new Set<string>();
  return items.flatMap((item) => {
    const ref = refOf(item);
    if (!seen.has(ref)) {
      seen.add(ref);
      return [];
    }
    return [{ rule: "duplicate-id" as const, ref, detail: "同じデータの中で ID が重複している" }];
  });
}

export const RULES: { id: RuleId; summary: string; check: (items: DataItem[]) => Violation[] }[] = [
  { id: "forbidden-word", summary: "作中に出さない語", check: forbiddenWords },
  { id: "real-name-outside-allowed", summary: "本名の置き場所", check: realNames },
  { id: "story-only-phrase", summary: "物語で届く文言の先出し", check: storyOnlyPhrases },
  { id: "invalid-time", summary: "日時の形", check: invalidTimes },
  {
    id: "after-game-now",
    summary: "ゲームのいまより後の日時",
    check: (items) => afterGameNow(items),
  },
  { id: "duplicate-id", summary: "ID の重複", check: duplicateIds },
];

/** すべての決まりで検査する */
export function checkAll(items: DataItem[]): Violation[] {
  return RULES.flatMap((rule) => rule.check(items));
}

/** 違反を識別するキー（既知の問題の一覧と突き合わせる） */
export const violationKey = (violation: Pick<Violation, "rule" | "ref">) =>
  `${violation.rule} ${violation.ref}`;
