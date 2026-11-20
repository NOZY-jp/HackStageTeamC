import { PaneToggles } from "./pane-toggles";

/** 通常行のバー幅（行ごとに変えて、文章に見えるようにする）。 */
const ROWS = [
  { name: 88, lines: [84, 52] },
  { name: 64, lines: [68, 44] },
  { name: 76, lines: [92, 60] },
  { name: 56, lines: [74, 38] },
  { name: 82, lines: [64, 56] },
  { name: 60, lines: [86, 46] },
];

/**
 * チャンネル切替中のメッセージ欄スケルトン（#70）。
 * 本家 Discord と同じく、前のメッセージの続きに見える見切れ行1つ＋通常行6つ。
 * ヘッダーと入力欄は実物と同じ高さで置き、切り替わりでガタつかせない。
 */
export function MessageLoadingSkeleton() {
  return (
    <main id="app-main" className="app-main" aria-label="メッセージを読み込み中">
      <div className="app-main-body">
        <header className="pane-header message-header">
          <PaneToggles />
          <span className="skeleton-block message-loading-title" aria-hidden="true" />
        </header>

        <div className="pane-scroll message-scroll">
          <div className="message-loading" aria-hidden="true">
            {/* 上端で見切れているアバター＋大きな矩形＝前のメッセージの続き */}
            <div className="message-loading-row message-loading-row--partial">
              <span className="skeleton-block message-loading-avatar" />
              <span className="message-loading-lines">
                <span className="skeleton-block message-loading-block" />
                <span className="skeleton-block message-loading-line" style={{ width: "42%" }} />
              </span>
            </div>

            {ROWS.map((row) => (
              <div className="message-loading-row" key={`${row.name}-${row.lines[0]}`}>
                <span className="skeleton-block message-loading-avatar" />
                <span className="message-loading-lines">
                  <span
                    className="skeleton-block message-loading-name"
                    style={{ width: `${row.name}px` }}
                  />
                  {row.lines.map((width) => (
                    <span
                      key={width}
                      className="skeleton-block message-loading-line"
                      style={{ width: `${width}%` }}
                    />
                  ))}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 入力欄は実物と同じ高さの置き場所だけ確保する */}
        <div className="message-composer-area" aria-hidden="true">
          <div className="message-composer">
            <span className="skeleton-block message-loading-composer" />
          </div>
        </div>

        <p className="visually-hidden" role="status">
          メッセージを読み込んでいます
        </p>
      </div>
    </main>
  );
}
