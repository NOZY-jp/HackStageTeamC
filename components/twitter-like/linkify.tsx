import Link from "next/link";
import type { ReactNode } from "react";
import { getUserByHandle } from "@/lib/twitter-like";

/**
 * 投稿本文やプロフィール bio 中の URL と @handle をリンクに変換する。
 * 文字列を分割して React 要素を組み立てるだけで、dangerouslySetInnerHTML は使わない。
 */

// http(s) URL（URLに使えるASCII文字のみ＝直後の日本語は拾わない）、
// または @handle（handle は英数字・ハイフン・アンダースコア）
const TOKEN_RE = /(https?:\/\/[A-Za-z0-9\-._~:/?#[\]@!$&'()*+,;=%]+)|@([A-Za-z0-9_-]+)/g;

// URL 末尾に来がちな句読点・閉じ括弧はリンク対象から外す
const TRAILING_PUNCT_RE = /[.,!?;:'"’”、。）\]】」』]+$/;

// URL 末尾の接尾辞に残った対応しない ) だけを外す。
// ( と ) を出現順に対応付け（総数比較だと `)(bar)` 型で誤判定）、
// URL 内部の ) は URL 文字として維持する（`/a)b` は全文がリンク）。
const stripUnmatchedTrailingCloseParens = (text: string): string => {
  let depth = 0;
  const unmatched = new Set<number>();
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === "(") {
      depth += 1;
    } else if (text[i] === ")") {
      if (depth === 0) {
        unmatched.add(i);
      } else {
        depth -= 1;
      }
    }
  }
  let end = text.length;
  while (end > 0 && unmatched.has(end - 1)) {
    end -= 1;
  }
  return text.slice(0, end);
};

// @ の直前が英数字・アンダースコアならメンションではない（メールアドレス等）
const WORD_CHAR_RE = /[A-Za-z0-9_]/;

export function LinkifiedText({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(TOKEN_RE)) {
    const [token, url, handle] = match;
    const start = match.index;
    if (handle !== undefined && WORD_CHAR_RE.test(text[start - 1] ?? "")) {
      continue;
    }
    if (start > lastIndex) {
      nodes.push(text.slice(lastIndex, start));
    }
    if (url !== undefined) {
      const punct = TRAILING_PUNCT_RE.exec(url)?.[0] ?? "";
      const href = stripUnmatchedTrailingCloseParens(url.slice(0, url.length - punct.length));
      // 外した文字は元の接尾辞の順序のまま再出力する
      const trailing = url.slice(href.length);
      nodes.push(
        <a
          key={start}
          href={href}
          className="tw-inline-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          {href}
        </a>,
      );
      if (trailing) {
        nodes.push(trailing);
      }
    } else {
      // 連続ハイフンを含む候補は全体を照合し、末尾ハイフンだけ外す
      const trimmed = handle.replace(/-+$/, "");
      const droppedHyphens = handle.slice(trimmed.length);
      if (getUserByHandle(trimmed)) {
        nodes.push(
          <Link key={start} href={`/twitter/profile/${trimmed}`} className="tw-inline-link">
            @{trimmed}
          </Link>,
        );
        if (droppedHyphens) {
          nodes.push(droppedHyphens);
        }
      } else {
        // 存在しない handle のメンションはリンクにしない（消えたアカウントの演出）
        nodes.push(`@${handle}`);
      }
    }
    lastIndex = start + token.length;
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return <>{nodes}</>;
}
