"use client";

import Image from "next/image";
import { useState } from "react";
import type { MessageAttachment } from "@/lib/discord-like/types";

/** public/mock/ のダミー画像の実寸（アスペクト比を保つために使う）。 */
const IMAGE_SIZES: Record<string, { width: number; height: number }> = {
  "mock-wide.png": { width: 1200, height: 800 },
  "mock-tall.png": { width: 600, height: 1200 },
  "mock-square.png": { width: 800, height: 800 },
  "mock-small.png": { width: 120, height: 120 },
};
const FALLBACK_SIZE = { width: 800, height: 800 };

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

/** 読み込みに失敗したらファイル名を出して、行のレイアウトを壊さない。 */
function MessageImage({ name }: { name: string }) {
  const [failed, setFailed] = useState(false);
  const size = IMAGE_SIZES[name] ?? FALLBACK_SIZE;

  if (failed) {
    return <span className="message-image-fallback">画像を読み込めません: {name}</span>;
  }

  return (
    <Image
      src={`/mock/${name}`}
      alt={name}
      width={size.width}
      height={size.height}
      sizes="(max-width: 640px) 90vw, 420px"
      className="message-image"
      onError={() => setFailed(true)}
    />
  );
}
