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

export const BrandIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="28"
    height="28"
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M12 2.5 21 7.75v8.5L12 21.5 3 16.25v-8.5L12 2.5Zm-3.2 5.6v7.8h1.7v-3.1h3v3.1h1.7V8.1h-1.7v3.1h-3V8.1H8.8Z" />
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
