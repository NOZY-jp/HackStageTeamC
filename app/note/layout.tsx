import type { Metadata } from "next";
import Link from "next/link";
import { SERVICE_NAME } from "@/lib/note";
import "./note.css";

export const metadata: Metadata = {
  title: {
    default: SERVICE_NAME,
    template: `%s｜${SERVICE_NAME}`,
  },
  description: "書き置きみたいに、長い話を残しておける場所。",
};

export default function NoteLayout({ children }: LayoutProps<"/note">) {
  return (
    <div className="note-root">
      <header className="sticky top-0 z-10 border-b border-(--note-line) bg-(--note-bg)/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center px-4">
          <Link href="/note" className="text-xl font-bold tracking-tight">
            {SERVICE_NAME}
          </Link>
        </div>
      </header>
      <main>{children}</main>
      <footer className="mt-16 border-t border-(--note-line) py-8 text-center text-xs text-(--note-text-muted)">
        © {SERVICE_NAME}
      </footer>
    </div>
  );
}
