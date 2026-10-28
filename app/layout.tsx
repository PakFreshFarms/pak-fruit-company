import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";

const body = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

// Vendored in public/fonts (SIL Open Font License — see LICENSE.txt there)
// instead of next/font/google, so the Urdu interface never needs internet
// at build time, not even on first launch.
const nastaliq = localFont({
  variable: "--font-nastaliq",
  src: [
    { path: "../public/fonts/noto-nastaliq-urdu/noto-nastaliq-urdu-arabic-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/noto-nastaliq-urdu/noto-nastaliq-urdu-arabic-700-normal.woff2", weight: "700", style: "normal" },
  ],
});

export const metadata: Metadata = {
  title: "Mandi Hisab — منڈی حساب",
  description: "Accounting for a fruit market commission agent (arhti) with own farm operations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${body.variable} ${nastaliq.variable} antialiased`}>
        <ThemeProvider>
          <LocaleProvider>
            {children}
            <Toaster />
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
