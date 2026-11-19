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
      const href = externalHref(block.url);
      return (
        <p className="pb-entry-link">
          {block.lead}
          <br />
          {href ? <Link href={href}>https://{block.url}</Link> : <span>https://{block.url}</span>}
        </p>
      );
    }
    default:
      return <p>{block.text}</p>;
  }
}
