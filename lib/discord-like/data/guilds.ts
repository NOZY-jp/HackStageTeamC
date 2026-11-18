import type { Guild } from "../types";
import { mhc } from "./guilds/mhc";

/** サーバーは1つ。並びは定義順で固定（Guild 型に position は無い）。 */
export const guilds: Guild[] = [mhc];
