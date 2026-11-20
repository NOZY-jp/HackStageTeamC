import type { EntryBlock } from "@/lib/blog-like/types";

/** `<meta name="description">` の上限（検索結果で切れにくい長さ）。 */
export const DESCRIPTION_MAX = 150;

/** 空白を詰めて max 文字に収める（超えたら末尾を … にする）。 */
export function summarize(text: string, max: number = DESCRIPTION_MAX): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) {
    return normalized;
  }
  return `${normalized.slice(0, max - 1).trimEnd()}…`;
}

/** 記事本文（段落・見出し）から description 用の要約を作る。 */
export function entryDescription(blocks: EntryBlock[], max: number = DESCRIPTION_MAX): string {
  const text = blocks
    .map((block) => (block.kind === "paragraph" || block.kind === "heading" ? block.text : ""))
    .filter((line) => line.length > 0)
    .join(" ");
  return summarize(text, max);
}
