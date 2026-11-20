/**
 * シナリオを進める仕組みの型。プラットフォームをまたいで使う（lib/story は共有の名前空間）。
 *
 * - 人物（Character）: 誰がどのプラットフォームでどの名前か（本名は置かない）
 * - 段階（Step, steps.ts）: 謎解きの順序。正本は Issue #76
 * - フラグ（Flag, flags.ts）: 段階に着いたこと・場面の進み具合。宣言したものだけ使う
 * - 場面（Beat, scenario/）: 条件がそろったら流れる会話・独り言のひとまとまり
 */
import type { FlagId } from "./flags";

export type CharacterId = "ryo" | "maimai" | "kai" | "kanon";

export type Character = {
  id: CharacterId;
  /** 作中でよく使う呼び名（作中のテキストに出してよい名前） */
  name: string;
  age: number;
  firstPerson: string;
  /** 二人称。決まっている人だけ */
  secondPerson?: string;
  /** 性格・背景のメモ（台本を書くとき用） */
  note: string;
  /** プラットフォームごとのアカウント。旧アカウントは old 付き */
  accounts: Partial<{
    discordName: string;
    discordId: string;
    discordOldName: string;
    discordOldId: string;
    twixer: string;
    twixerOld: string;
    leaf: string;
    blog: string;
    talkup: string;
  }>;
};

/** 呼び名と、それを作中で使ってよい人。シナリオの鍵になる呼び名もここで管理する */
export type Nickname = {
  /** 呼ばれる人 */
  of: CharacterId;
  text: string;
  /** その呼び名を台本の中で使ってよい人 */
  usedBy: CharacterId[];
  note?: string;
};

/** 会話が流れる場所。今は Discord の DM とリョウの独り言だけ */
export type Channel = { kind: "discord-dm"; with: CharacterId } | { kind: "monologue" };

export type Line = {
  from: CharacterId | "system";
  text: string;
  /** 資料に文面がまだ無い行（仮置き）。確認画面で目立たせ、テストで数える */
  todo?: true;
};

export type Choice = {
  id: string;
  /** 選択肢の文。選ぶとリョウの発言として会話に残る */
  label: string;
  /** 選んだら立つフラグ */
  sets?: FlagId[];
  /** 選んだあとに続く相手の返事 */
  reply?: Line[];
  /** このフラグがそろうまで出さない（手がかりを見つけた人だけが選べる、など） */
  requires?: FlagId[];
  /**
   * 選んだら場面を終えるか（既定は true）。
   * false は「寄り道」: 返事のあとも場面は続き、残りの選択肢から選び直せる（同じ寄り道は二度出ない）
   */
  completes?: boolean;
};

export type Beat = {
  /** 場面ID。章番号から始める（例: "ch3-ask-kai"） */
  id: string;
  chapter: number;
  channel: Channel;
  /** この場面が始まる条件のフラグ（全部そろったら） */
  when: FlagId[];
  /** 先に終わっている必要がある場面（同じ章の中で順に流すとき） */
  after?: string[];
  /** 文面の出どころ（例: "Google Docs 箱書き 第三章"）。シナリオ担当が照合するため */
  source?: string;
  /** 流れる会話 */
  lines: Line[];
  /** プレイヤー（リョウ）の選択肢。無ければ会話が流れたら終わり */
  choices?: Choice[];
  /** 場面が終わったら立つフラグ */
  sets?: FlagId[];
};

/** 進行状態。保存するのはこれだけで、会話の履歴はここから組み立て直す */
export type StoryState = {
  flags: FlagId[];
  /** 終わった場面（終わった順） */
  completed: string[];
  /** 場面ID → 選んだ選択肢ID（選んだ順。寄り道も残る） */
  choices: Record<string, string[]>;
};
