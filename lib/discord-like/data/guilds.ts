import type { Guild } from "../types";
import { friend } from "./guilds/friend";
import { mhc } from "./guilds/mhc";
import { univ } from "./guilds/univ";

/** サーバーは3つ（#132）。並びは定義順で固定（Guild 型に position は無い）。 */
export const guilds: Guild[] = [mhc, univ, friend];
