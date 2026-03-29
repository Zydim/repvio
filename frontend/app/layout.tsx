import type { Metadata, Viewport } from "next";
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
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Repvio",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#09090b",
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
