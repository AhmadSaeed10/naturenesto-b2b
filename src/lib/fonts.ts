import { Baskervville, Inter } from "next/font/google";

// Two families, one job each: Baskervville for headings and italic accents, Inter for body,
// UI and forms. Defined once here. The site only uses weights 400 and 500 (see globals.css).
export const baskervville = Baskervville({
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-baskervville",
});

export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const fontVariables = `${baskervville.variable} ${inter.variable}`;
