import type { FbUserStatus } from "@/lib/facebook-like/types";

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

/**
 * アバター内に表示する短い識別ラベルを名前から決定論的に生成する。
 *
 * これまでは全員の表示名が「メン」で始まるため先頭2文字だと誰も区別できなかった。
 * FbAvatar の呼び出し元は post-card など display 名しか渡さないため、
 * 表示名から次の規則で一意に決まる文字列を使う:
 *
 * 1. 数字を含む名前（例: メンバー04）→ その数字（「04」）。
 *    メンバーの番号はユニークなので、色だけに頼らず文字で見分けられる。
 * 2. 数字を含まない名前（例: お知らせBOT / リマインドBOT）→ 先頭1文字
 *    （「お」/「リ」）。BOT 同士も名前の先頭で区別できる。
 */
function getAvatarLabel(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    return "?";
  }
  const digits = trimmed.match(/[0-9]+/);
  if (digits) {
    return digits[0];
  }
  return trimmed.slice(0, 1);
}

/**
 * "#rrggbb" 形式の色の WCAG 相対輝度を計算する。
 * 不正な形式の場合は 0（最暗）を返し、白文字側として扱う。
 */
function getRelativeLuminance(hex: string): number {
  const match = hex.match(/^#?([0-9a-fA-F]{6})$/);
  if (!match) {
    return 0;
  }
  const value = Number.parseInt(match[1], 16);
  const channels = [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff].map((c) => {
    const srgb = c / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

/**
 * 背景色に応じてアバターの文字色を切り替える。
 *
 * 従来は全員白文字だったが、黄色系背景（例: #fee75c）は相対輝度が約 0.79 あり
 * 白文字とのコントラストが約 1.3:1 で視認できない（WCAG AA の 4.5:1 を大きく下回る）。
 * そのため相対輝度が 0.7 を超える明るい背景では黒系（#1f2937）に切り替える。
 * 既存の背景色で 0.7 を超えるのは黄色系（#fee75c ≈ 0.79）のみで、
 * 緑（#57f287 ≈ 0.67）や他の色は白文字のまま維持される。
 */
function getAvatarTextColor(backgroundColor: string): string {
  return getRelativeLuminance(backgroundColor) > 0.7 ? "#1f2937" : "#ffffff";
}

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
        style={{
          backgroundColor: avatarColor,
          color: getAvatarTextColor(avatarColor),
        }}
        aria-hidden="true"
      >
        {getAvatarLabel(displayName)}
      </span>
      {showStatus && status === "online" ? (
        <span className="fb-status-dot" title="オンライン" />
      ) : null}
    </span>
  );
}
