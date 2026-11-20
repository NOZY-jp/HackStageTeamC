/** 確認画面は謎解きの道筋が全部見えるので、本番では開けない（NEXT_PUBLIC_STORY_CONSOLE=1 のときだけ） */
export function storyConsoleEnabled(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_STORY_CONSOLE === "1";
}
