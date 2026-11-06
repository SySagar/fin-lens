import Link from "next/link";

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>© 2026 Sagar. All rights reserved.</p>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em]">
            Sources · CDSL · NSE
          </span>
          <Link
            href="https://x.com/SySagar2"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md font-medium text-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          >
            <XIcon className="size-3.5" />
            @SySagar2
          </Link>
        </div>
      </div>
    </footer>
  );
}
