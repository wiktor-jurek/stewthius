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
  openGraph: {
    title: "Stewthius - Perpetual Stew Analytics",
    description: "Data-driven analysis of the internet's most ambitious culinary experiment",
    images: [
      {
        url: "https://stewthius.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Stewthius - Perpetual Stew Analytics",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stewthius - Perpetual Stew Analytics",
    description: "Data-driven analysis of the internet's most ambitious culinary experiment",
    images: ["https://stewthius.com/og-image.jpg"],
  },
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
