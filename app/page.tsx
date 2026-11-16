import { redirect } from "next/navigation";

/** 暫定の入口。DM一覧へ送る。 */
export default function RootPage() {
  redirect("/dm");
}
