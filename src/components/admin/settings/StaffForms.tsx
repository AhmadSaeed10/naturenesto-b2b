"use client";

import { useActionState, useId } from "react";
import {
  type StaffActionState,
  inviteStaff,
  revokeInvite,
  updateStaffRole,
} from "@/app/actions/admin-staff";
import { FloatingField } from "@/components/forms/FloatingField";
import { Button } from "@/components/ui/Button";
import { admin } from "@/content/admin";
import type { StaffRole } from "@/lib/auth/staff";

const copy = admin.settings.staff;
const INITIAL: StaffActionState = { status: "idle" };

const message = (state: StaffActionState, done: string): string =>
  ({
    idle: "",
    done,
    invalid: admin.form.invalid,
    exists: copy.errors.exists,
    forbidden: admin.form.forbidden,
    last_owner: copy.lastOwner,
    failed: admin.form.failed,
  })[state.status];

const SELECT =
  "min-h-(--size-tap) rounded-pill border border-ink-muted bg-background px-4 text-sm text-ink";
const TEXT_BUTTON =
  "inline-flex min-h-(--size-tap) items-center text-sm text-ink underline underline-offset-4";

interface RoleOptionsProps {
  roles: readonly StaffRole[];
}

function RoleOptions({ roles }: RoleOptionsProps) {
  return roles.map((role) => (
    <option key={role} value={role}>
      {admin.roles[role]}
    </option>
  ));
}

export function InviteForm({ roles }: RoleOptionsProps) {
  const [state, action, pending] = useActionState(inviteStaff, INITIAL);
  const roleId = useId();
  return (
    <form
      action={action}
      className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-end"
      noValidate
    >
      <FloatingField
        name="email"
        type="email"
        label={copy.invite.email}
        required
        error={state.status === "invalid" ? copy.errors.email : undefined}
      />
      <div className="flex flex-col gap-2">
        <label htmlFor={roleId} className="text-sm font-medium">
          {copy.invite.role}
        </label>
        <select id={roleId} name="role" defaultValue="editor" className={SELECT}>
          <RoleOptions roles={roles} />
        </select>
      </div>
      <Button type="submit" disabled={pending}>
        {copy.invite.submit}
      </Button>
      <p role="status" aria-live="polite" className="text-sm md:col-span-3">
        {state.status === "done" && state.emailed === false
          ? copy.invite.notSent
          : message(state, copy.invite.done)}
      </p>
    </form>
  );
}

interface MemberRowProps {
  id: string;
  email: string;
  role: StaffRole;
  isSelf: boolean;
  /** False when the viewer may not change this person (an admin looking at an owner). */
  editable: boolean;
  roles: readonly StaffRole[];
}

export function MemberRow({ id, email, role, isSelf, editable, roles }: MemberRowProps) {
  const [state, action, pending] = useActionState(updateStaffRole, INITIAL);
  const roleId = useId();
  return (
    <li className="flex flex-col gap-3 border-b border-line py-4 last:border-b-0 md:flex-row md:items-center md:justify-between">
      <p className="flex flex-col">
        <span className="font-medium break-all">{email}</span>
        <span className="text-sm text-ink-muted">
          {admin.roles[role]}
          {isSelf ? ` · ${copy.you}` : ""}
        </span>
      </p>
      {editable ? (
        <div className="flex flex-col gap-1 md:items-end">
          <form action={action} className="flex flex-wrap items-center gap-3">
            <input type="hidden" name="id" value={id} />
            <label htmlFor={roleId} className="sr-only">
              {copy.change}: {email}
            </label>
            <select id={roleId} name="role" defaultValue={role} className={SELECT}>
              <RoleOptions roles={roles} />
            </select>
            <button type="submit" disabled={pending} className={TEXT_BUTTON}>
              {copy.change}
            </button>
            <button
              type="submit"
              name="role"
              value=""
              disabled={pending}
              className={TEXT_BUTTON}
              onClick={(event) => {
                if (!window.confirm(copy.removeConfirm)) event.preventDefault();
              }}
            >
              {copy.remove}
            </button>
          </form>
          <p role="status" aria-live="polite" className="text-sm">
            {message(state, admin.form.saved)}
          </p>
        </div>
      ) : null}
    </li>
  );
}

interface InviteRowProps {
  id: string;
  email: string;
  role: StaffRole;
  editable: boolean;
}

export function InviteRow({ id, email, role, editable }: InviteRowProps) {
  const [state, action, pending] = useActionState(revokeInvite, INITIAL);
  return (
    <li className="flex flex-col gap-3 border-b border-line py-4 last:border-b-0 md:flex-row md:items-center md:justify-between">
      <p className="flex flex-col">
        <span className="font-medium break-all">{email}</span>
        <span className="text-sm text-ink-muted">
          {admin.roles[role]} · {copy.pending}
        </span>
      </p>
      {editable ? (
        <form action={action} className="flex items-center gap-3">
          <input type="hidden" name="id" value={id} />
          <button type="submit" disabled={pending} className={TEXT_BUTTON}>
            {copy.revoke}
            <span className="sr-only">: {email}</span>
          </button>
          <span role="status" aria-live="polite" className="text-sm">
            {message(state, admin.form.saved)}
          </span>
        </form>
      ) : null}
    </li>
  );
}
