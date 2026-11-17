import type { Message } from "../types";
import { messagesByDMThread } from "./messages/dm";
import { messagesByChannelS1 } from "./messages/s1";
import { messagesByChannelS2 } from "./messages/s2";
import { messagesByChannelS3 } from "./messages/s3";

/** チャンネルIDで引くメッセージ（サーバーごとのファイルを集約）。 */
export const channelMessages: Record<string, Message[]> = {
  ...messagesByChannelS1,
  ...messagesByChannelS2,
  ...messagesByChannelS3,
};

/** DM スレッドIDで引くメッセージ。チャンネルIDとは別の名前空間。 */
export const dmMessages: Record<string, Message[]> = messagesByDMThread;
