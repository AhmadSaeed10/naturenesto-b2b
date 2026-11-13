import { Baskervville } from "next/font/google";

// One typeface for every piece of text: headings, body, UI, forms. Variable weight 400 to 700,
// but the site only uses 400 and 500 (see globals.css). Defined once here.
export const baskervville = Baskervville({
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-baskervville",
});

export const fontVariables = baskervville.variable;
