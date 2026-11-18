import Link from "next/link";
import { RouteState } from "@/components/note-like/route-state";

export default function NoteNotFound() {
  return (
    <RouteState
      code="404"
      title="ページが見つかりません"
      description="記事またはクリエイターは存在しないか、削除されました。"
    >
      <Link href="/note" className="note-state-link">
        トップへ戻る
      </Link>
    </RouteState>
  );
}
