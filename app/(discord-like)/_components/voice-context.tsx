"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

export type VoiceConnection = {
  guildId: string;
  channelId: string;
  channelName: string;
  /** 接続した時刻（通話時間の表示に使う。UI のみ） */
  joinedAt: string;
  /** 見た目だけの状態（デバイスには触らない） */
  muted: boolean;
  deafened: boolean;
};

type VoiceControls = {
  connection: VoiceConnection | null;
  /** 直前に退出した通話の長さ（#149 の表示用。UI のみ） */
  lastCall: { channelId: string; minutes: number } | null;
  /** ユーザーが明示的に「切断」したチャンネル（自動参加の抑止にだけ使う） */
  leftChannelId: string | null;
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
  const [lastCall, setLastCall] = useState<{ channelId: string; minutes: number } | null>(null);
  const [leftChannelId, setLeftChannelId] = useState<string | null>(null);
  const connectionRef = useRef<VoiceConnection | null>(null);
  connectionRef.current = connection;

  const join = useCallback(
    (target: { guildId: string; channelId: string; channelName: string }) => {
      // 参加できた時点で「切断」の印は役目を終える（同じチャンネルなら呼ばれない）
      setLeftChannelId(null);
      setConnection({
        guildId: target.guildId,
        channelId: target.channelId,
        channelName: target.channelName,
        joinedAt: new Date().toISOString(),
        muted: false,
        deafened: false,
      });
    },
    [],
  );

  const leave = useCallback(() => {
    const target = connectionRef.current;
    if (target) {
      // #149: 退出時に通話時間を残す（UI のみ。データは変えない）
      const minutes = Math.max(1, Math.round((Date.now() - Date.parse(target.joinedAt)) / 60000));
      setLastCall({ channelId: target.channelId, minutes });
    }
    // 明示的な切断はチャンネル単位で記録する（自動参加の抑止に使う）
    setLeftChannelId(target?.channelId ?? null);
    setConnection(null);
  }, []);

  const toggleMute = useCallback(() => {
    setConnection((current) => (current ? { ...current, muted: !current.muted } : current));
  }, []);

  const toggleDeafen = useCallback(() => {
    setConnection((current) => (current ? { ...current, deafened: !current.deafened } : current));
  }, []);

  const controls = useMemo<VoiceControls>(
    () => ({ connection, lastCall, leftChannelId, join, leave, toggleMute, toggleDeafen }),
    [connection, lastCall, leftChannelId, join, leave, toggleMute, toggleDeafen],
  );

  return <VoiceContext.Provider value={controls}>{children}</VoiceContext.Provider>;
}
