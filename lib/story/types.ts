/**
 * シナリオを進める仕組みの型。プラットフォームをまたいで使う（lib/story は共有の名前空間）。
 *
 * - 人物（Character）: 誰がどのプラットフォームでどの名前か（本名は置かない）
 * - 段階（Step, steps.ts）: 謎解きの順序。正本は Issue #76
 * - フラグ（Flag, flags.ts）: 段階に着いたこと・場面の進み具合。宣言したものだけ使う
 * - 場面（Beat, scenario/）: 条件がそろったら流れる演出のひとまとまり。中身は命令（stage/cues.ts）の並び
 */
import type { FlagId } from "./flags";
import type { PlaceId } from "./places";
import type { Cue, TextCue } from "./stage/cues";

export type CharacterId = "ryo" | "maimai" | "kai" | "kanon";

export type Character = {
  id: CharacterId;
  /** 作中でよく使う呼び名（作中のテキストに出してよい名前） */
  name: string;
  age: number;
  firstPerson: string;
  /** 二人称。決まっている人だけ */
  secondPerson?: string;
  /** 文章の窓に出す名前の色（統一するもの） */
  color: string;
  /** 性格・背景のメモ（場面を書くとき用） */
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
  /** その呼び名を場面の中で使ってよい人 */
  usedBy: CharacterId[];
  note?: string;
};

/** 文章1行（ログに残るもの） */
export type Line = TextCue;

export type Choice = {
  id: string;
  /** 選択肢の文。選ぶとリョウの発言（対面の会話）としてログに残る */
  label: string;
  /** 選んだら立つフラグ */
  sets?: FlagId[];
  /** 選んだあとに続く命令（返事・演出） */
  reply?: Cue[];
  /** このフラグがそろうまで出さない（手がかりを見つけた人だけが選べる、など） */
  requires?: FlagId[];
  /**
   * 選んだら場面を終えるか（既定は true）。
   * false は「寄り道」: 返事のあとも場面は続き、残りの選択肢から選び直せる（同じ寄り道は二度出ない）
   */
  completes?: boolean;
};

/**
 * 出し方。
 * - overlay: SNS の画面の上に、画面下の文章の窓（と立ち絵）だけを重ねる（探索中の独り言など）
 * - fullscreen: 背景で SNS の画面を覆う（待ち合わせ場所・最後に直接会う場面など、SNS の外の場面だけ）
 * 会話は基本 Discord の通話の画面の上で流す（overlay ＋ place ＋ voice。docs/story.md）
 */
export type Layout = "overlay" | "fullscreen";

export type Beat = {
  /** 場面ID。章番号から始める（例: "ch3-ask-kai"）。見本は "sample-" */
  id: string;
  chapter: number;
  layout?: Layout;
  /** 出し方の部品（既定は stage = 画面下の窓と舞台）。DM に流すなどは名前を足す（story-stage.tsx の PRESENTERS） */
  presenter?: "stage";
  /**
   * この場面が起きる画面（lib/story/places.ts）。その画面を開いたときに始まり、
   * 開いていなければ「◯◯を開く」と案内だけ出す（探索を邪魔しないよう、画面は勝手に移さない）
   */
  place?: PlaceId;
  /** この場面が始まる条件のフラグ（全部そろったら） */
  when: FlagId[];
  /** 先に終わっている必要がある場面 */
  after?: string[];
  /** 文面の出どころ（例: "Google Docs 箱書き 第三章"）。シナリオ担当が照合するため */
  source?: string;
  /** 命令の並び（文章・背景・立ち絵・動き・効果・カスタム演出など） */
  script: Cue[];
  /** プレイヤー（リョウ）の選択肢。場面の最後に出る */
  choices?: Choice[];
  /** 場面が終わったら立つフラグ */
  sets?: FlagId[];
  /**
   * 場面が終わって探索に戻るときの「いまやること」（リョウが次に何をするつもりか、1行）。
   * テキスト窓をたたんだタブに出す。次に memo のある場面が終わるまで残る
   */
  memo?: string;
  /** 確認画面からだけ再生する場面（見本など）。ゲームの進行では始まらない */
  previewOnly?: boolean;
};

/** 進行状態。保存するのはこれだけで、会話の履歴はここから組み立て直す */
export type StoryState = {
  flags: FlagId[];
  /** 終わった場面（終わった順） */
  completed: string[];
  /** 場面ID → 選んだ選択肢ID（選んだ順。寄り道も残る） */
  choices: Record<string, string[]>;
};
