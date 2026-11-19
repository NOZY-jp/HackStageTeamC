import Link from "next/link";
import type { ReactNode } from "react";
import { getUserByHandle } from "@/lib/twitter-like";

/**
 * 投稿本文やプロフィール bio 中の URL と @handle をリンクに変換する。
 * 文字列を分割して React 要素を組み立てるだけで、dangerouslySetInnerHTML は使わない。
 */

// http(s) URL（URLに使えるASCII文字のみ＝直後の日本語は拾わない）、
// または @handle（handle は英数字・ハイフン・アンダースコア。末尾ハイフンは含めない）
const TOKEN_RE =
  /(https?:\/\/[A-Za-z0-9\-._~:/?#[\]@!$&'()*+,;=%]+)|@([A-Za-z0-9_]+(?:-[A-Za-z0-9_]+)*)/g;

// URL 末尾に来がちな句読点・閉じ括弧はリンク対象から外す
const TRAILING_PUNCT_RE = /[.,!?;:'"’”、。）\]】」』]+$/;

// URL 末尾の半角 ) は、URL 内に対応する ( が無いぶんだけ外す
const splitUnbalancedCloseParen = (href: string): { href: string; trailing: string } => {
  let rest = "";
  const count = (ch: string) => href.split(ch).length - 1;
  while (href.endsWith(")") && count(")") > count("(")) {
    href = href.slice(0, -1);
    rest += ")";
  }
  return { href, trailing: rest };
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
      const stripped = splitUnbalancedCloseParen(url.slice(0, url.length - punct.length));
      const href = stripped.href;
      const trailing = punct + stripped.trailing;
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
    } else if (getUserByHandle(handle)) {
      nodes.push(
        <Link key={start} href={`/twitter/profile/${handle}`} className="tw-inline-link">
          @{handle}
        </Link>,
      );
    } else {
      // 存在しない handle のメンションはリンクにしない（消えたアカウントの演出）
      nodes.push(`@${handle}`);
    }
    lastIndex = start + token.length;
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return <>{nodes}</>;
}
