import { Composer } from "@/components/twitter-like/composer";
import { HomeTabs } from "@/components/twitter-like/home-tabs";
import { replyTargetAuthor, usersById } from "@/components/twitter-like/lookup";
import { PostCard } from "@/components/twitter-like/post-card";
import { RightSidebar } from "@/components/twitter-like/right-sidebar";
import { getPost, listHomePosts, TWITTER_ME_ID } from "@/lib/twitter-like";
import type { Post, TwitterUser } from "@/lib/twitter-like/types";

export const metadata = { title: { absolute: "ホーム | Twixer" } };

/** ホームのタイムライン。トップレベルの投稿のみで、返信は個別投稿ページとプロフィールに出す。 */
export default function TwitterTimelinePage() {
  const users = usersById();
  const posts = listHomePosts(TWITTER_ME_ID);
  const me = users.get(TWITTER_ME_ID);

  const renderPost = (post: Post, users: Map<string, TwitterUser>) => {
    const author = users.get(post.authorId);
    return author ? (
      <PostCard
        key={post.id}
        post={post}
        author={author}
        replyTo={replyTargetAuthor(post, getPost, users)}
      />
    ) : null;
  };

  // 「おすすめ」も「フォロー中」も同じ並び：hal がフォローしている人（と自分）の
  // 投稿だけを出す。かのんは hal がまだ知らないのでホームには出さない。
  const forYou = <div>{posts.map((post) => renderPost(post, users))}</div>;
  const following = <div>{posts.map((post) => renderPost(post, users))}</div>;

  return (
    <>
      <main className="tw-main">
        <HomeTabs
          forYou={
            <>
              {me ? <Composer user={me} /> : null}
              {forYou}
            </>
          }
          following={
            <>
              {me ? <Composer user={me} /> : null}
              {following}
            </>
          }
        />
      </main>
      <RightSidebar />
    </>
  );
}
