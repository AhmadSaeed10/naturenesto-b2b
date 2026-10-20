"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
} from "react";
import { requestBulkQuote, type BulkState } from "@/app/actions/bulk";
import { FloatingField } from "@/components/forms/FloatingField";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { bulk } from "@/content/commerce";
import { BULK_FIELDS, validateBulkField, type BulkErrors, type BulkField } from "@/lib/bulk";

interface BulkQuoteProps {
  handle: string;
  productName: string;
  whatsappHref: string;
}

const INITIAL: BulkState = { status: "idle" };
const TITLE_ID = "bulk-quote-title";

type FieldEvent = ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;
type BlurEvent = FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;

const isBulkField = (name: string): name is BulkField =>
  (BULK_FIELDS as readonly string[]).includes(name);

/**
 * "Request bulk pricing" under Add to cart: one talk-to-us flow for business and bulk
 * orders. Native <dialog> with showModal() gives the focus trap, Escape and focus return.
 */
export function BulkQuote({ handle, productName, whatsappHref }: BulkQuoteProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const status = useRef<HTMLDivElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(requestBulkQuote, INITIAL);
  const [inline, setInline] = useState<BulkErrors>({});
  const f = bulk.fields;

  const serverErrors = state.status === "invalid" ? state.errors : {};
  const errors: BulkErrors = { ...serverErrors, ...inline };
  const values = state.status === "invalid" || state.status === "error" ? state.values : null;
  const done = state.status === "sent" || state.status === "whatsapp";

  useEffect(() => {
    if (state.status === "invalid") {
      form.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
    }
    if (state.status === "sent" || state.status === "whatsapp") status.current?.focus();
  }, [state]);

  const onBlur = (event: BlurEvent) => {
    const { name, value } = event.target;
    if (!isBulkField(name)) return;
    if (event.relatedTarget instanceof HTMLButtonElement && event.relatedTarget.type === "submit") {
      return;
    }
    if (!value && !errors[name]) return;
    setInline((current) => ({ ...current, [name]: validateBulkField(name, value) }));
  };

  const onChange = ({ target }: FieldEvent) => {
    if (!isBulkField(target.name) || !errors[target.name]) return;
    const name = target.name;
    setInline((current) => ({ ...current, [name]: validateBulkField(name, target.value) }));
  };

  const field = (name: BulkField) => ({
    name,
    error: errors[name],
    defaultValue: values?.[name],
    onBlur,
    onChange,
  });

  return (
    <div className="flex flex-col items-start gap-3 rounded-card border border-line bg-surface p-5">
      <p className="text-small text-ink">{bulk.hint}</p>
      <Button
        type="button"
        variant="secondary"
        aria-haspopup="dialog"
        onClick={() => dialog.current?.showModal()}
      >
        {bulk.button}
      </Button>

      <dialog
        ref={dialog}
        aria-labelledby={TITLE_ID}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
        className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl rounded-card bg-background p-0 text-ink shadow-soft backdrop:bg-ink/40"
      >
        <div className="flex flex-col gap-6 p-6 sm:p-10">
          <div className="flex items-start justify-between gap-6">
            <div className="flex flex-col gap-3">
              <h2 id={TITLE_ID} className="font-serif text-h3">
                {bulk.title}
              </h2>
              <p className="text-ink-muted">{productName}</p>
            </div>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              aria-label={bulk.close}
              className="inline-flex size-(--size-tap) shrink-0 items-center justify-center rounded-pill border border-ink/30 transition-colors duration-(--duration-micro) ease-brand hover:border-ink"
            >
              <Icon name="close" />
            </button>
          </div>

          {done ? (
            <div ref={status} tabIndex={-1} role="status" className="outline-none">
              {state.status === "sent" ? (
                <>
                  <p className="mb-3 font-serif text-h4">{bulk.sent.title}</p>
                  <p className="max-w-prose">{bulk.sent.body}</p>
                </>
              ) : (
                <>
                  <p className="mb-3 font-serif text-h4">{bulk.whatsappOnly.title}</p>
                  <p className="mb-6 max-w-prose">{bulk.whatsappOnly.body}</p>
                  <Button
                    href={`${whatsappHref}?text=${encodeURIComponent(state.message)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    withArrow
                  >
                    {bulk.whatsappOnly.action}
                  </Button>
                </>
              )}
            </div>
          ) : (
            <form
              ref={form}
              action={action}
              onSubmit={() => setInline({})}
              noValidate
              className="grid gap-5"
            >
              <p className="max-w-prose">{bulk.intro}</p>
              <input type="hidden" name="product" value={handle} />
              {/* Honeypot, hidden from people and assistive tech */}
              <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
                <input name="website" type="text" tabIndex={-1} autoComplete="off" />
              </div>

              {state.status === "invalid" || state.status === "error" ? (
                <p role="alert" className="text-small font-medium text-ink">
                  {state.status === "invalid" ? bulk.errors.summary : bulk.errors.failed}
                </p>
              ) : null}

              <FloatingField
                {...field("company")}
                label={f.company.label}
                autoComplete="organization"
              />
              <div className="grid gap-5 sm:grid-cols-2">
                <FloatingField
                  {...field("name")}
                  label={f.name.label}
                  autoComplete="name"
                  required
                />
                <FloatingField
                  {...field("phone")}
                  label={f.phone.label}
                  type="tel"
                  autoComplete="tel"
                  required
                />
              </div>
              <FloatingField
                {...field("email")}
                label={f.email.label}
                type="email"
                autoComplete="email"
                required
              />
              <div className="grid gap-5 sm:grid-cols-2">
                <FloatingField
                  {...field("quantity")}
                  label={f.quantity.label}
                  hint={f.quantity.hint}
                  type="number"
                  required
                />
                <FloatingField
                  {...field("city")}
                  label={f.city.label}
                  autoComplete="address-level2"
                  required
                />
              </div>
              <FloatingField
                {...field("timeline")}
                label={f.timeline.label}
                control="select"
                options={f.timeline.options}
                placeholderOption={bulk.selectPlaceholder}
                required
              />
              <FloatingField
                {...field("message")}
                label={f.message.label}
                hint={f.message.hint}
                control="textarea"
              />
              <div>
                <Button type="submit" withArrow disabled={pending} aria-disabled={pending}>
                  {pending ? bulk.pending : bulk.submit}
                </Button>
              </div>
            </form>
          )}
        </div>
      </dialog>
    </div>
  );
}
