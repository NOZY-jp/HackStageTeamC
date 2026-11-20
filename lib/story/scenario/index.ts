import type { Beat } from "../types";
import { chapter1 } from "./ch01-prologue";
import { samples } from "./sample";

/**
 * 台本の全場面。章を足すときは、ファイル（chNN-<名前>.ts）を作ってここに並べる（docs/story.md）。
 * 並び順は「同時に始められる場面があったときの優先順」。
 *
 * 場面の文章は Google Docs「HackStageTeamC」が正本。いまは箱書きの第一章だけ入れている（清書ができたら差し替える）。
 * samples は全命令の見本（確認画面からだけ再生でき、ゲームの進行では始まらない）。
 */
export const beats: Beat[] = [...chapter1, ...samples];
