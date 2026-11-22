import type { ReactNode } from "react";
import { ContestFrame } from "@/components/contest-like/contest-frame";

/** 写真コンテストの主催者サイト（作中の URL は soukyuu-photo.jp・#222） */
export default function ContestSiteLayout({ children }: { children: ReactNode }) {
  return <ContestFrame>{children}</ContestFrame>;
}
