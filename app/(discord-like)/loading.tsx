const SIDEBAR_ROWS = [80, 64, 72, 56, 68, 60, 76, 52];
const MAIN_ROWS = [220, 180, 260, 140, 200, 160];

/** 読み込み中のスケルトン。3ペインの構造（レールは layout 側）を保つ。 */
export default function AppLoading() {
  return (
    <>
      <div className="app-sidebar" aria-hidden="true">
        <div className="pane-header">
          <span className="skeleton-block skeleton-header" />
        </div>
        <div className="pane-scroll skeleton-pane">
          {SIDEBAR_ROWS.map((width) => (
            <span
              key={width}
              className="skeleton-block skeleton-row"
              style={{ width: `${width}%` }}
            />
          ))}
        </div>
      </div>

      <div className="app-main">
        <div className="pane-header" aria-hidden="true">
          <span className="skeleton-block skeleton-header" />
        </div>
        <div className="pane-scroll skeleton-pane" aria-hidden="true">
          {MAIN_ROWS.map((width) => (
            <span
              key={width}
              className="skeleton-block skeleton-line"
              style={{ width: `${width}px` }}
            />
          ))}
        </div>
        <p className="visually-hidden" role="status">
          読み込み中
        </p>
      </div>
    </>
  );
}
