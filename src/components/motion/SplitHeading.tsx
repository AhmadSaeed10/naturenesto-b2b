"use client";

import { motion, useReducedMotion } from "motion/react";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { fade, lineMask, viewportOnce } from "@/lib/motion";

const HEADINGS = { h1: motion.h1, h2: motion.h2, h3: motion.h3 } as const;

interface SplitHeadingProps {
  as?: keyof typeof HEADINGS;
  text: string;
  /** Words rendered in Baskervville italic, matched ignoring punctuation and case. */
  emphasis?: readonly string[];
  id?: string;
  className?: string;
}

const normalise = (word: string): string => word.replace(/[^\p{L}\p{N}'-]/gu, "").toLowerCase();

/**
 * Line by line mask reveal. Words are grouped into the lines the browser actually wraps
 * them onto, so the effect stays correct at every width. Screen readers get the plain text.
 */
export function SplitHeading({ as = "h2", text, emphasis = [], id, className }: SplitHeadingProps) {
  const reduced = useReducedMotion();
  const Tag = HEADINGS[as];
  const words = text.split(/\s+/).filter(Boolean);
  const emphasised = new Set(emphasis.map(normalise));
  const wordRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const [lineOf, setLineOf] = useState<number[]>([]);
  const revealed = useRef(false);

  const measure = useCallback(() => {
    if (revealed.current) return;
    const tops: number[] = [];
    const lines = wordRefs.current.map((el) => {
      const top = Math.round(el?.offsetTop ?? 0);
      let index = tops.indexOf(top);
      if (index === -1) index = tops.push(top) - 1;
      return index;
    });
    setLineOf(lines);
  }, []);

  useLayoutEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  if (reduced) {
    return (
      <Tag
        id={id}
        className={className}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={fade}
      >
        {words.map((word, i) => (
          <span key={i}>
            {emphasised.has(normalise(word)) ? <em>{word}</em> : word}
            {i < words.length - 1 ? " " : null}
          </span>
        ))}
      </Tag>
    );
  }

  return (
    <Tag
      id={id}
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      onAnimationComplete={() => {
        revealed.current = true;
      }}
    >
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((word, i) => (
          <span key={i}>
            <span
              ref={(el) => {
                wordRefs.current[i] = el;
              }}
              // Padding keeps italic overhangs and descenders inside the mask.
              className="-mx-[0.04em] -mb-[0.14em] inline-block overflow-hidden px-[0.04em] pb-[0.14em] align-top"
            >
              <motion.span className="inline-block" custom={lineOf[i] ?? 0} variants={lineMask}>
                {emphasised.has(normalise(word)) ? <em>{word}</em> : word}
              </motion.span>
            </span>
            {i < words.length - 1 ? " " : null}
          </span>
        ))}
      </span>
    </Tag>
  );
}
