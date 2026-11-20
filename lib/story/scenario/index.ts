import type { Beat } from "../types";

/**
 * 台本の全場面。章を足すときは、ファイル（chNN-<名前>.ts）を作ってここに並べる（docs/story.md）。
 * 並び順は「同時に始められる場面があったときの優先順」。
 *
 * 場面の文章は Google Docs「HackStageTeamC」の箱書きが正本。仕組みの PR には場面を入れない。
 */
export const beats: Beat[] = [];
