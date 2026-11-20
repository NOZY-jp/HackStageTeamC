import { describe, expect, it } from "vitest";
import { cast } from "./cast";
import {
  applyTrigger,
  availableScenes,
  completeScene,
  emptyProgress,
  isChoiceAvailable,
} from "./engine";
import { flags, triggers } from "./flags";
import { ENDING_ADDRESS_CONFIRMED, scenes } from "./script";
import type { Progress } from "./types";

const castIds = new Set(cast.map((member) => member.id));
const flagIds = new Set(flags.map((flag) => flag.id));

/** 台本を、きっかけ→選択肢（各場面は最初の選択肢）の順で最後まで進める。 */
function playThrough(): Progress {
  const progress: Progress = { flags: [], completedScenes: [], choices: {} };
  for (const trigger of triggers) {
    progress.flags = [...new Set([...progress.flags, ...trigger.setsFlags])];
  }
  for (let guard = 0; guard < scenes.length * 2; guard += 1) {
    const next = scenes.find(
      (scene) =>
        !progress.completedScenes.includes(scene.id) &&
        scene.requires.every((flag) => progress.flags.includes(flag)),
    );
    if (!next) {
      break;
    }
    const choice = next.choices[0];
    progress.flags = [
      ...new Set([...progress.flags, ...next.completesFlags, ...(choice?.setsFlags ?? [])]),
    ];
    progress.completedScenes.push(next.id);
    if (choice) {
      progress.choices[next.id] = [choice.id];
    }
  }
  return progress;
}

describe("台本の整合性（#81）", () => {
  it("場面IDは重複しない", () => {
    const ids = scenes.map((scene) => scene.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("場面の選択肢IDは場面の中で重複しない", () => {
    for (const scene of scenes) {
      const ids = scene.choices.map((choice) => choice.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
    // 選択肢が無い場面は「場面を終える」で完了する（ch4 だけ）
    const withoutChoices = scenes.filter((scene) => scene.choices.length === 0).map((s) => s.id);
    expect(withoutChoices).toEqual(["ch4-matching"]);
  });

  it("出てくる人物は全員台帳にいる", () => {
    for (const scene of scenes) {
      expect(scene.lines.length).toBeGreaterThan(0);
      for (const line of scene.lines) {
        expect(castIds.has(line.speakerId), line.speakerId).toBe(true);
      }
    }
  });

  it("彼女（mai）を話者にしない（冒頭から連絡がつかない・進行役はカイだけ）", () => {
    const speakers = scenes.flatMap((scene) => scene.lines.map((line) => line.speakerId));
    expect(speakers).not.toContain("mai");
    // 台本に「でんちゃん」の経路が2段階（コメント欄で見つける→カイに相談）で入っている
    const flagsUsed = scenes.flatMap((scene) => [
      ...scene.requires,
      ...scene.choices.flatMap((choice) => [...choice.setsFlags, ...(choice.requires ?? [])]),
    ]);
    expect(flagsUsed).toContain("denchan_found");
    expect(flagsUsed).toContain("denchan_confirmed");
    // かのんはリョウと知り合いではないので、ch4 もリョウの独白にする
    const ch4 = scenes.find((scene) => scene.id === "ch4-matching");
    expect(ch4?.lines.every((line) => line.speakerId === "ryo")).toBe(true);
    expect(ch4?.lines.some((line) => line.speakerId === "kanon")).toBe(false);
    // 順序9: 検索はカイの助言（ch3）で行い、「その場所に行ってみる」は置かない
    const ch3 = scenes.find((scene) => scene.id === "ch3-kai");
    expect(
      ch3?.lines.some((line) => line.speakerId === "kai" && line.text.includes("Facebook")),
    ).toBe(true);
    expect(ch3?.choices.map((choice) => choice.id)).toEqual(["search-name", "ask-kai"]);
    expect(ch3?.choices.some((choice) => choice.label.includes("その場所に行って"))).toBe(false);
    expect(
      scenes.some((scene) => scene.choices.some((c) => c.label.includes("その場所に行って"))),
    ).toBe(false);
    expect(ch3?.choices[0].setsFlags).toContain("facebook_search");
    // 順序10: 照合は ch4（選択肢なしで完了し、終了を出す）。でんちゃんは前提にしない
    expect(ch4?.choices).toHaveLength(0);
    expect(ch4?.requires).toEqual(["facebook_search"]);
    expect(ch4?.requires.some((flag) => flag.startsWith("denchan_"))).toBe(false);
    // 正本の終了条件は「住所を特定しました」で終わる（住所データは作らない）
    expect(ENDING_ADDRESS_CONFIRMED).toBe("住所を特定しました");
    expect(ch4?.ending).toBe(ENDING_ADDRESS_CONFIRMED);
    // 「カイに相談する」は任意で、選んだ直後にカイの助言が続く
    const consult = ch3?.choices.find((choice) => choice.id === "ask-kai");
    expect(consult?.requires).toEqual(["denchan_found"]);
    expect(consult?.replyLines?.[0].speakerId).toBe("kai");
    expect(consult?.replyLines?.[0].text).toContain("でんちゃん");
  });

  it("どの選択肢を選んでも最後まで到達できる（デッドエンド0件）", () => {
    type Pick = { sceneId: string; choiceId: string };
    const runToEnd = (force?: Pick): Progress => {
      let progress = emptyProgress();
      for (const trigger of triggers) {
        progress = applyTrigger(progress, trigger);
      }
      const tried = new Map<string, Set<string>>();
      for (let guard = 0; guard < 40; guard += 1) {
        const scene = availableScenes(progress)[0];
        if (!scene) break;
        if (scene.choices.length === 0) {
          progress = completeScene(progress, scene);
          continue;
        }
        const used = tried.get(scene.id) ?? new Set<string>();
        // 寄り道で同じ場面に残るので、強制する選択肢は1回だけ使う
        const forced =
          force?.sceneId === scene.id && !used.has(force.choiceId)
            ? scene.choices.find((choice) => choice.id === force.choiceId)
            : undefined;
        const choice =
          (forced && isChoiceAvailable(progress, forced) ? forced : undefined) ??
          scene.choices.find(
            (candidate) => !used.has(candidate.id) && isChoiceAvailable(progress, candidate),
          );
        if (!choice) break;
        used.add(choice.id);
        tried.set(scene.id, used);
        progress = completeScene(progress, scene, choice.id);
      }
      return progress;
    };

    // すべての場面・すべての選択肢を1つずつ選ぶ経路で、ch4 完了（結末）まで届く
    for (const scene of scenes) {
      for (const choice of scene.choices) {
        const progress = runToEnd({ sceneId: scene.id, choiceId: choice.id });
        expect(progress.completedScenes, `${scene.id}/${choice.id}`).toContain("ch4-matching");
        expect(progress.flags, `${scene.id}/${choice.id}`).toContain("facebook_search");
        expect(progress.completedScenes).toHaveLength(scenes.length);
      }
    }
  });

  it("ch2 のどちらの選択肢でもかのんの写真を見たことになり、ch3 に進める", () => {
    const ch2 = scenes.find((scene) => scene.id === "ch2-contest");
    for (const choice of ch2?.choices ?? []) {
      expect(choice.setsFlags, choice.id).toContain("bff_photos_seen");
    }
  });

  it("台本とフラグ定義のIDが一致する（未定義のフラグを使わない）", () => {
    const used = [
      ...scenes.flatMap((scene) => [
        ...scene.requires,
        ...scene.completesFlags,
        ...scene.choices.flatMap((choice) => choice.setsFlags),
      ]),
      ...triggers.flatMap((trigger) => trigger.setsFlags),
    ];
    for (const flag of used) {
      expect(flagIds.has(flag), flag).toBe(true);
    }
  });

  it("きっかけか台本のどこかで、すべてのフラグが立つ", () => {
    const raised = new Set([
      ...triggers.flatMap((trigger) => trigger.setsFlags),
      ...scenes.flatMap((scene) => [
        ...scene.completesFlags,
        ...scene.choices.flatMap((choice) => choice.setsFlags),
      ]),
    ]);
    for (const flag of flags) {
      expect(raised.has(flag.id), flag.id).toBe(true);
    }
  });

  it("必要なフラグは、その場面より前に立つ（最後まで進められる）", () => {
    const progress = playThrough();
    expect(progress.completedScenes).toHaveLength(scenes.length);
    expect(progress.completedScenes).toEqual(scenes.map((scene) => scene.id));
  });

  it("台帳のアカウント行は key が重複しない（同じ platform を2つ持つ人だけ handle で分かれる）", () => {
    for (const member of cast) {
      const keys = member.accounts.map(
        (account) => `${member.id}-${account.platform}-${account.handle}`,
      );
      expect(new Set(keys).size, member.id).toBe(keys.length);
      // 旧垢の表示名も台帳から読める
      for (const account of member.accounts) {
        if (account.platform === "discord" || account.platform === "twixer") {
          expect(typeof account.handle).toBe("string");
        }
      }
    }
  });

  it("章は決められた4つだけ", () => {
    const chapters = new Set(scenes.map((scene) => scene.chapter));
    for (const chapter of chapters) {
      expect(["助言", "痕跡", "欠片", "現実"]).toContain(chapter);
    }
    expect(chapters.size).toBeGreaterThan(1);
  });
});
