import type { FbUserStatus } from "@/lib/facebook-like/types";
import { getInitials } from "./format";

type FbAvatarProps = {
  displayName: string;
  avatarColor: string;
  status?: FbUserStatus;
  size?: "sm" | "md" | "lg" | "xl";
  showStatus?: boolean;
};

const SIZE_CLASSES: Record<NonNullable<FbAvatarProps["size"]>, string> = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-base",
  xl: "w-32 h-32 text-3xl border-4 border-white",
};

export function FbAvatar({
  displayName,
  avatarColor,
  status,
  size = "md",
  showStatus = false,
}: FbAvatarProps) {
  return (
    <span className="fb-avatar-wrap">
      <span
        className={`fb-avatar ${SIZE_CLASSES[size]}`}
        style={{ backgroundColor: avatarColor }}
        aria-hidden="true"
      >
        {getInitials(displayName)}
      </span>
      {showStatus && status === "online" ? (
        <span className="fb-status-dot" title="オンライン" />
      ) : null}
    </span>
  );
}
