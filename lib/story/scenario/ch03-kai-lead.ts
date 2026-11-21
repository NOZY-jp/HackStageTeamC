import { GAME_NOW } from "../../platform/game-time";
import { chat, think } from "../stage";
import type { Beat } from "../types";

const channel = "discord:dm-kai";

/** ゲーム開始（GAME_NOW）と同じ日の日本時間。開始時刻が動いても「その日の夕方」の前後関係が保てるよう、日付は相対で書く */
const sameDay = (hhmmss: string) => `${GAME_NOW.slice(0, 10)}T${hhmmss}+09:00`;

/**
 * 第三章: カイから届く手がかり。まいまいの公開Twixerアカウント（@mai2mai2）の
 * 2019年の投稿（post-101）へのURLをDMに貼る。投稿へのリプライ（post-102）から
 * 旧ブログ名へつながる（Issue #76 順序1〜2・#172）。
 *
 * 段階1（Discord の過去の会話で昔のブログが分かる）のあとに、カイとのDMを開くと届く。
 * 貼るのは公開アカウントの投稿。鍵付きの旧アカウント（maimai_mhw）のURLは作らない。
 */
export const chapter3: Beat[] = [
  {
    id: "ch3-kai-twixer-lead",
    chapter: 3,
    place: channel,
    when: ["s01-blog-talk"],
    source: "Issue #76 順序1・#172",
    memo: "カイさんが送ってくれたTwixerの投稿を見てみよう",
    script: [
      chat(channel, "kai", "まいまいのこと、何か分かった？", sameDay("23:31:00")),
      chat(
        channel,
        "kai",
        "Discord だけじゃなくて他のとこも見てみたら？Twixer の公開アカウントに昔の投稿が残ってたぞ",
        sameDay("23:31:40"),
        { wait: "slower" },
      ),
      chat(channel, "kai", "https://twixer.com/mai2mai2/status/post-101", sameDay("23:32:00"), {
        wait: "slower",
      }),
      think("Twixer の投稿か。開いてみよう。"),
    ],
  },
];
