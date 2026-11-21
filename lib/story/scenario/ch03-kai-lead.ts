import { chat, think } from "../stage";
import type { Beat } from "../types";

const channel = "discord:dm-kai";

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
      chat(channel, "kai", "まいちゃんのこと、何か分かった？", "2026-11-25T21:12:00+09:00"),
      chat(
        channel,
        "kai",
        "Discord だけじゃなくて他のとこも見てみたら？Twixer の公開アカウントに昔の投稿が残っとったぞ",
        "2026-11-25T21:12:40+09:00",
        { wait: "slower" },
      ),
      chat(
        channel,
        "kai",
        "https://twixer.com/mai2mai2/status/post-101",
        "2026-11-25T21:13:00+09:00",
        { wait: "slower" },
      ),
      think("Twixer の投稿か。開いてみよう。"),
    ],
  },
];
