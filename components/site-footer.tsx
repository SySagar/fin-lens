import Link from "next/link";
import { InstallApp } from "@/components/install-app";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 text-sm sm:grid-cols-[1fr_auto] sm:items-end sm:px-6">
        <div>
          <Link href="/" className="font-semibold tracking-tight text-foreground">
            Fin Lens
          </Link>
          <p className="mt-2 text-muted-foreground">
            A clear view of economy and investments in Indian markets — without the noise.
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            © 2026 Sagar. All rights reserved.
          </p>
        </div>

        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-3">
          <Link href="/about" className="text-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
            About
          </Link>
          <Link href="/data" className="text-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
            Data
          </Link>
          <Link href="https://github.com/SySagar/fin-lens" target="_blank" rel="noopener noreferrer" className="text-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
            GitHub
          </Link>
          <Link href="https://x.com/SySagar2" target="_blank" rel="noopener noreferrer" className="text-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
            X · @SySagar2
          </Link>
        </nav>
        <div className="sm:col-start-2 sm:justify-self-end">
          <InstallApp />
        </div>
      </div>
    </footer>
  );
}
