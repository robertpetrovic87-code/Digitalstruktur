import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CookieBanner from "./components/CookieBanner";

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
        <main className="flex-1 flex justify-center px-4">
            <div className="w-full max-w-5xl">
           {children}
            </div>
        </main>
        
        <CookieBanner />

        <footer className="border-t mt-16 py-8 pb-24 text-sm text-gray-600 sm:pb-8">
         <div className="max-w-4xl mx-auto px-4">
          <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
          <Link href="/impressum" className="hover:underline">
              Impressum
              </Link>

              <span style={{ opacity: 0.6 }}>|</span>

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