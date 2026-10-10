import type { Metadata } from "next";
import {
  Fraunces,
  Cormorant_Garamond,
  Instrument_Sans,
  Great_Vibes,
  Amiri,
} from "next/font/google";
import { config } from "@/lib/config";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const instrument = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-instrument",
  display: "swap",
});

const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-great-vibes",
  display: "swap",
});

const amiri = Amiri({
  subsets: ["arabic", "latin"],
  weight: "400",
  variable: "--font-amiri",
  display: "swap",
});

export const metadata: Metadata = {
  title: config.title,
  description:
    "Dengan penuh kesyukuran, kami menjemput anda ke majlis perkahwinan Amani & Farhan. Sabtu, 03 Julai 2027 — Dewan Kota Kechil, Kota Tinggi, Johor.",
  openGraph: {
    title: config.title,
    description:
      "Walimatulurus Amani & Farhan — 03 Julai 2027, Dewan Kota Kechil, Kota Tinggi, Johor.",
    type: "website",
    locale: "ms_MY",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ms"
      className={`${fraunces.variable} ${cormorant.variable} ${instrument.variable} ${greatVibes.variable} ${amiri.variable}`}
    >
      <body className="bg-maroon-deep text-cream locked">{children}</body>
    </html>
  );
}
