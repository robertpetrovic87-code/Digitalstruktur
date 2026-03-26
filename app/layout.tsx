import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CookieBanner from "./components/CookieBanner";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Digitalstruktur – KI Website Analyse",
  description: "Professionelle KI-Analyse für Websites in Sekunden.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen flex flex-col`}
      >
        <main className="flex-1 flex justify-center">
          <div className="w-full max-w-3xl px-5 sm:px-8 lg:px-10">
            {children}
          </div>
        </main>

        <CookieBanner />
        <Analytics />

        <footer className="mt-16 border-t py-8 pb-24 text-sm text-gray-600 sm:pb-8">
          <div className="mx-auto max-w-4xl px-5 sm:px-8 lg:px-10">
            <div className="flex justify-center gap-4">
              <Link href="/impressum" className="hover:underline">
                Impressum
              </Link>

              <span className="opacity-60">|</span>

              <Link href="/datenschutz" className="hover:underline">
                Datenschutz
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}