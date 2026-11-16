import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { UnitsProvider } from "@/components/units-provider";
import { PwaRegister } from "@/components/pwa-register";

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
    default: "Fin Lens — Indian markets and economy",
    template: "%s · Fin Lens",
  },
  description:
    "A clear view of economy and investments in Indian markets — without the noise.",
  applicationName: "Fin Lens",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Fin Lens",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

const themeScript = `(function(){try{var s=localStorage.getItem('fin-lens-theme');var d=s==='dark'||(!s&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;r.classList.toggle('dark',d);r.style.colorScheme=d?'dark':'light';}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Script id="theme-init" strategy="beforeInteractive">
          {themeScript}
        </Script>
        <UnitsProvider>
          <PwaRegister />
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
