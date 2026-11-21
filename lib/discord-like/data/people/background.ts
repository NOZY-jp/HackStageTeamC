import type { User } from "../../types";

/**
 * 背景の350人。会話には出ない（発言0件）。
 * ID と表示名は規則で決定的に作る（乱数は使わない）。
 * 状態は全体で「online 30・idle 10・dnd 4・offline 356」になるよう、固定のインデックスで決める。
 */
const BACKGROUND_COUNT = 350;
const PALETTE = ["#5865f2", "#eb459e", "#57f287", "#fee75c", "#9b59b6", "#e67e22", "#1abc9c"];

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
      displayName: `ハンター${n}`,
      handle: `hunter_${n}`,
      avatarColor: PALETTE[index % PALETTE.length],
      status: STATUS_BY_INDEX.get(index) ?? OFFLINE,
    };
  });
}

export const backgroundUsers: User[] = buildBackgroundUsers();
