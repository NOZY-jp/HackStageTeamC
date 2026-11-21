"use server";

import { type LinkEmbed, resolveLinkEmbeds } from "@/lib/link-embed";

/**
 * メッセージ本文のURLのうち、アプリ内ページへ解決できるものの埋め込みカード情報を返す。
 * メッセージのページングと同じく、クライアントはデータ層を import しないので Server Action にする。
 * アプリ外のURLはカードを返さない（本文のテキストのまま）。selfOrigin は同一オリジン判定用
 * （クライアントの location.origin。このアプリのURLをそのまま貼ったときだけカードにする）。
 */
export async function fetchLinkEmbeds(body: string, selfOrigin?: string): Promise<LinkEmbed[]> {
  return resolveLinkEmbeds(body, selfOrigin);
}
