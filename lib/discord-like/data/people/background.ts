import type { User } from "../../types";

/**
 * 背景の350人。会話には出ない（発言0件）。
 * ID と表示名は規則で決定的に作る（乱数は使わない）。
 * 状態は全体で「online 30・idle 10・dnd 4・offline 356」になるよう、固定のインデックスで決める。
 */
const BACKGROUND_COUNT = 350;
const PALETTE = ["#5865f2", "#eb459e", "#57f287", "#fee75c", "#9b59b6", "#e67e22", "#1abc9c"];

/**
 * 背景の割り当て（mhc → univ → friend の順に index を割る）。
 * `data/members.ts` の memberIds もこの区切りで取る（人数の正本は docs/discord/03-people.md §5）。
 */
export const BACKGROUND_SPLIT = { mhc: 250, univ: 86, friend: 13 } as const;

/** univ の背景の先頭 index（mhc の分を取ったあと）。 */
const UNIV_FROM = BACKGROUND_SPLIT.mhc;
/** friend の背景の先頭 index（mhc＋univ のあと）。 */
const FRIEND_FROM = BACKGROUND_SPLIT.mhc + BACKGROUND_SPLIT.univ;

/**
 * univ（学科）の背景メンバー名（#170）。表示名は名字ベースのカタカナ、ハンドルの語幹はローマ字で、
 * 学科のアンネームド（名字呼び捨て）と同じ流儀にする。
 * 表示名は全ユーザーで一意にする決まりがあるため、アンネームド39人の姓はここに入れない。
 */
const UNIV_NAMES: ReadonlyArray<readonly [displayName: string, stem: string]> = [
  ["サイトウ", "saito"],
  ["ヤマグチ", "yamaguchi"],
  ["マツモト", "matsumoto"],
  ["ヤマザキ", "yamazaki"],
  ["アベ", "abe"],
  ["ヤマシタ", "yamashita"],
  ["ナカジマ", "nakajima"],
  ["イシイ", "ishii"],
  ["サカモト", "sakamoto"],
  ["エンドウ", "endo"],
  ["アオキ", "aoki"],
  ["フジイ", "fujii"],
  ["フクダ", "fukuda"],
  ["オオタ", "oota"],
  ["ミウラ", "miura"],
  ["フジワラ", "fujiwara"],
  ["オカモト", "okamoto"],
  ["マツダ", "matsuda"],
  ["ナカガワ", "nakagawa"],
  ["ナカノ", "nakano"],
  ["ハラダ", "harada"],
  ["オノ", "ono"],
  ["タムラ", "tamura"],
  ["タケウチ", "takeuchi"],
  ["カネコ", "kaneko"],
  ["ワダ", "wada"],
  ["ナカヤマ", "nakayama"],
  ["イシダ", "ishida"],
  ["モリタ", "morita"],
  ["ハラ", "hara"],
  ["シバタ", "shibata"],
  ["サカイ", "sakai"],
  ["クドウ", "kudo"],
  ["ヨコヤマ", "yokoyama"],
  ["ミヤザキ", "miyazaki"],
  ["ミヤモト", "miyamoto"],
  ["ウチダ", "uchida"],
  ["タカギ", "takagi"],
  ["アンドウ", "ando"],
  ["シマダ", "shimada"],
  ["タニグチ", "taniguchi"],
  ["オオノ", "oono"],
  ["タカダ", "takada"],
  ["マルヤマ", "maruyama"],
  ["イマイ", "imai"],
  ["コウノ", "kouno"],
  ["フジモト", "fujimoto"],
  ["ムラタ", "murata"],
  ["タケダ", "takeda"],
  ["ウエノ", "ueno"],
  ["スギヤマ", "sugiyama"],
  ["マスダ", "masuda"],
  ["コヤマ", "koyama"],
  ["ヒラノ", "hirano"],
  ["スガワラ", "sugawara"],
  ["チバ", "chiba"],
  ["イワサキ", "iwasaki"],
  ["サクライ", "sakurai"],
  ["キノシタ", "kinoshita"],
  ["ノグチ", "noguchi"],
  ["マツオ", "matsuo"],
  ["キクチ", "kikuchi"],
  ["ノムラ", "nomura"],
  ["アライ", "arai"],
  ["サノ", "sano"],
  ["スギモト", "sugimoto"],
  ["オオニシ", "oonishi"],
  ["フルカワ", "furukawa"],
  ["ハマダ", "hamada"],
  ["イチカワ", "ichikawa"],
  ["コマツ", "komatsu"],
  ["タカノ", "takano"],
  ["ミズノ", "mizuno"],
  ["ヨシカワ", "yoshikawa"],
  ["ヤマウチ", "yamauchi"],
  ["ニシダ", "nishida"],
  ["ニシカワ", "nishikawa"],
  ["キタムラ", "kitamura"],
  ["ヤスダ", "yasuda"],
  ["イガラシ", "igarashi"],
  ["カワグチ", "kawaguchi"],
  ["セキ", "seki"],
  ["ナカタ", "nakata"],
  ["ヒラタ", "hirata"],
  ["ハマノ", "hamano"],
  ["イワタ", "iwata"],
];

/**
 * friend（リア友）の背景メンバー名（#170）。表示名はあだ名のカタカナ、
 * ハンドルは `sho_0214` のようなそれらしい英数字にする（リア友6人と同じ流儀）。
 */
const FRIEND_NAMES: ReadonlyArray<readonly [displayName: string, stem: string]> = [
  ["ショウ", "sho"],
  ["ダイキ", "daiki"],
  ["ヒロ", "hiro"],
  ["マサ", "masa"],
  ["アヤ", "aya"],
  ["エリ", "eri"],
  ["カナ", "kana"],
  ["サキ", "saki"],
  ["リナ", "rina"],
  ["コウ", "kou"],
  ["タイチ", "taichi"],
  ["シュン", "shun"],
  ["マナ", "mana"],
];

/** ハンドルの数字部。MMDD 風の4桁を index から決定的に作る（アンネームドの `taku_1129` と同じ形）。 */
const handleSuffix = (index: number): string =>
  `${String(1 + ((index * 5 + 3) % 12)).padStart(2, "0")}${String(1 + ((index * 11 + 7) % 28)).padStart(2, "0")}`;

/** 背景の人の表示名とハンドル。所属サーバーに合わせ、mhc と未割当の余りはハンター名のまま。 */
const backgroundName = (index: number, n: string): Pick<User, "displayName" | "handle"> => {
  if (index >= UNIV_FROM && index < UNIV_FROM + BACKGROUND_SPLIT.univ) {
    const local = index - UNIV_FROM;
    const [displayName, stem] = UNIV_NAMES[local];
    return { displayName, handle: `${stem}_${handleSuffix(local)}` };
  }
  if (index >= FRIEND_FROM && index < FRIEND_FROM + BACKGROUND_SPLIT.friend) {
    const local = index - FRIEND_FROM;
    const [displayName, stem] = FRIEND_NAMES[local];
    return { displayName, handle: `${stem}_${handleSuffix(local)}` };
  }
  return { displayName: `ハンター${n}`, handle: `hunter_${n}` };
};

/** 背景のうちオンライン12・離席中9・取り込み中3（ネームドと合わせて全体で 30/10/4）。残りはオフライン。 */
const OFFLINE = "offline" as const;
const STATUS_BY_INDEX = new Map<number, User["status"]>([
  ...[0, 29, 58, 87, 116, 145, 174, 203, 232, 261, 290, 319].map(
    (index) => [index, "online"] as const,
  ),
  ...[7, 41, 73, 106, 139, 171, 204, 237, 269].map((index) => [index, "idle"] as const),
  ...[13, 67, 121].map((index) => [index, "dnd"] as const),
]);

/** 背景の人を作る（Math.random は使わない。並びも固定）。 */
export function buildBackgroundUsers(): User[] {
  return Array.from({ length: BACKGROUND_COUNT }, (_, index) => {
    const n = String(index + 1).padStart(4, "0");
    return {
      id: `bg-${n}`,
      ...backgroundName(index, n),
      avatarColor: PALETTE[index % PALETTE.length],
      status: STATUS_BY_INDEX.get(index) ?? OFFLINE,
    };
  });
}

export const backgroundUsers: User[] = buildBackgroundUsers();
