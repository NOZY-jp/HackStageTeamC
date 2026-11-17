import Image from "next/image";
import type { Article } from "@/lib/note-like";

/**
 * 記事の見出し画像（横長 1.91:1）。画像の無い記事では何も描かない。
 * 幅は呼び出し側の className で決める。
 */
export function ArticleCover({ article, className }: { article: Article; className?: string }) {
  if (!article.cover) {
    return null;
  }
  return (
    <Image
      src={article.cover}
      alt=""
      width={1280}
      height={670}
      unoptimized
      className={className ? `note-cover ${className}` : "note-cover"}
    />
  );
}
