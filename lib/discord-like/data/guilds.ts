import type { Guild } from "../types";
import { s1 } from "./servers/s1";
import { s2 } from "./servers/s2";
import { s3 } from "./servers/s3";

/** サーバーは3つ。並びは定義順で固定（Guild 型に position は無い）。 */
export const guilds: Guild[] = [s1, s2, s3];
