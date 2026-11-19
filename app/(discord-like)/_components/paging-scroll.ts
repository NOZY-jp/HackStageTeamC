/**
 * 段階的読み込みのスクロール計算（純関数）。
 * 画面を飛ばさないための補正と、最下部判定をここに集約してテストする。
 */

/** 最下部からこの距離以内なら「最下部にいる」とみなす */
export const BOTTOM_THRESHOLD_PX = 8;

type ScrollMetrics = {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
};

/** いま最下部にいるか（送信後に追従してよいかの判定）。 */
export function isAtBottom({
  scrollTop,
  scrollHeight,
  clientHeight,
  threshold = BOTTOM_THRESHOLD_PX,
}: ScrollMetrics & { threshold?: number }): boolean {
  return scrollHeight - scrollTop - clientHeight <= threshold;
}
