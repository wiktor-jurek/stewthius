import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stewthius - Perpetual Stew Analytics",
  description: "Data-driven analysis of the internet's most ambitious culinary experiment",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        <Script
          defer
          src="https://analytics.jurek.dev/script.js"
          data-website-id="9a07faa5-019e-4525-83e3-cbf604dfcecf"
        />
      </head>
      <body
        className={`${manrope.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
