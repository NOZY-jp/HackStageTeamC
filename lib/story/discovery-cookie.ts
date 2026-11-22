/**
 * 発見済みかどうかの控え（#248）。
 * 検索ページはサーバー側でこの cookie を見て、未発見のデータ（かのん・post-105）を
 * 初期配信物に含めない。進行状態そのものは localStorage にあり、これは表示の可否だけを持つ。
 */
export const FOUND_BFF_COOKIE = "hs-found-bff";
const MAX_AGE = 60 * 60 * 24 * 365;

export function rememberFoundBff(): void {
  document.cookie = `${FOUND_BFF_COOKIE}=1; path=/; max-age=${MAX_AGE}; samesite=lax`;
}

export function clearFoundBff(): void {
  document.cookie = `${FOUND_BFF_COOKIE}=; path=/; max-age=0; samesite=lax`;
}
