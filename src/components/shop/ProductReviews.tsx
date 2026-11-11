import { commerce } from "@/content/commerce";
import type { ProductReviews as ProductReviewsData } from "@/lib/commerce/reviews";
import { ReviewForm } from "./ReviewForm";
import { Stars } from "./Stars";

const copy = commerce.product.reviews;
export const REVIEWS_ID = "reviews";

const date = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

interface ProductReviewsProps {
  handle: string;
  data: ProductReviewsData;
}

export function ProductReviews({ handle, data }: ProductReviewsProps) {
  const { summary, reviews } = data;
  return (
    <section
      id={REVIEWS_ID}
      aria-labelledby="reviews-title"
      className="mx-auto max-w-7xl scroll-mt-24 px-4 py-16 md:px-8 md:py-24"
    >
      <h2 id="reviews-title" className="mb-10 text-h3">
        {copy.title}
      </h2>
      <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
        <div className="flex flex-col gap-8">
          {summary.count > 0 ? (
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <span className="font-serif text-h2">{summary.average.toFixed(1)}</span>
                <div className="flex flex-col gap-1">
                  <Stars value={summary.average} size={20} />
                  <span className="text-small text-ink-muted">{copy.count(summary.count)}</span>
                </div>
              </div>
              <ul className="flex flex-col gap-2 text-small">
                {[5, 4, 3, 2, 1].map((star) => {
                  const n = summary.distribution[star - 1] ?? 0;
                  return (
                    <li key={star} className="flex items-center gap-3">
                      <span className="w-14 shrink-0 text-ink-muted">{copy.starLabel(star)}</span>
                      <span className="h-2 flex-1 overflow-hidden rounded-pill bg-surface">
                        <span
                          className="block h-full rounded-pill bg-primary-dark"
                          style={{ width: `${(n / summary.count) * 100}%` }}
                        />
                      </span>
                      <span className="w-6 text-right text-ink-muted">{n}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <p className="max-w-sm text-ink-muted">{copy.empty}</p>
          )}
          <ReviewForm handle={handle} />
        </div>

        {reviews.length > 0 ? (
          <ul className="flex flex-col divide-y divide-line border-y border-line">
            {reviews.map((review) => (
              <li key={review.id} className="flex flex-col gap-2 py-6">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Stars value={review.rating} />
                  <span className="sr-only">{copy.outOf(String(review.rating))}</span>
                  {review.title ? <h3 className="text-base font-medium">{review.title}</h3> : null}
                </div>
                <p className="whitespace-pre-line">{review.body}</p>
                <p className="text-small text-ink-muted">
                  {review.author}
                  <span aria-hidden="true"> · </span>
                  <time dateTime={review.createdAt}>{date.format(new Date(review.createdAt))}</time>
                </p>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
