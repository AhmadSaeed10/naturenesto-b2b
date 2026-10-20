import type { Metadata } from "next";

// The content editor. Sign in is handled by Keystatic (GitHub in production).
export const metadata: Metadata = { title: "Content", robots: { index: false, follow: false } };

export default function Layout({ children }: LayoutProps<"/keystatic">) {
  return children;
}
