import { redirect } from "next/navigation";
import { dmListPath } from "@/lib/platform/app-prefix";

/** 暫定の入口。DM一覧へ送る。 */
export default function RootPage() {
  redirect(dmListPath());
}
