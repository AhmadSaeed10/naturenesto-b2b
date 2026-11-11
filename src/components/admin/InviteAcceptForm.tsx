"use client";

import { useActionState } from "react";
import { type InviteState, acceptInvite } from "@/app/actions/admin-invite";
import { FloatingField } from "@/components/forms/FloatingField";
import { Button } from "@/components/ui/Button";
import { admin } from "@/content/admin";

const copy = admin.invite;
const INITIAL: InviteState = { status: "idle" };

const MESSAGES: Record<InviteState["status"], string> = {
  idle: "",
  name: copy.errors.name,
  short: copy.errors.short,
  mismatch: copy.errors.mismatch,
  expired: copy.expired,
  failed: copy.errors.failed,
};

export function InviteAcceptForm({ token, email }: { token: string; email: string }) {
  const [state, action, pending] = useActionState(acceptInvite, INITIAL);
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="token" value={token} />
      <p className="text-sm break-all text-ink-muted">{email}</p>
      <FloatingField
        name="name"
        label={copy.name}
        autoComplete="name"
        required
        error={state.status === "name" ? copy.errors.name : undefined}
      />
      <FloatingField
        name="password"
        type="password"
        label={copy.password}
        autoComplete="new-password"
        hint={copy.hint}
        required
        error={state.status === "short" ? copy.errors.short : undefined}
      />
      <FloatingField
        name="confirm"
        type="password"
        label={copy.confirm}
        autoComplete="new-password"
        required
        error={state.status === "mismatch" ? copy.errors.mismatch : undefined}
      />
      <p role="status" aria-live="polite" className="text-sm empty:hidden">
        {state.status === "expired" || state.status === "failed" ? MESSAGES[state.status] : ""}
      </p>
      <Button type="submit" disabled={pending}>
        {copy.submit}
      </Button>
    </form>
  );
}
