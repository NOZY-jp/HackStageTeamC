import { describe, expect, it } from "vitest";
import { dmThreadPath } from "@/lib/platform/app-prefix";
import { completedChats, openedChatIds, unreadChats } from "./engine";
import { isAtPlace, isWithinPlace, normalizePathname, PLACES } from "./places";
import { call, chat, say, voice } from "./stage";
import { chatsOf, voiceAt } from "./stage/runner";
import { validateBeat } from "./stage/validate";
import type { Beat } from "./types";

const AT = "2026-11-20T10:52:00+09:00";

const beat: Beat = {
  id: "t-chat",
  chapter: 0,
  when: [],
  script: [
    say("kai", "前"),
    chat("discord:dm-maimai", "ryo", "送った", AT),
    say("kai", "間"),
    chat("discord:dm-maimai", "maimai", "届いた", AT),
  ],
};

describe("チャットの命令", () => {
  it("止まった位置までに流したメッセージだけを返す", () => {
    expect(chatsOf(beat.id, beat.script, 1)).toEqual([]);
    expect(chatsOf(beat.id, beat.script, 2).map((m) => m.text)).toEqual(["送った"]);
    expect(chatsOf(beat.id, beat.script).map((m) => m.id)).toEqual(["t-chat:1", "t-chat:3"]);
  });

  it("終わった場面のメッセージは、進行状態から組み立て直せる", () => {
    const state = { flags: [], completed: ["t-chat"], choices: {} };
    expect(completedChats(state, [beat]).map((m) => m.text)).toEqual(["送った", "届いた"]);
  });

  it("知らせはほかの人からのものだけで、その画面を開いていれば出さない", () => {
    const chats = chatsOf(beat.id, beat.script);
    expect(unreadChats(chats, [], "/").map((m) => m.text)).toEqual(["届いた"]);
    expect(unreadChats(chats, ["t-chat:3"], "/")).toEqual([]);
    expect(unreadChats(chats, [], PLACES["discord:dm-maimai"].href)).toEqual([]);
  });

  it("時刻の書き方が違うと検査で見つかる", () => {
    const bad: Beat = { ...beat, script: [chat("discord:dm-maimai", "ryo", "x", "11/20 10:52")] };
    expect(validateBeat(bad).length).toBeGreaterThan(0);
    expect(validateBeat(beat)).toEqual([]);
  });
});

describe("場面の起きる画面", () => {
  it("%40me でも同じDMの画面として扱う（#190）", () => {
    const plain = dmThreadPath("1187002356428841502");
    const encoded = plain.replace("@me", "%40me");
    expect(encoded).toContain("%40me");
    expect(isAtPlace(encoded, "discord:dm-kai")).toBe(true);
    expect(isAtPlace(`${encoded}/`, "discord:dm-kai")).toBe(true);
    expect(normalizePathname(encoded)).toBe(normalizePathname(plain));
    expect(normalizePathname(plain.toUpperCase())).toBe(normalizePathname(plain));
  });

  it("開いたDMの新着だけ既読になり、再マウントでは通知が残らない（#190）", () => {
    const plain = dmThreadPath("1187002356428841502");
    const encoded = plain.replace("@me", "%40me");
    const chat = {
      id: "ch5-kai-contact:0",
      channel: "discord:dm-kai" as const,
      from: "kai" as const,
      text: "今の進捗どう？",
      at: "2026-11-23T21:11:00+09:00",
    };
    expect(openedChatIds([chat], [], encoded)).toEqual([chat.id]);
    expect(openedChatIds([chat], [], plain)).toEqual([chat.id]);

    const seen = openedChatIds([chat], [], encoded);
    expect(openedChatIds([chat], seen, encoded)).toEqual([]);
    expect(openedChatIds([chat], seen, plain)).toEqual([]);
  });

  it("接頭辞で判定し、似た別の URL は含めない", () => {
    const dm = PLACES["discord:dm-maimai"].href;
    expect(isAtPlace(dm, "discord:dm-maimai")).toBe(true);
    expect(isAtPlace(`${dm}0`, "discord:dm-maimai")).toBe(false);
    expect(isAtPlace(dm, "discord")).toBe(true);
    expect(isAtPlace("/leaf", "discord")).toBe(false);
  });

  it("通話は、始まったあとなら Discord の別の画面に移っても続けてよい", () => {
    const text = "/discord.com/channels/1187002356428840961/1187002356428840963";
    expect(isAtPlace(text, "discord:vc-night")).toBe(false);
    expect(isWithinPlace(text, "discord:vc-night")).toBe(true);
    expect(isWithinPlace("/twitter", "discord:vc-night")).toBe(false);
    expect(isWithinPlace(text, "discord:dm-maimai")).toBe(false);
  });
});

describe("通話の命令", () => {
  const VC = "discord:mhc-vc-3" as const;
  const cues = [
    voice(VC, "ryo", "join"),
    voice(VC, "maimai", "join"),
    call("maimai", "話す"),
    voice(VC, "maimai", "mute"),
    call("maimai", "ミュート中に話す"),
    voice(VC, "ryo", "leave"),
  ];

  it("入る・ミュート・出るを順に反映し、通話の枠の行の人を「話している」にする", () => {
    expect(voiceAt(cues, 2, cues[2])).toEqual([
      {
        channel: VC,
        members: [
          { who: "ryo", muted: false },
          { who: "maimai", muted: false },
        ],
        speaking: "maimai",
      },
    ]);
    const muted = voiceAt(cues, 4, cues[4])[0];
    expect(muted?.members.find((m) => m.who === "maimai")?.muted).toBe(true);
    expect(muted?.speaking).toBeUndefined();
    expect(voiceAt(cues, 6)[0]?.members.map((m) => m.who)).toEqual(["maimai"]);
  });
});
