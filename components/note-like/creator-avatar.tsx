import Image from "next/image";
import type { Creator } from "@/lib/note-like";

/** アバター（装飾扱い）。画像が無ければ、地色＋表示名の頭文字で描く。 */
export function CreatorAvatar({
  creator,
  size = "md",
}: {
  creator: Creator;
  size?: "sm" | "md" | "lg";
}) {
  if (creator.avatar) {
    return (
      <Image
        src={creator.avatar}
        alt=""
        width={256}
        height={256}
        unoptimized
        className="note-avatar"
        data-size={size}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="note-avatar"
      data-size={size}
      style={{ backgroundColor: creator.avatarColor }}
    >
      {Array.from(creator.displayName)[0]}
    </span>
  );
}
