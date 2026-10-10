import type { Metadata, Viewport } from "next";
import { Baloo_Bhaijaan_2, Balsamiq_Sans } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import "./globals.css";

// Fonts are downloaded at build time and self-hosted: no runtime calls to Google (D-023).
const balsamiq = Balsamiq_Sans({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-balsamiq", display: "swap" });
const baloo = Baloo_Bhaijaan_2({ subsets: ["arabic", "latin"], variable: "--font-baloo-bhaijaan", display: "swap" });

export const metadata: Metadata = {
  title: "Feelio",
  description: "A friendly AI companion that helps children understand their feelings.",
  robots: { index: false, follow: false }, // invite-only pilot
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f3ecff",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className={`${balsamiq.variable} ${baloo.variable}`}>
      <body>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
