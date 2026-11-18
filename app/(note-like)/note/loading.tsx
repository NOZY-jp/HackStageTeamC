const LINES = [60, 92, 84, 96, 70, 88];

/** 読み込み中のスケルトン（本文幅の行だけ）。 */
export default function NoteLoading() {
  return (
    <div className="note-page" data-width="article">
      <div className="note-skeleton" aria-hidden="true">
        {LINES.map((width) => (
          <span key={width} className="note-skeleton-line" style={{ width: `${width}%` }} />
        ))}
      </div>
      <p className="visually-hidden" role="status">
        読み込み中
      </p>
    </div>
  );
}
