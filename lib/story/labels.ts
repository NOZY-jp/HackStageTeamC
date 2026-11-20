import { EXTRA_FLAGS, type FlagId } from "./flags";
import { steps } from "./steps";

/** フラグの説明。段階のフラグは「段階N: 要約」 */
export function flagLabel(flag: FlagId): string {
  if (flag in EXTRA_FLAGS) {
    return EXTRA_FLAGS[flag as keyof typeof EXTRA_FLAGS];
  }
  const step = steps.find((candidate) => candidate.id === flag);
  return step ? `段階${step.order}: ${step.summary}` : flag;
}
