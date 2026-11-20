import type { Beat } from "../types";
import { samples } from "./sample";

/**
 * 台本の全場面。章を足すときは、ファイル（chNN-<名前>.ts）を作ってここに並べる（docs/story.md）。
 * 並び順は「同時に始められる場面があったときの優先順」。
 *
 * 場面の文章は Google Docs「HackStageTeamC」の箱書きが正本。仕組みの PR には場面を入れない。
 * samples は全命令の見本（確認画面からだけ再生でき、ゲームの進行では始まらない）。
 */
export const beats: Beat[] = [...samples];
