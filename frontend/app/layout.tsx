import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Repvio — KI Fitness Coach",
  description: "Video-Analyse für deine Übungstechnik mit KI-Feedback",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={`${geistSans.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full bg-zinc-950 text-zinc-100" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
