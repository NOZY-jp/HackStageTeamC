import type { Message } from "../../types";
import { messagesByDMThread as clueScenes } from "./dm";
import { authoredDms } from "./dm-scripts";

/** 本文はすべて台本から読み込み、固定IDの場面と時系列で結合する。 */
export const messagesByDMThread: Record<string, Message[]> = Object.fromEntries(
  Object.entries(authoredDms).map(([threadId, messages]) => [
    threadId,
    [...messages, ...(clueScenes[threadId] ?? [])].sort((a, b) => a.sentAt.localeCompare(b.sentAt)),
  ]),
);
