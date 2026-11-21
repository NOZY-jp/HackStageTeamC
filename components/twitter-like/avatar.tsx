import type { TwitterUser } from "@/lib/twitter-like/types";

/**
 * アバター。画像があればそれを出し（#169: ツーショット写真との照合に使う）、
 * 無ければ地色とイニシャルで描く。画像の説明は名前・学校名・地名を含めない。
 */
export function Avatar({
  user,
  size = "md",
}: {
  user: TwitterUser;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  if (user.avatarSrc) {
    return (
      <span className="tw-avatar" data-size={size} data-kind="image">
        <img src={user.avatarSrc} alt={user.avatarAlt ?? `${user.displayName}のアイコン`} />
      </span>
    );
  }
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
