"use client";

import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";

export type VoiceConnection = {
  guildId: string;
  channelId: string;
  channelName: string;
  /** 見た目だけの状態（デバイスには触らない） */
  muted: boolean;
  deafened: boolean;
};

type VoiceControls = {
  connection: VoiceConnection | null;
  join: (target: { guildId: string; channelId: string; channelName: string }) => void;
  leave: () => void;
  toggleMute: () => void;
  toggleDeafen: () => void;
};

const VoiceContext = createContext<VoiceControls | null>(null);

export function useVoice(): VoiceControls {
  const controls = useContext(VoiceContext);
  if (!controls) {
    throw new Error("useVoice は VoiceProvider の内側でだけ使えます");
  }
  return controls;
}

/**
 * 疑似参加の状態だけを持つ。実音声・マイク権限・WebRTC は一切使わない。
 * 同時に接続できるのは1件だけで、別のVCに参加すると前の接続は置き換わる。
 * 状態はメモリのみ（リロードで消える）。
 */
export function VoiceProvider({ children }: { children: ReactNode }) {
  const [connection, setConnection] = useState<VoiceConnection | null>(null);

  const join = useCallback(
    (target: { guildId: string; channelId: string; channelName: string }) => {
      setConnection({
        guildId: target.guildId,
        channelId: target.channelId,
        channelName: target.channelName,
        muted: false,
        deafened: false,
      });
    },
    [],
  );

  const leave = useCallback(() => {
    setConnection(null);
  }, []);

  const toggleMute = useCallback(() => {
    setConnection((current) => (current ? { ...current, muted: !current.muted } : current));
  }, []);

  const toggleDeafen = useCallback(() => {
    setConnection((current) => (current ? { ...current, deafened: !current.deafened } : current));
  }, []);

  const controls = useMemo<VoiceControls>(
    () => ({ connection, join, leave, toggleMute, toggleDeafen }),
    [connection, join, leave, toggleMute, toggleDeafen],
  );

  return <VoiceContext.Provider value={controls}>{children}</VoiceContext.Provider>;
}
