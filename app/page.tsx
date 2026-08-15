import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Money } from "@/components/money";

/**
 * Placeholder landing page. Replaced with the real marketing/entry screen in a
 * later milestone; for now it exists so the RTL layout, the font, the token
 * palette and the <Money /> primitive are all visibly wired up.
 */
export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-10 px-6 py-16">
      <div className="space-y-3">
        <h1 className="text-display">دستیار مالی</h1>
        <p className="text-ink-muted text-balance">
          دخل و خرجت را با متن، صدا یا عکس فاکتور ثبت کن و ببین این ماه چقدر
          برایت مانده.
        </p>
      </div>

      <section className="border-line bg-surface rounded-card border p-5">
        <p className="text-ink-muted text-sm">باقی‌ماندهٔ این ماه</p>
        <p className="text-figure mt-1">
          <Money minor={128450} />
        </p>
        <div
          className="ledger-line mt-4"
          style={{ "--spent": 0.62 } as React.CSSProperties}
          role="presentation"
        />
        <p className="text-ink-muted mt-2 text-xs">۶۲٪ از درآمد این ماه خرج شده</p>
      </section>

      <div className="flex gap-3">
        <Button asChild className="flex-1">
          <Link href="/signup">ساخت حساب</Link>
        </Button>
        <Button asChild variant="outline" className="flex-1">
          <Link href="/login">ورود</Link>
        </Button>
      </div>
    </main>
  );
}
