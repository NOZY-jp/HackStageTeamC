import Image from "next/image";
import Link from "next/link";
import { type EntryBlock, externalHref } from "@/lib/blog-like";

/** 記事本文。リンク（Twixer・leaf）は今のページへそのまま進む。 */
export function EntryBody({ blocks }: { blocks: EntryBlock[] }) {
  return (
    <div className="pb-entry-body">
      {blocks.map((block, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: 本文ブロックは固定データで並び替えない
        <Block key={index} block={block} />
      ))}
    </div>
  );
}

function Block({ block }: { block: EntryBlock }) {
  switch (block.kind) {
    case "heading":
      return <h3>{block.text}</h3>;
    case "image":
      return (
        <figure>
          <Image
            src={block.src}
            alt={block.alt}
            width={block.width}
            height={block.height}
            unoptimized
          />
          {block.caption ? <figcaption>{block.caption}</figcaption> : null}
        </figure>
      );
    case "link": {
      const href = block.href ?? externalHref(block.url);
      const label = block.label ?? `https://${block.url}`;
      // 当時のリンクのまま。行き先が無くなっていれば、押した先で「存在しません」になる
      return (
        <p className="pb-entry-link">
          {block.lead}
          <br />
          {href ? <Link href={href}>{label}</Link> : <span>{label}</span>}
        </p>
      );
    }
    default:
      return <p>{block.text}</p>;
  }
}
