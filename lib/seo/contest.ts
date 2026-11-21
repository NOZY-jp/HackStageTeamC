/**
 * 造語のコンテスト名と、その結果ページのパス（#77 手順8）。
 * 結果ページは主催者のサイト（作中の URL は soukyuu-photo.jp）にある（#222）。
 * サイト内のどこからもリンクしない（sitemap 経由でだけ届く）。
 */
export const PHOTO_CONTEST_NAME = "蒼穹フォトアワード 2020";
export const PHOTO_CONTEST_BLOG_ID = "denden0102";
export const PHOTO_CONTEST_RESULT_PATH = "/soukyuu-photo/2020/result";
/** 以前の結果ページ（でんでんのブログの中にあった）。実在の検索で届くよう、新しいパスへ恒久的に転送する */
export const PHOTO_CONTEST_LEGACY_PATH = `/pochiblo/${PHOTO_CONTEST_BLOG_ID}/contest/soukyuu-photo-award-2020`;
