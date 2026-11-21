import { photoContestResult } from "@/lib/blog-like/data/contest";
import { fbUsers, SPOILER_USER_ID } from "@/lib/facebook-like/data/users";
import {
  FORBIDDEN_NICKNAMES,
  MAIMAI_KANA_READINGS,
  MAIMAI_REAL_NAME_PARTS,
  MAIMAI_ROMAJI_READINGS,
} from "@/lib/platform/story-text-policy";
import type { DataItem } from "./corpus";

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
  | "direct-profile-link"
  | "story-only-phrase"
  | "invalid-time"
  | "after-game-now"
  | "duplicate-id";

const refOf = (item: DataItem) => `${item.platform}/${item.dataset}/${item.id}`;

/** #76 段階8のコンテスト結果と、段階10の検索対象プロフィール。 */
const MAIMAI_REAL_NAME_REFS = new Set([
  `pochiblo/contestResults/${photoContestResult.id}`,
  `talkup/users/${SPOILER_USER_ID}`,
]);

const escapedSearchHandle = fbUsers
  .find(({ id }) => id === SPOILER_USER_ID)
  ?.handle.replace(/[.*+?^${}()[\]\\|]/g, "\\$&");
const directProfileLink = escapedSearchHandle
  ? new RegExp(`/talkup/profile/${escapedSearchHandle}(?![a-z0-9_.%~-])`, "i")
  : undefined;

// 漢字と読みを拾う。ローマ字は単語・ハンドルの一部として調べ、英単語の途中は除く。
const MAIMAI_NAME_READINGS = new RegExp(
  `${MAIMAI_KANA_READINGS.join("|")}|(?<![a-z])(?:${MAIMAI_ROMAJI_READINGS.join("|")})(?![a-z])`,
  "i",
);

// #76「追記（2026-11-19・名前とハンドルの確定）」の人物表。
const OTHER_REAL_NAME_PARTS = ["小路", "花音", "尾崎", "海斗", "杉浦"];

/** #119 の助言・結末。助言の典型的な言い換えも、同じ違反として扱う。 */
const STORY_ONLY_PHRASES = [
  { label: "住所を特定しました", pattern: /住所を特定しました/ },
  {
    label: "本名で検索したら",
    pattern:
      /本名\s*(?:で|を(?:\s*(?:入れ|入力し)て)?)\s*(?:検索(?:したら|すれば|すると|するなら|して|しよう|でき(?:る|ます|れば|たら))|調べ(?:たら|れば|ると|るなら|て|よう|られ(?:る|ます)))/,
  },
];

/**
 * ゲームの「いま」。静的な過去のデータは、すべてこれ以前に置く（#119）。
 * #159 の STORY_NOW と同じ値。#159 がマージされたら、そちらを import する
 */
export const GAME_NOW = "2026-11-25T23:30:00+09:00";

/** 日時の形。時刻つきはタイムゾーン必須（+09:00 か Z）。登録日のような日付だけの値は YYYY-MM-DD */
const DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function parseValidTime(value: string): number {
  if (value !== value.trim() || (!DATE_TIME.test(value) && !DATE_ONLY.test(value))) {
    return NaN;
  }

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return NaN;

  // Date.parse は存在しない月日を翌月に繰り上げることがある。
  // タイムゾーンで前後する前の、入力にある日付そのものを検証する。
  const date = value.slice(0, 10);
  const parsedDate = new Date(date);
  return parsedDate.getUTCDate() === Number(date.slice(-2)) ? timestamp : NaN;
}

export function forbiddenWords(items: DataItem[]): Violation[] {
  return items.flatMap((item) =>
    FORBIDDEN_NICKNAMES.flatMap((word) =>
      item.texts.some((text) => text.normalize("NFKC").toLowerCase().includes(word))
        ? [
            {
              rule: "forbidden-word" as const,
              ref: refOf(item),
              detail: `「${word}」がある`,
            },
          ]
        : [],
    ),
  );
}

export function realNames(items: DataItem[]): Violation[] {
  return items.flatMap((item) => {
    const ref = refOf(item);
    const maimaiAllowed = MAIMAI_REAL_NAME_REFS.has(ref);
    const terms = maimaiAllowed
      ? OTHER_REAL_NAME_PARTS
      : [...OTHER_REAL_NAME_PARTS, ...MAIMAI_REAL_NAME_PARTS];
    const violations: Violation[] = terms
      .filter((term) => item.texts.some((text) => text.includes(term)))
      .map((term) => ({
        rule: "real-name-outside-allowed",
        ref,
        detail: `許可されていない場所に本名の「${term}」がある`,
      }));

    if (!maimaiAllowed) {
      for (const text of item.texts) {
        const reading = MAIMAI_NAME_READINGS.exec(text.normalize("NFKC"))?.[0];
        if (reading) {
          violations.push({
            rule: "real-name-outside-allowed",
            ref,
            detail: `許可されていない場所に本名の読み「${reading}」がある`,
          });
          break;
        }
      }
    }
    return violations;
  });
}

/** #76 段階10の検索を飛ばせるプロフィールの直接リンクを検出する。 */
export function directProfileLinks(items: DataItem[]): Violation[] {
  return items
    .filter((item) => item.texts.some((text) => directProfileLink?.test(text.normalize("NFKC"))))
    .map((item) => ({
      rule: "direct-profile-link",
      ref: refOf(item),
      detail: "検索対象プロフィールへの直接リンクが静的なデータにある",
    }));
}

export function storyOnlyPhrases(items: DataItem[]): Violation[] {
  return items.flatMap((item) =>
    STORY_ONLY_PHRASES.flatMap(({ label, pattern }) =>
      item.texts.some((text) => pattern.test(text.normalize("NFKC")))
        ? [
            {
              rule: "story-only-phrase" as const,
              ref: refOf(item),
              detail: `物語で届くはずの「${label}」が、静的なデータにある`,
            },
          ]
        : [],
    ),
  );
}

export function invalidTimes(items: DataItem[]): Violation[] {
  return items.flatMap((item) =>
    item.times.flatMap(({ key, value }) =>
      Number.isNaN(parseValidTime(value))
        ? [
            {
              rule: "invalid-time" as const,
              ref: refOf(item),
              detail: `${key} の「${value}」は有効な ISO 8601 の日時（タイムゾーンつき、または YYYY-MM-DD）ではない`,
            },
          ]
        : [],
    ),
  );
}

export function afterGameNow(items: DataItem[], now = GAME_NOW): Violation[] {
  const limit = parseValidTime(now);
  return items.flatMap((item) =>
    item.times.flatMap(({ key, value }) =>
      parseValidTime(value) > limit
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
    const nested = item.duplicateNestedIds.map(({ path, id }) => ({
      rule: "duplicate-id" as const,
      ref,
      detail: `${path} に ID「${id}」が重複している`,
    }));
    if (seen.has(ref)) {
      nested.push({
        rule: "duplicate-id",
        ref,
        detail: "同じデータの中で ID が重複している",
      });
    }
    seen.add(ref);
    return nested;
  });
}

export const RULES: {
  id: RuleId;
  summary: string;
  check: (items: DataItem[]) => Violation[];
}[] = [
  { id: "forbidden-word", summary: "作中に出さない語", check: forbiddenWords },
  {
    id: "real-name-outside-allowed",
    summary: "本名の置き場所",
    check: realNames,
  },
  {
    id: "direct-profile-link",
    summary: "検索対象プロフィールへの直接リンク",
    check: directProfileLinks,
  },
  {
    id: "story-only-phrase",
    summary: "物語で届く文言の先出し",
    check: storyOnlyPhrases,
  },
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
export const violationKey = (violation: Violation) =>
  `${violation.rule} ${violation.ref} … ${violation.detail}`;
