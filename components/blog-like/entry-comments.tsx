import { type Comment, formatDate } from "@/lib/blog-like";

/** 記事の下に出すコメント一覧（投稿者・日付・本文）。 */
export function EntryComments({ comments }: { comments: Comment[] }) {
  if (comments.length === 0) {
    return null;
  }
  return (
    <section className="pb-comments" aria-label={`コメント（${comments.length}）`}>
      <h2 className="pb-comments-title">コメント（{comments.length}）</h2>
      <ol className="pb-comments-list">
        {comments.map((comment) => (
          <li key={comment.id} className="pb-comment">
            <p className="pb-comment-meta">
              <span className="pb-comment-author">{comment.authorName}</span>
              <time className="pb-comment-date" dateTime={comment.postedAt}>
                {formatDate(comment.postedAt)}
              </time>
            </p>
            <p className="pb-comment-body">{comment.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
