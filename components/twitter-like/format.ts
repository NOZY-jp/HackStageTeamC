/**
 * "2026-11-15T09:40:00+09:00" → "2026年11月15日 09:40"。
 * 文字列をそのまま切り出すので、実行環境のタイムゾーンやロケールに結果が左右されない。
 */
export function formatPostedAt(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso);
  if (!match) {
    return iso;
  }
  const [, year, month, day, hour, minute] = match;
  return `${year}年${Number(month)}月${Number(day)}日 ${hour}:${minute}`;
}

/** "2026-11-15T09:40:00+09:00" → "11月15日"。カードの時刻表示用。 */
export function formatPostedDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return match ? `${Number(match[2])}月${Number(match[3])}日` : iso;
}

/** "2026-11-15T21:20:00+09:00" → "11月15日 21:20"。DM の時刻表示用。 */
export function formatMessageTime(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso);
  if (!match) {
    return iso;
  }
  return `${Number(match[2])}月${Number(match[3])}日 ${match[4]}:${match[5]}`;
}

/** "2026-11-01" → "2026年11月" */
export function formatJoinedAt(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})/.exec(isoDate);
  return match ? `${match[1]}年${Number(match[2])}月` : isoDate;
}

/** 1234 → "1.2K" / 12400 → "1.2万" ではなく、ロケール非依存の K / M 表記に統一する。 */
export function formatCount(count: number): string {
  if (count >= 1_000_000) {
    return `${trimFraction(count / 1_000_000)}M`;
  }
  if (count >= 10_000) {
    return `${Math.floor(count / 1_000)}K`;
  }
  if (count >= 1_000) {
    return `${trimFraction(count / 1_000)}K`;
  }
  return String(count);
}

function trimFraction(value: number): string {
  return (Math.floor(value * 10) / 10).toString();
}
