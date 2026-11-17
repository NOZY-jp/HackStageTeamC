import type { ReactNode } from "react";

/** すべて装飾（aria-hidden）。意味はそれぞれ隣のテキスト／aria-label が担う。 */
function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      className="tw-icon"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/**
 * Twixer の自作の鳥シルエット。旧 Twitter の鳥を彷彿とさせる向き（右上向きの
 * くちばし・丸い体・左上に跳ねた翼）で、パスは本プロジェクトで描き起こした
 * 自作データ。公式ロゴのトレース・転載ではない。
 */
export const BrandIcon = () => (
  <svg
    className="tw-brand-icon"
    viewBox="0 0 24 24"
    width="26"
    height="26"
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M6.2 2.2c1.8 1.6 4 2.7 6.2 3 .3-1.8 1.7-3.5 3.7-3.5 1.1 0 2.1.7 2.7 1.7l3.2.2c-1.4.8-2 2-1.9 3.3l2.2.9c-1.3.5-2.2 1.5-2.4 2.7.2 4.8-3.5 8.3-8.5 8.3-4.5 0-7.9-3.4-8.4-7.6 1.9-.4 3.5-1.4 4.6-2.7-1.1.2-2.1-.3-2.7-1.1 1.1-.3 2-1 2.5-2-.5-.7-.5-2.1-1-3.2z" />
  </svg>
);

/** 認証バッジ（game-info 公式アカウントのみ）。青丸＋抜きのチェック。 */
export const VerifiedBadge = () => (
  <svg
    className="tw-badge"
    viewBox="0 0 22 22"
    width="18"
    height="18"
    aria-hidden="true"
    focusable="false"
  >
    <circle cx="11" cy="11" r="10" style={{ fill: "var(--tw-accent)" }} />
    <path
      d="m6.4 11.5 3 3 6.2-7"
      fill="none"
      style={{ stroke: "var(--tw-bg)" }}
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const HomeIcon = () => (
  <Icon>
    <path d="M4 11 12 4l8 7v8.5a.5.5 0 0 1-.5.5H15v-6H9v6H4.5a.5.5 0 0 1-.5-.5V11Z" />
  </Icon>
);
export const SearchIcon = () => (
  <Icon>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5" />
  </Icon>
);
export const BellIcon = () => (
  <Icon>
    <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15l1.5-2Z" />
    <path d="M10 21h4" />
  </Icon>
);
export const MailIcon = () => (
  <Icon>
    <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
    <path d="m4 7 8 6 8-6" />
  </Icon>
);
export const UserIcon = () => (
  <Icon>
    <circle cx="12" cy="8.5" r="3.5" />
    <path d="M5 20c.8-3.6 3.5-5.5 7-5.5s6.2 1.9 7 5.5" />
  </Icon>
);
export const ChatIcon = () => (
  <Icon>
    <path d="M5 5.5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-8l-4.5 3.5v-3.5H5a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Z" />
  </Icon>
);
export const RepostIcon = () => (
  <Icon>
    <path d="m17 3 3.5 3.5L17 10" />
    <path d="M4 11V9.5A3 3 0 0 1 7 6.5h13.5" />
    <path d="m7 21-3.5-3.5L7 14" />
    <path d="M20 13v1.5a3 3 0 0 1-3 3H3.5" />
  </Icon>
);
export const HeartIcon = () => (
  <Icon>
    <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20Z" />
  </Icon>
);
export const BackIcon = () => (
  <Icon>
    <path d="M19 12H5" />
    <path d="m11 6-6 6 6 6" />
  </Icon>
);
/** 表示数（棒グラフ）。 */
export const ViewsIcon = () => (
  <Icon>
    <path d="M4 20v-6" />
    <path d="M10 20V5" />
    <path d="M16 20v-9" />
    <path d="M22 20V8" />
    <path d="M2 20h20" strokeWidth="0" opacity="0" />
  </Icon>
);
export const BookmarkIcon = () => (
  <Icon>
    <path d="M6 3.5h12V21l-6-4.7L6 21V3.5Z" />
  </Icon>
);
export const ShareIcon = () => (
  <Icon>
    <path d="M12 3.5v11" />
    <path d="m7.5 7 4.5-4.5L16.5 7" />
    <path d="M5 12v6.5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V12" />
  </Icon>
);
/** 「…」の三点。 */
export const MoreIcon = () => (
  <Icon>
    <circle cx="6" cy="12" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="18" cy="12" r="1.4" fill="currentColor" stroke="none" />
  </Icon>
);
export const MediaIcon = () => (
  <Icon>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
    <circle cx="9" cy="9.5" r="1.6" />
    <path d="m4.5 17.5 4.5-4.5 3 3 3.5-3.5 4 4" />
  </Icon>
);
export const GifIcon = () => (
  <Icon>
    <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
    <text
      x="12"
      y="15.2"
      textAnchor="middle"
      fontSize="7"
      fontWeight="700"
      fill="currentColor"
      stroke="none"
    >
      GIF
    </text>
  </Icon>
);
export const PollIcon = () => (
  <Icon>
    <path d="M4 7h10" />
    <path d="M4 12h15" />
    <path d="M4 17h6" />
  </Icon>
);
export const EmojiIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="9" cy="10" r="1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="10" r="1" fill="currentColor" stroke="none" />
    <path d="M8.5 14.5a4.8 4.8 0 0 0 7 0" />
  </Icon>
);
export const CalendarIcon = () => (
  <Icon>
    <rect x="3.5" y="5" width="17" height="16" rx="2" />
    <path d="M8 3v4" />
    <path d="M16 3v4" />
    <path d="M3.5 10h17" />
  </Icon>
);
export const SendIcon = () => (
  <Icon>
    <path d="M3.5 11.2 20.5 4 14.8 20.5l-3.5-6.5-7.8-2.8Z" />
    <path d="m11.3 14 9.2-10" />
  </Icon>
);
export const InfoIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="8" r="1" fill="currentColor" stroke="none" />
    <path d="M12 11.5V17" />
  </Icon>
);
/** 細幅時の「ポストする」ボタンに出す羽ペン。 */
export const ComposeIcon = () => (
  <Icon>
    <path d="M4.5 19.5c1-5.5 3.8-11 7.8-13.5 2.8-1.7 6.4-2.2 8.2-2.5-.3 1.9-1 5.4-3.3 8-3 3.4-8.3 6-12.7 8Z" />
    <path d="M4.5 19.5 15 9" />
  </Icon>
);
