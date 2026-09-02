import { redirect } from "next/navigation";

// Корень — на /start; utm-метки сохраняем.
export default function RootPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (typeof v === "string") q.set(k, v);
  }
  const qs = q.toString();
  redirect(qs ? `/start?${qs}` : "/start");
}
