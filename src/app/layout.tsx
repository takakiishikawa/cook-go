import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#10b981",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "CookGo",
  description: "撮るだけ・選ぶだけで、タンパク質の水位が見えて、料理のレパートリーが増えていく。",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CookGo",
    startupImage: [
      { url: "/icons/icon-512.png" },
    ],
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
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-full flex flex-col bg-background font-sans text-base">
        {children}
        <Toaster position="top-center" richColors />
        <PwaRegister />
      </body>
    </html>
  );
}
