import { Composer } from "@/components/twitter-like/composer";
import { HomeTabs } from "@/components/twitter-like/home-tabs";
import { replyTargetAuthor, usersById } from "@/components/twitter-like/lookup";
import { PostCard } from "@/components/twitter-like/post-card";
import { RightSidebar } from "@/components/twitter-like/right-sidebar";
import { getPost, listPosts } from "@/lib/twitter-like";
import type { Post, TwitterUser } from "@/lib/twitter-like/types";

export const metadata = { title: { absolute: "ホーム | Twixer" } };

/** タイムラインはトップレベルの投稿のみ。返信は個別投稿ページとプロフィールに出す。 */
export default function TwitterTimelinePage() {
  const users = usersById();
  const posts = listPosts().filter((post) => !post.replyToId);
  const me = users.get("tw-hal");

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

  // 「フォロー中」は hal がフォローしている人物の投稿だけ（公式まとめアカは除外）
  const forYou = <div>{posts.map((post) => renderPost(post, users))}</div>;
  const following = (
    <div>
      {posts
        .filter((post) => post.authorId !== "tw-gameinfo")
        .map((post) => renderPost(post, users))}
    </div>
  );

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
