"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchLinkEmbeds } from "@/app/(discord-like)/_actions/link-embed";
import { extractLinkCandidates } from "@/lib/link-embed/candidates";
import type { LinkEmbed } from "@/lib/link-embed/types";

/**
 * 本文のURLがアプリ内のページを指していたら、Discord 風の埋め込みカードを出す。
 * カードを押すとアプリ内のページへ遷移する（外部ブラウザは開かない）。
 * アプリ外・存在しないページのURLは何も出さず、本文のテキストのまま。
 */
export function MessageEmbeds({ body }: { body: string }) {
  const [embeds, setEmbeds] = useState<LinkEmbed[]>([]);
  // URLの候補が無い本文はほとんどなので、サーバーへは聞かない
  const hasCandidate = extractLinkCandidates(body).length > 0;

  useEffect(() => {
    if (!hasCandidate) return;
    let cancelled = false;
    // 同一オリジン（このアプリのURLをそのまま貼った場合）もカードにするため、いまのオリジンを渡す
    fetchLinkEmbeds(body, window.location.origin)
      .then((found) => {
        if (!cancelled) setEmbeds(found);
      })
      .catch(() => {
        // 解決に失敗しても本文はそのまま出す（カードなし）
      });
    return () => {
      cancelled = true;
    };
  }, [body, hasCandidate]);

  if (embeds.length === 0) return null;

  return (
    <div className="message-embeds">
      {embeds.map((embed) => (
        <EmbedCard key={embed.href} embed={embed} />
      ))}
    </div>
  );
}

function EmbedCard({ embed }: { embed: LinkEmbed }) {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <Link href={embed.href} className="message-embed">
      <span
        aria-hidden="true"
        className="message-embed-band"
        style={{ backgroundColor: embed.accentColor }}
      />
      <span className="message-embed-main">
        <span className="message-embed-site">{embed.siteName}</span>
        <span className="message-embed-title">{embed.title}</span>
        {embed.description ? (
          <span className="message-embed-description">{embed.description}</span>
        ) : null}
      </span>
      {embed.thumbnail && !imageFailed ? (
        <Image
          className="message-embed-thumbnail"
          src={embed.thumbnail.src}
          alt={embed.thumbnail.alt}
          width={embed.thumbnail.width}
          height={embed.thumbnail.height}
          // 実体がまだ無い画像はサムネイルごと隠す（カード自体は残す）
          onError={() => setImageFailed(true)}
        />
      ) : null}
    </Link>
  );
}
