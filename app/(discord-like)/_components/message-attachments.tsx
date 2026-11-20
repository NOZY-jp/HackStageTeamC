"use client";

import Image from "next/image";
import { useState } from "react";
import { getMessageImage } from "@/lib/discord-like/data/message-images";
import type { MessageAttachment } from "@/lib/discord-like/types";

export function MessageAttachments({ attachments }: { attachments: MessageAttachment[] }) {
  const images = attachments.filter((attachment) => attachment.kind === "image");
  const files = attachments.filter((attachment) => attachment.kind === "file");

  return (
    <>
      {images.length > 0 ? (
        <div className="message-attachments" data-count={images.length > 1 ? "2" : "1"}>
          {images.map((attachment) => (
            <MessageImage key={attachment.id} name={attachment.name} />
          ))}
        </div>
      ) : null}

      {files.length > 0 ? (
        <div className="message-files">
          {files.map((attachment) => (
            <span key={attachment.id} className="message-file">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
                <path d="M14 3v5h5" />
              </svg>
              <span className="truncate">{attachment.name}</span>
              {attachment.sizeLabel ? (
                <span className="message-file-size">{attachment.sizeLabel}</span>
              ) : null}
            </span>
          ))}
        </div>
      ) : null}
    </>
  );
}

/**
 * 画像のパスと大きさは message-images.ts の1か所で解決する。
 * 実体がまだ無い画像は、行のレイアウトを壊さないプレースホルダを出す。
 */
function MessageImage({ name }: { name: string }) {
  const [failed, setFailed] = useState(false);
  const image = getMessageImage(name);
  const size = { width: image.width, height: image.height };

  if (failed) {
    return <span className="message-image-fallback">画像は準備中です: {image.label}</span>;
  }

  return (
    <Image
      src={image.src}
      alt={image.label}
      width={size.width}
      height={size.height}
      sizes="(max-width: 640px) 90vw, 420px"
      className="message-image"
      // 小さい画像だけ自然サイズ（それ以外は CSS で高さ360pxを先に確保する）
      data-natural={size.width <= 200 ? "true" : undefined}
      onError={() => setFailed(true)}
    />
  );
}
