/**
 * メッセージ本文から、埋め込みカードの候補になるURLを拾う（クライアントでも使う純関数）。
 * 候補は http(s) のURLと、アプリ内の絶対パス（/twitter/... など）。
 * 拾った候補が実際にアプリ内ページへ解決できるかは lib/link-embed が判定する。
 */

/** URLの区切りになりえない文字の手前までをURLとして取る */
const CANDIDATE_RE = /https?:\/\/[^\s<>"'`（）「」『』【】]+|\/[\w\-./~!?#=&%]+/g;

/** 文末の句読点や閉じ括弧はURLに含めない（「https://...。」の「。」など） */
const TRAILING_RE = /[.,;:!?)\]}>'"”’、。・…』」】]+$/u;

export function extractLinkCandidates(body: string): string[] {
  const found = body.match(CANDIDATE_RE) ?? [];
  return found
    .map((candidate) => candidate.replace(TRAILING_RE, ""))
    .filter((candidate) => candidate.length > 1);
}
