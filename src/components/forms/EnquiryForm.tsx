"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
} from "react";
import { submitEnquiry, type EnquiryState } from "@/app/actions/enquiry";
import { Button } from "@/components/ui/Button";
import { forms } from "@/content/forms";
import {
  FIELDS,
  validateField,
  type EnquiryKind,
  type FieldErrors,
  type FieldName,
} from "@/lib/enquiry";
import { FloatingField } from "./FloatingField";

interface EnquiryFormProps {
  kind: EnquiryKind;
  whatsappHref: string;
  email: string;
}

const INITIAL: EnquiryState = { status: "idle", errors: {}, values: {} };

const isField = (kind: EnquiryKind, name: string): name is FieldName =>
  (FIELDS[kind] as readonly string[]).includes(name);

export function EnquiryForm({ kind, whatsappHref, email }: EnquiryFormProps) {
  const [state, action, pending] = useActionState(submitEnquiry, INITIAL);
  const [inline, setInline] = useState<FieldErrors>({});
  const form = useRef<HTMLFormElement>(null);
  const status = useRef<HTMLDivElement>(null);
  const f = forms.fields;

  // Server errors replace inline ones on each submit; inline validation then takes over.
  const errors: FieldErrors = { ...state.errors, ...inline };

  useEffect(() => {
    if (state.status === "invalid") {
      form.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
    }
    if (state.status === "not_connected" || state.status === "sent") status.current?.focus();
  }, [state]);

  const onBlur = (
    event: FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    if (!isField(kind, name)) return;
    // Heading for submit: let the submit validate, so no error appears and shifts the
    // button away mid-click.
    if (event.relatedTarget instanceof HTMLButtonElement && event.relatedTarget.type === "submit") {
      return;
    }
    // Only validate fields the visitor has filled, so tabbing past is not punished.
    if (!value && !errors[name]) return;
    setInline((current) => ({ ...current, [name]: validateField(name, value) }));
  };

  if (state.status === "sent") {
    return (
      <div
        ref={status}
        tabIndex={-1}
        role="status"
        className="rounded-card bg-surface p-8 text-ink outline-none"
      >
        <p className="mb-3 font-serif text-h3">{forms.sent.title}</p>
        <p className="max-w-prose">{forms.sent.body}</p>
      </div>
    );
  }

  if (state.status === "not_connected") {
    return (
      <div
        ref={status}
        tabIndex={-1}
        role="status"
        className="rounded-card bg-surface p-8 text-ink outline-none"
      >
        <p className="mb-3 font-serif text-h3">{forms.notConnected.title}</p>
        <p className="mb-6 max-w-prose">{forms.notConnected.body}</p>
        <div className="flex flex-wrap gap-3">
          <Button href={whatsappHref} target="_blank" rel="noopener noreferrer" withArrow>
            {forms.notConnected.whatsapp}
          </Button>
          <Button href={`mailto:${email}`} variant="secondary">
            {email}
          </Button>
        </div>
      </div>
    );
  }

  // While a field shows an error, re-check it as the visitor types. The error clears the
  // moment it is fixed, before they reach for the submit button, so the layout never
  // shifts under their pointer mid-click.
  const onChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    if (!isField(kind, name) || !errors[name]) return;
    setInline((current) => ({ ...current, [name]: validateField(name, value) }));
  };

  const v = state.values;
  const field = (name: FieldName) => ({
    name,
    error: errors[name],
    defaultValue: v[name],
    onBlur,
    onChange,
  });

  return (
    <form
      ref={form}
      action={action}
      onSubmit={() => setInline({})}
      noValidate
      className="grid gap-5"
    >
      <input type="hidden" name="kind" value={kind} />
      {/* Honeypot, hidden from people and assistive tech */}
      <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
        <label htmlFor="field-company">{f.company.label}</label>
        <input id="field-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {state.status === "invalid" ? (
        <p role="alert" className="text-small font-medium text-ink">
          {forms.errors.summary}
        </p>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <FloatingField {...field("name")} label={f.name.label} autoComplete="name" required />
        <FloatingField
          {...field("email")}
          label={f.email.label}
          type="email"
          autoComplete="email"
          required
        />
      </div>
      <FloatingField {...field("phone")} label={f.phone.label} type="tel" autoComplete="tel" />

      {kind === "contact" ? (
        <FloatingField {...field("message")} label={f.message.label} control="textarea" required />
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2">
            <FloatingField
              {...field("spaceType")}
              label={f.spaceType.label}
              control="select"
              options={f.spaceType.options}
              placeholderOption={forms.selectPlaceholder}
              required
            />
            <FloatingField
              {...field("service")}
              label={f.service.label}
              control="select"
              options={f.service.options}
              placeholderOption={forms.selectPlaceholder}
              required
            />
          </div>
          <FloatingField
            {...field("details")}
            label={f.details.label}
            hint={f.details.hint}
            control="textarea"
            required
          />
        </>
      )}

      <div>
        <Button type="submit" withArrow disabled={pending} aria-disabled={pending}>
          {pending ? forms.pending : forms.submit[kind]}
        </Button>
      </div>
    </form>
  );
}
