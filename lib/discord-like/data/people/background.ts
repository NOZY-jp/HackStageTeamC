import type { User } from "../../types";

/** 背景の350人。会話には出ない（発言0件）。ID と表示名は規則で決定的に作る（乱数は使わない）。 */
const BACKGROUND_COUNT = 350;
const PALETTE = ["#5865f2", "#eb459e", "#57f287", "#fee75c", "#9b59b6", "#e67e22", "#1abc9c"];

/** 背景の人を作る（Math.random は使わない。並びも固定）。 */
export function buildBackgroundUsers(): User[] {
  return Array.from({ length: BACKGROUND_COUNT }, (_, index) => {
    const n = String(index + 1).padStart(4, "0");
    const online = index % 29 === 0 && index < 12 * 29; // 決定的に一部だけオンライン
    return {
      id: `bg-${n}`,
      displayName: `ハンター${n}`,
      handle: `hunter_${n}`,
      avatarColor: PALETTE[index % PALETTE.length],
      status: online ? "online" : index % 6 === 0 ? "idle" : "offline",
    };
  });
}

export const backgroundUsers: User[] = buildBackgroundUsers();
