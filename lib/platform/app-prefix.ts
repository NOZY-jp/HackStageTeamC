/**
 * 単一ドメインに複数プラットフォームを載せるための接頭辞。
 * ビルド時に確定する（クライアントからも読むため NEXT_PUBLIC_ を使う）。
 * URL の生成は必ずこのファイルの関数を経由する（手書きのパスを残さない）。
 */
export const APP_PREFIX = process.env.NEXT_PUBLIC_APP_PREFIX ?? "discord.com";

/** ルートの [app] セグメントが接頭辞と一致するか。 */
export function isAppPrefix(app: string): boolean {
  return app === APP_PREFIX;
}

/** DM一覧: /<app>/channels/@me */
export function dmListPath(): string {
  return `/${APP_PREFIX}/channels/@me`;
}

/** DMスレッド: /<app>/channels/@me/<dmChannelId> */
export function dmThreadPath(threadUrlId: string): string {
  return `${dmListPath()}/${threadUrlId}`;
}

/** サーバーのチャンネル: /<app>/channels/<guildId>/<channelId> */
export function guildChannelPath(guildUrlId: string, channelUrlId: string): string {
  return `/${APP_PREFIX}/channels/${guildUrlId}/${channelUrlId}`;
}
