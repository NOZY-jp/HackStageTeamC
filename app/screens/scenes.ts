/**
 * 順序4の撮影用モック画面（#103）。
 * ゲーム画面と Discord のスクショは画像生成ではなく、HTML/CSS で組んで撮影する。
 * ID はここ（1か所）に置き、データ側の定数と一致することをテストで固定する。
 */

/** ゲーム内の旧ID（2018年の狩猟画面・2019年のロビーに写る。段階5の完全一致対象）。 */
export const GAME_OLD_ID = "hunter_denden3243";
/** 旧表示名（ゲーム内IDとは別。画面には別ラベルで出す）。 */
export const GAME_OLD_DISPLAY_NAME = "hunter_denden";
/** 現在の Discord のハンドル（2026年のフレンド一覧に写る）。 */
export const CURRENT_ID = "maimaimaimai";

export type ScreenScene = {
  id: "game2018" | "discord2026" | "lobby2019";
  width: number;
  height: number;
  /** 画面に写る ID（テストで固定） */
  ids: string[];
  /** 出力先（public からのパス） */
  output: string;
  title: string;
};

export const SCREEN_SCENES: Record<ScreenScene["id"], ScreenScene> = {
  game2018: {
    id: "game2018",
    width: 1200,
    height: 675,
    ids: [GAME_OLD_ID],
    output: "/discord-like/screenshot-2018-game.png",
    title: "2018年 狩猟中",
  },
  discord2026: {
    id: "discord2026",
    width: 800,
    height: 600,
    ids: [CURRENT_ID],
    output: "/discord-like/screenshot-2026-friends.png",
    title: "2026年 フレンド一覧",
  },
  lobby2019: {
    id: "lobby2019",
    width: 800,
    height: 600,
    // 2019年の画面に写るのは自分（hunter_denden3243）だけ。カイ（imperial_chi）は同席しない
    ids: [GAME_OLD_ID],
    output: "/discord-like/screenshot-2019-lobby.png",
    title: "2019年 ロビー",
  },
};

export const SCENE_IDS = Object.keys(SCREEN_SCENES) as ScreenScene["id"][];
