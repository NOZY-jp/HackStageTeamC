import { notFound } from "next/navigation";
import { lastCallMinutes } from "@/app/(discord-like)/_components/call-history";
import { ChannelNotFound } from "@/app/(discord-like)/_components/channel-not-found";
import { channelFallback } from "@/app/(discord-like)/_components/channel-route-fallback";
import { DmNotFound } from "@/app/(discord-like)/_components/dm-not-found";
import { MessagePane } from "@/app/(discord-like)/_components/message-pane";
import { SELF_USER_ID } from "@/app/(discord-like)/_components/self-user";
import { StartCallLink } from "@/app/(discord-like)/_components/start-call-link";
import { VoiceChannelView } from "@/app/(discord-like)/_components/voice-channel-view";
import {
  getChannel,
  getDMThread,
  getGuild,
  getUser,
  listDMMessages,
  listMessages,
  listVoiceSessions,
  listVoiceStates,
  loadUntil,
} from "@/lib/discord-like";
import { resolveChannelRoute } from "@/lib/discord-like/route-resolution";
import { listMemberViews, toMessageView } from "@/lib/discord-like/view";
import { dmThreadPath } from "@/lib/platform/app-prefix";
import { BLOG_TALK_MESSAGE_ID, KAI_NICKNAME_ADVICE_MESSAGE_ID } from "@/lib/story/places";

/**
 * Discord と同じ2セグメント構成。
 * - `/<app>/channels/@me/<dmChannelId>` → DMスレッド
 * - `/<app>/channels/<guildId>/<channelId>` → サーバーのチャンネル
 */
export default async function ChannelPage({
  params,
  searchParams,
}: {
  params: Promise<{ guildId: string; channelId: string }>;
  searchParams: Promise<{ m?: string | string[] }>;
}) {
  const [{ guildId, channelId }, query] = await Promise.all([params, searchParams]);
  const focus = typeof query.m === "string" ? query.m : undefined;
  const route = resolveChannelRoute(guildId, channelId);

  switch (route.kind) {
    case "dm":
      return <DmThread threadId={route.threadId} focusMessageId={focus} />;
    case "dm-missing":
      // DM は旧画面と同じ専用の未検出UI（not-found.tsx は動的パラメータを受け取れない）
      return <DmNotFound />;
    case "channel":
      return (
        <GuildChannel guildId={route.guildId} channelId={route.channelId} focusMessageId={focus} />
      );
    default: {
      // 一覧の有無とボタンの文言・戻り先をケースごとに揃える（#70）
      const fallback = channelFallback(guildId);
      return (
        <ChannelNotFound
          serverHref={fallback.href}
          backLabel={fallback.label}
          withSidebar={fallback.hasServer}
        />
      );
    }
  }
}

async function DmThread({
  threadId,
  focusMessageId,
}: {
  threadId: string;
  focusMessageId?: string;
}) {
  const thread = getDMThread(threadId);
  if (!thread) {
    return <DmNotFound />;
  }

  const otherId =
    thread.participantIds.find((participantId) => participantId !== SELF_USER_ID) ??
    thread.participantIds[0];
  const other = getUser(otherId);
  const otherName = other?.displayName ?? otherId;

  // 検索からジャンプしてきたときは、そのメッセージを含むところまで遡って表示する
  const focused = focusMessageId
    ? loadUntil({ threadId: thread.id, messageId: focusMessageId })
    : undefined;
  const page = focused?.found ? focused : listDMMessages({ threadId: thread.id });

  return (
    <MessagePane
      channelKey={thread.id}
      mode="dm"
      initialView={toMessageView(page)}
      title={otherName}
      voiceSessions={listVoiceSessions({ channelId: thread.id })}
      showHash={false}
      headerAvatar={{ displayName: otherName, avatarColor: other?.avatarColor ?? "transparent" }}
      // 段階1: MaiMai の「攻略ブログ」の発言が画面に見えたらフラグを立てる（検索ジャンプ・過去ログの閲覧のどちらでも届く）
      // True End 手がかり1: カイとのDMで「でんちゃん」の助言が画面に見えたら te01-kai-nickname を立てる
      seen={
        thread.id === "dm-maimai"
          ? { messageId: BLOG_TALK_MESSAGE_ID, flag: "s01-blog-talk" }
          : thread.id === "dm-kai"
            ? { messageId: KAI_NICKNAME_ADVICE_MESSAGE_ID, flag: "te01-kai-nickname" }
            : undefined
      }
      headerAction={
        // DM の通話画面への導線（通話を開始する）
        <StartCallLink
          href={`${dmThreadPath(thread.urlId)}/call`}
          className="message-header-icon message-header-button"
          ariaLabel="通話を開始"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 3h3l2 5-2 1a11 11 0 0 0 6 6l1-2 5 2v3a3 3 0 0 1-3 3A16 16 0 0 1 3 6a3 3 0 0 1 3-3Z" />
          </svg>
        </StartCallLink>
      }
      focusMessageId={focused?.found ? focusMessageId : undefined}
    />
  );
}

async function GuildChannel({
  guildId,
  channelId,
  focusMessageId,
}: {
  guildId: string;
  channelId: string;
  focusMessageId?: string;
}) {
  const guild = getGuild(guildId);
  const channel = getChannel(channelId);

  if (!guild || !channel) {
    notFound();
  }

  const members = listMemberViews(guild.id);
  // True End 手がかり2: 旧アカウント発見をカイに報告したあと、mhc のメンバー一覧にカイが加わる
  const kaiUser = guild.id === "mhc" ? getUser("kai") : undefined;
  const storyMember = kaiUser
    ? {
        member: {
          id: kaiUser.id,
          displayName: kaiUser.displayName,
          handle: kaiUser.handle,
          avatarColor: kaiUser.avatarColor,
          status: kaiUser.status,
          profileUrl: kaiUser.profileUrl,
        },
        showWhenFlag: "toldKaiOldAccount" as const,
        onOpenFlag: "te02-kai-joined-mhc" as const,
        note: "最近このサーバーに参加",
      }
    : undefined;
  // 検索からジャンプしてきたときは、そのメッセージを含むところまで遡って表示する
  const focused = focusMessageId
    ? loadUntil({ channelId: channel.id, messageId: focusMessageId })
    : undefined;
  const page = focused?.found ? focused : listMessages({ channelId: channel.id });
  const selfUser = getUser(SELF_USER_ID);
  const currentUser = {
    id: SELF_USER_ID,
    displayName: selfUser?.displayName ?? "自分",
    avatarColor: selfUser?.avatarColor ?? "transparent",
  };

  return (
    <>
      {channel.kind === "text" ? (
        <MessagePane
          channelKey={channel.id}
          mode="channel"
          initialView={toMessageView(page)}
          title={channel.name}
          voiceSessions={listVoiceSessions({ channelId: channel.id })}
          topic={channel.topic}
          showHash
          members={members}
          storyMember={storyMember}
          focusMessageId={focused?.found ? focusMessageId : undefined}
        />
      ) : (
        <VoiceChannelView
          guildId={channel.guildId}
          guildUrlId={guild.urlId}
          channelId={channel.id}
          channelUrlId={channel.urlId}
          channelName={channel.name}
          currentUser={currentUser}
          lastSessionMinutes={lastCallMinutes(
            listVoiceSessions({ channelId: channel.id, scope: "guild" }),
            channel.id,
          )}
          participants={listVoiceStates(channel.id).map((state) => {
            const user = getUser(state.userId);
            return {
              id: state.userId,
              displayName: user?.displayName ?? state.userId,
              avatarColor: user?.avatarColor ?? "transparent",
              speaking: state.speaking,
              muted: state.muted,
              deafened: state.deafened,
            };
          })}
        />
      )}
    </>
  );
}
