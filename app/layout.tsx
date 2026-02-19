import type { Metadata } from "next";
import { Manrope, Fraunces } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stewthius — The Perpetual Stew Chronicle",
  description: "The data-driven chronicle of the internet's most ambitious perpetual stew. Track ingredients, taste the community's sentiment, and explore what's cooking.",
  openGraph: {
    title: "Stewthius — The Perpetual Stew Chronicle",
    description: "The data-driven chronicle of the internet's most ambitious perpetual stew. Track ingredients, taste the community's sentiment, and explore what's cooking.",
    images: [
      {
        url: "https://stewthius.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Stewthius — The Perpetual Stew Chronicle",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stewthius — The Perpetual Stew Chronicle",
    description: "The data-driven chronicle of the internet's most ambitious perpetual stew. Track ingredients, taste the community's sentiment, and explore what's cooking.",
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
        <meta name="image" property="og:image" content="https://stewthius.com/og-image.jpg" />

        <Script
          defer
          src="https://analytics.jurek.dev/script.js"
          data-website-id="9a07faa5-019e-4525-83e3-cbf604dfcecf"
        />
      </head>
      <body
        className={`${manrope.variable} ${fraunces.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
