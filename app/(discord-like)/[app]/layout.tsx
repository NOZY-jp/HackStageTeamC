import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { isAppPrefix } from "@/lib/platform/app-prefix";

/**
 * 単一ドメインに複数プラットフォームを載せるための接頭辞ガード。
 * [app] が NEXT_PUBLIC_APP_PREFIX と一致しない場合は未検出にする。
 */
export default async function PlatformLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ app: string }>;
}) {
  const { app } = await params;
  // 動的セグメントはエンコードされたまま渡ることがある
  if (!isAppPrefix(decodeURIComponent(app))) {
    notFound();
  }
  return children;
}
