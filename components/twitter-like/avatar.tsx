import type { TwitterUser } from "@/lib/twitter-like/types";

/** 画像を使わず、地色とイニシャルだけで描くアバター。装飾なので読み上げ対象外。 */
export function Avatar({
  user,
  size = "md",
}: {
  user: TwitterUser;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  return (
    <span
      className="tw-avatar"
      data-size={size}
      style={{ backgroundColor: user.avatarColor }}
      aria-hidden="true"
    >
      {Array.from(user.displayName)[0]}
    </span>
  );
}
