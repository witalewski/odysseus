import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Odysseus",
  description: "Share your travel journeys through maps, photos, and videos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-zinc-200 dark:border-zinc-700">
          <div className="mx-auto flex h-14 max-w-5xl items-center px-4">
            <Link href="/" className="text-lg font-bold tracking-tight">
              odysseus
            </Link>
            <nav className="ml-auto flex items-center gap-4 text-sm text-zinc-500">
              <Link href="/journeys/new" className="hover:text-zinc-900 dark:hover:text-zinc-50">
                New Journey
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
