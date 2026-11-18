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

/**
 * 先頭に内容が増えたとき、見えている位置を保つ scrollTop。
 * 追加前の scrollTop に「増えた高さ」を足すだけ（上限は最大スクロール量）。
 */
export function compensatedScrollTop({
  prevScrollTop,
  prevScrollHeight,
  nextScrollHeight,
  clientHeight,
}: {
  prevScrollTop: number;
  prevScrollHeight: number;
  nextScrollHeight: number;
  clientHeight: number;
}): number {
  const next = prevScrollTop + (nextScrollHeight - prevScrollHeight);
  const max = Math.max(0, nextScrollHeight - clientHeight);
  return Math.min(Math.max(0, next), max);
}
