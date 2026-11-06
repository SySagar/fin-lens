"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home", exact: true },
  { href: "/fii-dii", label: "FII / DII", exact: false },
];

export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary" className="flex items-center gap-1 text-sm">
      {links.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`${
              link.exact ? "hidden sm:inline-flex" : "inline-flex"
            } items-center rounded-md px-2.5 py-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:px-3 ${
              active
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
