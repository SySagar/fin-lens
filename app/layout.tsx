import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { UnitsProvider } from "@/components/units-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Fin Lens — FII/DII flows in Indian markets",
    template: "%s · Fin Lens",
  },
  description:
    "Track foreign and domestic institutional investment in Indian markets, with monthly and quarterly FII/FPI and DII data from official sources.",
};

const themeScript = `(function(){try{var s=localStorage.getItem('fin-lens-theme');var d=s==='dark'||(!s&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;r.classList.toggle('dark',d);r.style.colorScheme=d?'dark':'light';}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Script id="theme-init" strategy="beforeInteractive">
          {themeScript}
        </Script>
        <UnitsProvider>
          <a
            href="#main"
            className="sr-only rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60]"
          >
            Skip to content
          </a>
          <SiteHeader />
          {children}
          <SiteFooter />
        </UnitsProvider>
      </body>
    </html>
  );
}
