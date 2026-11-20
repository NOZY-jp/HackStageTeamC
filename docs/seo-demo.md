# Search Console の所有確認（デモ用メモ）

Google Search Console の所有確認は、**環境変数 `GOOGLE_SITE_VERIFICATION` にトークンを渡す方式を第一**とする（`app/layout.tsx` が `<meta name="google-site-verification">` を出す。未設定なら何も出さない）。トークンはリポジトリに書かず、Vercel の環境変数（Production / Preview）に設定する。

代替: 環境変数を設定できない場合は、Search Console が配る HTML ファイルを `public/google<token>.html` に置く方式でも確認できる（ビルド不要で差し替えられるが、トークン入りのファイルがリポジトリに残るため第一手段は環境変数）。
