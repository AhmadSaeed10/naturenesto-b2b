import Image from "next/image";
import logoColored from "@/assets/brand/logo-colored.svg";
import logoGrey from "@/assets/brand/logo-grey.svg";
import { cn } from "@/lib/utils";

interface LogoProps {
  /** "light" uses the grey logo, made for dark surfaces such as the footer. */
  tone?: "ink" | "light";
  /** Height classes. The artwork keeps its ratio, so width follows. */
  className?: string;
}

/**
 * The client's logo artwork as supplied (mark, wordmark and descriptor in one SVG). The
 * surrounding link carries the accessible name, so the image is decorative here.
 */
export function Logo({ tone = "ink", className }: LogoProps) {
  return (
    <Image
      src={tone === "light" ? logoGrey : logoColored}
      alt=""
      priority
      className={cn("h-12 w-auto md:h-14", className)}
    />
  );
}
