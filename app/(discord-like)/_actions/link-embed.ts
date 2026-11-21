"use server";

import { type LinkEmbed, resolveLinkEmbeds } from "@/lib/link-embed";

/**
 * メッセージ本文のURLのうち、アプリ内ページへ解決できるものの埋め込みカード情報を返す。
 * メッセージのページングと同じく、クライアントはデータ層を import しないので Server Action にする。
 * アプリ外のURLはカードを返さない（本文のテキストのまま）。selfHost は同一オリジン判定用
 * （クライアントの location.host。このアプリのURLをそのまま貼ったときだけカードにする）。
 */
export async function fetchLinkEmbeds(body: string, selfHost?: string): Promise<LinkEmbed[]> {
  return resolveLinkEmbeds(body, selfHost);
}
