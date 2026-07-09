import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MENTOR",
  description: "Uzaktan mentörlük ve ödev takip uygulaması",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink">
        <Script id="theme-init" strategy="beforeInteractive">
          {`try {
            var t = localStorage.getItem('mentor-theme');
            if (t === 'light' || t === 'dark') {
              document.documentElement.setAttribute('data-theme', t);
            }
          } catch (e) {}`}
        </Script>
        {children}
      </body>
    </html>
  );
}
