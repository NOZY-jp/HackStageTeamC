import { notFound } from "next/navigation";

/** サービスのトップは作らない（ブログの URL を直接開く前提）。 */
export default function PochibloTopPage() {
  notFound();
}
