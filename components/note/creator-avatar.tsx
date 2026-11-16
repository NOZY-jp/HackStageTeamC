import type { Creator } from "@/lib/note";

const sizes = {
  sm: "size-6 text-xs",
  md: "size-10 text-base",
  lg: "size-20 text-3xl",
} as const;

/** 画像の代わりに、地色＋表示名の頭文字で描くアバター（装飾扱い） */
export function CreatorAvatar({
  creator,
  size = "md",
}: {
  creator: Creator;
  size?: keyof typeof sizes;
}) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold text-(--note-text-on-avatar) ${sizes[size]}`}
      style={{ backgroundColor: creator.avatarColor }}
    >
      {Array.from(creator.displayName)[0]}
    </span>
  );
}
