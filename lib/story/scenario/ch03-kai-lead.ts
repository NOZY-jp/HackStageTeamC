import { GAME_NOW } from "../../platform/game-time";
import { chat, think } from "../stage";
import type { Beat } from "../types";

const channel = "discord:dm-kai";

/** ゲーム開始（GAME_NOW）と同じ日の日本時間。開始時刻が動いても「その日の夕方」の前後関係が保てるよう、日付は相対で書く */
const sameDay = (hhmmss: string) => `${GAME_NOW.slice(0, 10)}T${hhmmss}+09:00`;

/**
 * 第三章: カイから届く手がかり。まいまいの公開Twixerアカウント（@mai2mai2）の
 * URLだけをDMに貼る（投稿の直リンクは送らない）。アカウントから post-101 を開き、
 * そのリプライ（post-102）から旧ブログ名へつながる（Issue #76 順序1〜2・#213）。
 *
 * 段階1（Discord の過去の会話で昔のブログが分かる）のあとに、カイとのDMを開くと届く。
 * 貼るのは公開プロフィールのURL。個別投稿や鍵付きの旧アカウントへのリンクは送らない。
 */
export const chapter3: Beat[] = [
  {
    id: "ch3-kai-twixer-lead",
    chapter: 3,
    place: channel,
    when: ["s01-blog-talk"],
    source: "Issue #76 順序1・#172・#213",
    memo: "カイさんが送ってくれたTwixerのアカウントを見てみよう",
    script: [
      chat(channel, "kai", "まいまいのこと、何か分かった？", sameDay("23:31:00")),
      chat(channel, "ryo", "ブログを書いてたことしか、まだ分かってない", sameDay("23:31:20")),
      chat(channel, "kai", "そういえば、まいまい Twixer やってた気がする", sameDay("23:31:40"), {
        wait: "slower",
      }),
      chat(channel, "kai", "https://twixer.com/mai2mai2", sameDay("23:32:00"), { wait: "slower" }),
      think("Twixer のアカウントか。見てみよう。"),
    ],
  },
];
