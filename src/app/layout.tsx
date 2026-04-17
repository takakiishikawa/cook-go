import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#2D7A4F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "CookGo",
  description: "撮るだけ・選ぶだけで、タンパク質の水位が見えて、料理のレパートリーが増えていく。",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CookGo",
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    title: "CookGo",
    description: "撮るだけ・選ぶだけで、タンパク質の水位が見えて、料理のレパートリーが増えていく。",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${notoSansJP.variable} h-full antialiased`}
    >
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="min-h-full flex flex-col bg-background font-sans text-base">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
