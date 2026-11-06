import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          aria-label="Fin Lens home"
          className="flex items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary font-mono text-xs font-bold tracking-tight text-primary-foreground">
            FL
          </span>
          <span className="text-[15px] font-semibold tracking-tight">
            Fin Lens
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          <SiteNav />
          <span aria-hidden="true" className="h-6 w-px bg-border" />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
