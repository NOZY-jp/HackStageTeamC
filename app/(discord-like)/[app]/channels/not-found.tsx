import { ChannelNotFound } from "@/app/(discord-like)/_components/channel-not-found";
import { dmListPath } from "@/lib/platform/app-prefix";

/** サーバー自体が見つからないとき（guild が無いので一覧へは戻せない）。 */
export default function NotFound() {
  return <ChannelNotFound serverHref={dmListPath()} backLabel="DMへ戻る" />;
}
