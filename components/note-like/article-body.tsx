import Image from "next/image";
import type { ArticleBlock } from "@/lib/note-like/types";

/** 記事本文。画像は原寸（href）があれば、画像とキャプションから新しいタブで開ける。 */
export function ArticleBody({ blocks }: { blocks: ArticleBlock[] }) {
  return (
    <>
      {blocks.map((block, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: 本文ブロックは固定データで並び替えない
        <Block key={index} block={block} />
      ))}
    </>
  );
}

function Block({ block }: { block: ArticleBlock }) {
  switch (block.kind) {
    case "heading":
      return <h2>{block.text}</h2>;
    case "quote":
      return <blockquote>{block.text}</blockquote>;
    case "image": {
      const picture = (
        <Image
          src={block.src}
          alt={block.alt}
          width={block.width}
          height={block.height}
          unoptimized
        />
      );
      const href = block.href;
      return (
        <figure>
          {href ? (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              aria-label={block.hrefLabel ?? `${block.alt}を原寸で開く`}
            >
              {picture}
            </a>
          ) : (
            picture
          )}
          {block.caption ? (
            <figcaption>
              {block.caption}
              {href ? (
                <>
                  {" "}
                  <a href={href} target="_blank" rel="noreferrer">
                    原寸で見る
                  </a>
                </>
              ) : null}
            </figcaption>
          ) : null}
        </figure>
      );
    }
    case "divider":
      return <hr />;
    default:
      return <p>{block.text}</p>;
  }
}
