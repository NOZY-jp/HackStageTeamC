import Link from "next/link";
import type { ReactNode } from "react";

/**
 * 投稿本文やプロフィール bio 中の URL と @handle をリンクに変換する。
 * 文字列を分割して React 要素を組み立てるだけで、dangerouslySetInnerHTML は使わない。
 */

// http(s) URL、または @handle（handle は英数字・ハイフン・アンダースコア）
const TOKEN_RE = /(https?:\/\/\S+)|@([A-Za-z0-9_-]+)/g;

// URL 末尾に来がちな句読点・閉じ括弧はリンク対象から外す
const TRAILING_PUNCT_RE = /[.,!?;:'"’”、。）\]】]+$/;

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
      const trailing = TRAILING_PUNCT_RE.exec(url)?.[0] ?? "";
      const href = url.slice(0, url.length - trailing.length);
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
      nodes.push(
        <Link key={start} href={`/twitter/profile/${handle}`} className="tw-inline-link">
          @{handle}
        </Link>,
      );
    }
    lastIndex = start + token.length;
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return <>{nodes}</>;
}
