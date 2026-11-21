import type { Message } from "../../types";

export const readConversationScripts = (
  scripts: Record<string, string>,
): Record<string, Message[]> =>
  Object.fromEntries(
    Object.entries(scripts).map(([channelId, script]) => {
      let day = "";
      const messages: Message[] = [];

      for (const line of script.split("\n")) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(line)) {
          day = line;
          continue;
        }
        const match = /^(\d{2}:\d{2})(?::(\d{2}))? (\w+)(!)? (.+)$/.exec(line);
        if (!day || !match) throw new Error(`台本の形式が不正です: ${channelId} ${line}`);
        const [, time, seconds = "17", authorId, system, body] = match;
        const sentAt = `${day}T${time}:${seconds}+09:00`;
        messages.push({
          id: `${channelId}-${day}-${time.replace(":", "")}${seconds}`,
          channelId,
          authorId,
          sentAt,
          body,
          ...(system ? { system: true } : {}),
        });
      }

      return [channelId, messages.sort((a, b) => a.sentAt.localeCompare(b.sentAt))];
    }),
  );
