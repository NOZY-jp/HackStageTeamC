import type { Guild } from "../types";
import { s1 } from "./guilds/s1";
import { s2 } from "./guilds/s2";
import { s3 } from "./guilds/s3";

/** サーバーは3つ。並びは定義順で固定（Guild 型に position は無い）。 */
export const guilds: Guild[] = [s1, s2, s3];
