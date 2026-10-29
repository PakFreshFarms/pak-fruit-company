import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";

// Both fonts are vendored in public/fonts (SIL Open Font License — see each
// LICENSE.txt there) via next/font/local instead of next/font/google, so the
// shop — which runs fully offline — never needs internet at build time, not
// even on first launch. Weights match what the UI actually uses (grepped for
// font-medium/semibold/bold/normal classes): 400/500/600/700.
const body = localFont({
  variable: "--font-body",
  src: [
    { path: "../public/fonts/inter/inter-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/inter/inter-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/inter/inter-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../public/fonts/inter/inter-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
});

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
