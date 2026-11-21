/**
 * メッセージ本文から、埋め込みカードの候補になるURLを拾う（クライアントでも使う純関数）。
 * 候補は http(s) のURLと、アプリ内の絶対パス（/twitter/... など）。
 * 拾った候補が実際にアプリ内ページへ解決できるかは lib/link-embed が判定する。
 */

/**
 * URLの区切りになりえない文字の手前までをURLとして取る（@ は /channels/@me などに使う）。
 * スキームは大文字も含めて任意のものを丸ごと1トークンで取る。`HTTPS://host:443/path` のような
 * URLを取りこぼすと、ホスト部のあとの `/path` だけがアプリ内パスとして拾われてしまう
 */
const CANDIDATE_RE = /[a-zA-Z][a-zA-Z0-9+.-]*:\/\/[^\s<>"'`（）「」『』【】]+|\/[\w\-./~!?#=&%@]+/g;

/** 文末の句読点や閉じ括弧はURLに含めない（「https://...。」の「。」など） */
const TRAILING_RE = /[.,;:!?)\]}>'"”’、。・…』」】]+$/u;

export function extractLinkCandidates(body: string): string[] {
  const found = body.match(CANDIDATE_RE) ?? [];
  return found
    .map((candidate) => candidate.replace(TRAILING_RE, ""))
    .filter((candidate) => candidate.length > 1);
}
