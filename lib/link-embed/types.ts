/**
 * メッセージ本文のURLに出す埋め込みカードの内容（Discord 風プレビュー）。
 * クライアント部品も import するので、ここにはデータ層を import しない。
 */
export type LinkEmbed = {
  /** カードを押したときのアプリ内パス（外部ブラウザは開かない） */
  href: string;
  /** カード左上の小さなサイト名（例: "Twixer"） */
  siteName: string;
  /** カードのタイトル（例: 投稿者名や記事タイトル） */
  title: string;
  /** タイトルの下の説明（例: 本文の頭。長いときは CSS で折る） */
  description?: string;
  /** 左の帯の色（対象サイトのイメージカラー。HEX） */
  accentColor: string;
  /** 右端の小さな画像（対象データが画像を持つときだけ） */
  thumbnail?: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
};
