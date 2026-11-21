import type { Message } from "../../types";
import { friendScript, friendVoice } from "./friend-script";
import { univScript, univVoice } from "./univ-script";

/** 学科とリア友のサーバーで読める、手書きの会話と通話履歴。 */
export const serversHistory: Record<string, Message[]> = {
  ...univScript,
  ...friendScript,
  "univ-vc-1": univVoice,
  "friend-vc": friendVoice,
};
