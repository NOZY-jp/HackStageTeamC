/**
 * いまのデータにある、分かっている違反（直す Issue があるもの）。
 * 検査は、ここに無い違反（新しく増えたもの）で失敗する。直ったものがここに残っていても失敗する（一覧を減らしていくため）。
 *
 * 足すのは「すぐには直せず、直す Issue がある」ときだけ。issue を必ず書く。
 * key は「決まりの ID」「プラットフォーム/データ/ID」「違反内容」（検査の失敗の表示をそのまま写す）。
 */
export const KNOWN_ISSUES: { key: string; issue: string; note: string }[] = [
  {
    key: "story-only-phrase discord/dmMessages/dm-kai-0003 … 物語で届くはずの「本名で検索したら」が、静的なデータにある",
    issue: "#119",
    note: "カイの「本名で検索したら」は、物語の進み具合に合わせて届ける（#159 で静的なデータから外す）",
  },
  {
    key: "story-only-phrase discord/dmMessages/dm-kai-0005 … 物語で届くはずの「住所を特定しました」が、静的なデータにある",
    issue: "#119",
    note: "結末の「住所を特定しました」は、プレイヤーの操作で送る（#159 で静的なデータから外す）",
  },
];
