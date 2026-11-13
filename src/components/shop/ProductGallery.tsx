"use client";

import { useReducedMotion } from "motion/react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { commerce } from "@/content/commerce";
import { shop } from "@/content/shop";
import type { ProductBadge } from "@/content/types";
import { cn } from "@/lib/utils";
import { VARIANT_IMAGE_EVENT } from "./cart-events";

const copy = commerce.product.gallery;

interface ProductGalleryProps {
  images: { src: string; alt: string }[];
  title: string;
  badges: ProductBadge[];
}

const NAV_BUTTON =
  "absolute top-1/2 z-10 hidden size-11 -translate-y-1/2 items-center justify-center rounded-pill bg-background/90 text-ink shadow-soft backdrop-blur-sm transition-opacity duration-(--duration-micro) ease-brand focus-visible:opacity-100 disabled:hidden md:inline-flex md:opacity-0 md:group-hover/gallery:opacity-100";

/**
 * Swipeable image track (native scroll snap, so touch and keyboard scrolling just work) with a
 * thumbnail rail and a lightbox. The track is the source of truth: thumbnails and arrows scroll
 * it, and scrolling updates the active thumbnail.
 */
export function ProductGallery({ images, title, badges }: ProductGalleryProps) {
  const reduced = useReducedMotion();
  const track = useRef<HTMLUListElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const frame = useRef(0);
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  // Lightbox zoom: click or tap toggles 2x around the pointer; arrows and close reset it.
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const last = images.length - 1;

  const goTo = useCallback(
    (index: number) => {
      const el = track.current;
      if (!el) return;
      el.scrollTo({ left: index * el.clientWidth, behavior: reduced ? "auto" : "smooth" });
    },
    [reduced],
  );

  function onScroll() {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const el = track.current;
      if (el && el.clientWidth) setActive(Math.round(el.scrollLeft / el.clientWidth));
    });
  }

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  // A variant with its own photo (picked in the buy box) brings that photo into view.
  useEffect(() => {
    const onVariantImage = (event: Event) => {
      const src = (event as CustomEvent<string>).detail;
      const index = images.findIndex((image) => image.src === src);
      if (index >= 0) goTo(index);
    };
    window.addEventListener(VARIANT_IMAGE_EVENT, onVariantImage);
    return () => window.removeEventListener(VARIANT_IMAGE_EVENT, onVariantImage);
  }, [images, goTo]);

  // The native dialog gives focus trapping, Escape and a backdrop; page scroll is locked by hand.
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (lightbox === null) {
      if (el.open) el.close();
      return;
    }
    if (!el.open) el.showModal();
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = previous;
    };
  }, [lightbox]);

  function onDialogKey(event: React.KeyboardEvent) {
    if (lightbox === null) return;
    setZoom(null);
    if (event.key === "ArrowRight") setLightbox(Math.min(last, lightbox + 1));
    if (event.key === "ArrowLeft") setLightbox(Math.max(0, lightbox - 1));
  }

  if (images.length === 0) {
    return <div className="aspect-[4/5] rounded-card bg-surface" aria-hidden="true" />;
  }

  return (
    <div className="flex flex-col gap-3 lg:flex-row-reverse lg:gap-4">
      <div className="group/gallery relative min-w-0 flex-1">
        <ul
          ref={track}
          onScroll={onScroll}
          aria-label={copy.label}
          className="flex snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto overscroll-x-contain rounded-card bg-surface [&::-webkit-scrollbar]:hidden"
        >
          {images.map((image, index) => (
            <li key={image.src} className="relative aspect-[4/5] w-full shrink-0 snap-center">
              <button
                type="button"
                onClick={() => setLightbox(index)}
                aria-label={`${copy.enlarge}: ${image.alt || title}`}
                className="group/zoom absolute inset-0 cursor-zoom-in overflow-hidden focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-primary-dark"
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  priority={index === 0}
                  sizes="(min-width: 1024px) 48vw, 100vw"
                  className="object-cover transition-transform duration-(--duration-reveal) ease-brand lg:group-hover/zoom:scale-[1.06]"
                />
              </button>
            </li>
          ))}
        </ul>

        {badges.length > 0 ? (
          <ul className="pointer-events-none absolute top-4 left-4 flex flex-wrap gap-1.5">
            {badges.map((badge) => (
              <li
                key={badge}
                className="rounded-pill bg-background/90 px-3 py-1 text-[0.6875rem] font-medium tracking-wide text-ink uppercase backdrop-blur-sm"
              >
                {shop.badges[badge]}
              </li>
            ))}
          </ul>
        ) : null}

        {images.length > 1 ? (
          <>
            <button
              type="button"
              aria-label={copy.previous}
              disabled={active === 0}
              onClick={() => goTo(active - 1)}
              className={cn(NAV_BUTTON, "left-3")}
            >
              <Icon name="chevron-left" />
            </button>
            <button
              type="button"
              aria-label={copy.next}
              disabled={active === last}
              onClick={() => goTo(active + 1)}
              className={cn(NAV_BUTTON, "right-3")}
            >
              <Icon name="chevron-right" />
            </button>
            <p
              aria-hidden="true"
              className="pointer-events-none absolute right-4 bottom-4 rounded-pill bg-background/90 px-3 py-1 text-small text-ink md:hidden"
            >
              {copy.counter(active + 1, images.length)}
            </p>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5 md:hidden"
            >
              {images.map((image, index) => (
                <span
                  key={image.src}
                  className={cn(
                    "size-1.5 rounded-pill bg-background/90 transition-opacity duration-(--duration-micro)",
                    index === active ? "opacity-100" : "opacity-50",
                  )}
                />
              ))}
            </span>
          </>
        ) : null}
      </div>

      {images.length > 1 ? (
        <ul className="flex [scrollbar-width:none] gap-2 overflow-x-auto lg:max-h-[42rem] lg:w-20 lg:shrink-0 lg:flex-col lg:overflow-y-auto">
          {images.map((image, index) => (
            <li key={image.src} className="shrink-0">
              <button
                type="button"
                onClick={() => goTo(index)}
                aria-label={copy.show(index + 1, images.length)}
                aria-current={index === active ? "true" : undefined}
                className={cn(
                  "relative block size-16 overflow-hidden rounded-[12px] border bg-surface transition-colors duration-(--duration-micro) ease-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dark lg:size-20",
                  index === active ? "border-ink" : "border-transparent hover:border-line",
                )}
              >
                <Image src={image.src} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <dialog
        ref={dialog}
        onClose={() => setLightbox(null)}
        onKeyDown={onDialogKey}
        aria-label={title}
        className="m-auto h-dvh max-h-none w-screen max-w-none bg-transparent p-0 backdrop:bg-ink/85"
      >
        {lightbox !== null && images[lightbox] ? (
          <div
            onClick={(event) => {
              if (event.target === event.currentTarget) setLightbox(null);
            }}
            className="relative flex h-full w-full items-center justify-center p-4 md:p-10"
          >
            <div
              onClick={(event) => {
                const box = event.currentTarget.getBoundingClientRect();
                setZoom(
                  zoom
                    ? null
                    : {
                        x: ((event.clientX - box.left) / box.width) * 100,
                        y: ((event.clientY - box.top) / box.height) * 100,
                      },
                );
              }}
              className={cn(
                "relative h-full w-full max-w-5xl overflow-hidden",
                zoom ? "cursor-zoom-out" : "cursor-zoom-in",
              )}
            >
              <Image
                src={images[lightbox].src}
                alt={images[lightbox].alt}
                fill
                sizes="100vw"
                style={zoom ? { transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
                className={cn(
                  "object-contain transition-transform duration-(--duration-reveal) ease-brand",
                  zoom && "scale-[2.2]",
                )}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setZoom(null);
                setLightbox(null);
              }}
              aria-label={copy.close}
              className="absolute top-4 right-4 inline-flex size-11 items-center justify-center rounded-pill bg-background text-ink md:top-6 md:right-6"
            >
              <Icon name="close" />
            </button>
            {images.length > 1 ? (
              <>
                <button
                  type="button"
                  aria-label={copy.previous}
                  disabled={lightbox === 0}
                  onClick={() => {
                    setZoom(null);
                    setLightbox(lightbox - 1);
                  }}
                  className="absolute left-3 inline-flex size-11 items-center justify-center rounded-pill bg-background text-ink disabled:hidden md:left-6"
                >
                  <Icon name="chevron-left" />
                </button>
                <button
                  type="button"
                  aria-label={copy.next}
                  disabled={lightbox === last}
                  onClick={() => {
                    setZoom(null);
                    setLightbox(lightbox + 1);
                  }}
                  className="absolute right-3 inline-flex size-11 items-center justify-center rounded-pill bg-background text-ink disabled:hidden md:right-6"
                >
                  <Icon name="chevron-right" />
                </button>
                <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-pill bg-background px-3 py-1 text-small text-ink">
                  {copy.counter(lightbox + 1, images.length)}
                </p>
              </>
            ) : null}
          </div>
        ) : null}
      </dialog>
    </div>
  );
}
