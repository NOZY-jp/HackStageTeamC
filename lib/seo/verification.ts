import type { Metadata } from "next";

/**
 * Google Search Console の所有確認タグ。トークンは環境変数で渡す（repo には書かない）。
 * 未設定なら verification を出さない（ビルド時に評価される）。
 */
export function googleVerification(
  token: string | undefined = process.env.GOOGLE_SITE_VERIFICATION,
): Metadata["verification"] {
  return token ? { google: token } : undefined;
}
