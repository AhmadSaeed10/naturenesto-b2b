"use client";

import type { ChangeEvent, FocusEvent } from "react";
import { cn } from "@/lib/utils";

type Control = "input" | "textarea" | "select";

interface FloatingFieldProps {
  name: string;
  label: string;
  control?: Control;
  type?: "text" | "email" | "tel" | "password" | "number";
  autoComplete?: string;
  required?: boolean;
  options?: readonly string[];
  placeholderOption?: string;
  hint?: string;
  error?: string;
  defaultValue?: string;
  onBlur?: (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onChange?: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => void;
}

// Field boundary uses inkMuted (4.6:1) to meet WCAG 1.4.11. The palette has no error hue,
// so errors use a heavier ink border, an icon and text, never colour alone.
const FIELD =
  "peer block w-full rounded-2xl border border-ink-muted bg-background px-4 pt-6 pb-2 text-ink outline-none transition-[border-color,box-shadow] duration-(--duration-micro) ease-brand focus:border-primary-dark focus:shadow-[0_0_0_3px_var(--color-primary-dark)] aria-invalid:border-2 aria-invalid:border-ink";

const FLOAT =
  "pointer-events-none absolute top-4 left-4 origin-top-left text-ink-muted transition-transform duration-(--duration-micro) ease-brand";

const FLOATED = "-translate-y-2.5 scale-80";

export function FloatingField({
  name,
  label,
  control = "input",
  type = "text",
  autoComplete,
  required = false,
  options = [],
  placeholderOption,
  hint,
  error,
  defaultValue,
  onBlur,
  onChange,
}: FloatingFieldProps) {
  const id = `field-${name}`;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  const shared = {
    id,
    name,
    required,
    defaultValue,
    onBlur,
    onChange,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
  } as const;

  return (
    <div>
      <div className="relative">
        {control === "textarea" ? (
          <textarea {...shared} rows={5} placeholder=" " className={cn(FIELD, "resize-y")} />
        ) : control === "select" ? (
          <select {...shared} className={cn(FIELD, "appearance-none pr-10")}>
            <option value="">{placeholderOption}</option>
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : (
          <input
            {...shared}
            type={type}
            autoComplete={autoComplete}
            placeholder=" "
            className={FIELD}
          />
        )}
        <label
          htmlFor={id}
          className={cn(
            FLOAT,
            // Selects always show a value, so their label stays floated.
            control === "select"
              ? FLOATED
              : "peer-focus:-translate-y-2.5 peer-focus:scale-80 peer-[:not(:placeholder-shown)]:-translate-y-2.5 peer-[:not(:placeholder-shown)]:scale-80",
          )}
        >
          {label}
        </label>
        {control === "select" ? (
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-ink"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        ) : null}
      </div>
      {hint ? (
        <p id={hintId} className="mt-2 px-1 text-small text-ink-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          id={errorId}
          className="mt-2 flex items-start gap-2 px-1 text-small font-medium text-ink"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            className="mt-0.5 size-4 shrink-0"
            fill="currentColor"
          >
            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm-.75 3.5h1.5v5h-1.5v-5Zm0 6.25h1.5v1.5h-1.5v-1.5Z" />
          </svg>
          {error}
        </p>
      ) : null}
    </div>
  );
}
