import { GAME_NOW } from "../../discord-like/data/now";
import { chat, think } from "../stage";
import type { Beat } from "../types";

/** ゲーム開始時点（定義は discord-like のデータ側に1か所だけ）。 */
export const STORY_NOW = GAME_NOW;

const channel = "discord:dm-kai";
const ending = "住所を特定しました";

export const kaiContact: Beat[] = [
  {
    id: "ch5-kai-contact",
    chapter: 5,
    place: channel,
    when: ["s08-real-name"],
    source: "Issue #76 順序9・#119",
    sets: ["s09-kai-contact"],
    script: [
      chat(channel, "kai", "琥珀さん、例の件は何か分かった？", STORY_NOW),
      chat(
        channel,
        "ryo",
        "前に撮った写真の記事が見つかりました。名前も分かりました",
        "2026-11-25T23:31:00+09:00",
      ),
      chat(
        channel,
        "kai",
        "FaceBookだと本名で検索したら結構出てくるぞ？",
        "2026-11-25T23:32:00+09:00",
      ),
      think("写真に写っていた人と照らし合わせてみよう。"),
    ],
  },
  {
    id: "ch6-report-finding",
    chapter: 6,
    place: channel,
    when: ["s09-kai-contact", "s10-talkup-match"],
    source: "Issue #76 順序11・#119",
    script: [think("カイさんに結果を送ろう。")],
    choices: [
      {
        id: "send",
        label: ending,
        reply: [chat(channel, "ryo", ending, "2026-11-25T23:50:00+09:00")],
        sets: ["s11-address"],
      },
    ],
  },
];
