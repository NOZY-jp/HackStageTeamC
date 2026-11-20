import type { Beat } from "../types";
import { chapter1 } from "./ch01-prologue";

/**
 * 台本の全場面。章を足すときは、ファイル（chNN-<名前>.ts）を作ってここに並べる（docs/story.md）。
 * 並び順は「同時に始められる場面があったときの優先順」。
 *
 * 場面の文章は Google Docs「HackStageTeamC」が正本。いまは箱書きの第一章だけ入れている（清書ができたら差し替える）。
 */
export const beats: Beat[] = [...chapter1];
