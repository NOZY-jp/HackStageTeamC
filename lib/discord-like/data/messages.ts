import type { Message } from "../types";
import { messagesByDMThread } from "./messages/dm";
import { messagesByChannelMhc } from "./messages/mhc";

/** チャンネルIDで引くメッセージ。 */
export const channelMessages: Record<string, Message[]> = { ...messagesByChannelMhc };

/** DM スレッドIDで引くメッセージ。チャンネルIDとは別の名前空間。 */
export const dmMessages: Record<string, Message[]> = messagesByDMThread;
