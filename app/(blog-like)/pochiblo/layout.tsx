import type { Metadata } from "next";
import type { ReactNode } from "react";
import { BLOG_SERVICE_NAME } from "@/lib/blog-like";

export const metadata: Metadata = {
  title: { default: BLOG_SERVICE_NAME, template: `%s - ${BLOG_SERVICE_NAME}` },
  description: "無料ではじめられるブログサービス。",
};

export default function PochibloLayout({ children }: { children: ReactNode }) {
  return <div className="pb-page">{children}</div>;
}
