"use client";

import { useActionState, useId, useState } from "react";
import {
  type StaffActionState,
  inviteStaff,
  renewInvite,
  revokeInvite,
  updateStaffRole,
} from "@/app/actions/admin-staff";
import { FloatingField } from "@/components/forms/FloatingField";
import { Button } from "@/components/ui/Button";
import { admin } from "@/content/admin";
import { MEMBER_AREAS } from "@/lib/auth/areas";
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

/** Custom access is picked with the area ticks on the invite form, so other lists skip it. */
function RoleOptions({ roles, keep }: RoleOptionsProps & { keep?: StaffRole }) {
  return roles
    .filter((role) => role !== "member" || role === keep)
    .map((role) => (
      <option key={role} value={role}>
        {admin.roles[role]}
      </option>
    ));
}

const areaList = (areas: readonly string[]): string =>
  areas.map((area) => copy.areas[area as keyof typeof copy.areas] ?? area).join(", ");

export function InviteForm({ roles }: RoleOptionsProps) {
  const [state, action, pending] = useActionState(inviteStaff, INITIAL);
  const [copied, setCopied] = useState(false);
  const [role, setRole] = useState<StaffRole>("member");
  const roleId = useId();
  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-end">
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
          <select
            id={roleId}
            name="role"
            value={role}
            onChange={(event) => setRole(event.target.value as StaffRole)}
            className={SELECT}
          >
            <option value="member">{copy.invite.custom}</option>
            <RoleOptions roles={roles} />
          </select>
        </div>
        <Button type="submit" disabled={pending}>
          {copy.invite.submit}
        </Button>
      </div>

      {role === "member" ? (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-sm font-medium">{copy.invite.areasLegend}</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {MEMBER_AREAS.map((area) => (
              <label
                key={area}
                className="flex min-h-(--size-tap) cursor-pointer items-center gap-3 rounded-xl border border-line bg-background px-4 text-sm has-focus-visible:outline-2 has-focus-visible:outline-primary-dark"
              >
                <input type="checkbox" name="areas" value={area} className="size-4" />
                {copy.areas[area]}
              </label>
            ))}
          </div>
          <p className="text-sm text-ink-muted">{copy.invite.pickArea}</p>
        </fieldset>
      ) : null}

      <p role="status" aria-live="polite" className="text-sm">
        {state.status === "done" && state.emailed === false
          ? copy.invite.notSent
          : message(state, copy.invite.done)}
      </p>
      {state.status === "done" && state.link ? (
        <div className="flex flex-col gap-2">
          <label htmlFor={`${roleId}-link`} className="text-sm font-medium">
            {copy.invite.link}
          </label>
          <div className="flex gap-2">
            <input
              id={`${roleId}-link`}
              readOnly
              value={state.link}
              onFocus={(event) => event.currentTarget.select()}
              className="min-h-(--size-tap) min-w-0 flex-1 rounded-xl border border-line bg-background px-3 text-sm"
            />
            <button
              type="button"
              className={SELECT}
              onClick={() => {
                void navigator.clipboard.writeText(state.link ?? "").then(() => setCopied(true));
              }}
            >
              {copied ? copy.invite.copied : copy.invite.copy}
            </button>
          </div>
        </div>
      ) : null}
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
  areas: readonly string[];
}

export function MemberRow({ id, email, role, isSelf, editable, roles, areas }: MemberRowProps) {
  const [state, action, pending] = useActionState(updateStaffRole, INITIAL);
  const roleId = useId();
  return (
    <li className="flex flex-col gap-3 border-b border-line py-4 last:border-b-0 md:flex-row md:items-center md:justify-between">
      <p className="flex flex-col">
        <span className="font-medium break-all">{email}</span>
        <span className="text-sm text-ink-muted">
          {role === "member" ? areaList(areas) : admin.roles[role]}
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
              <RoleOptions roles={roles} keep={role} />
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
  areas: readonly string[];
  /** Whole hours until the link stops working; null for invites without a link. */
  hoursLeft: number | null;
  editable: boolean;
}

export function InviteRow({ id, email, role, areas, hoursLeft, editable }: InviteRowProps) {
  const [state, action, pending] = useActionState(revokeInvite, INITIAL);
  const [renewState, renew, renewing] = useActionState(renewInvite, INITIAL);
  return (
    <li className="flex flex-col gap-3 border-b border-line py-4 last:border-b-0 md:flex-row md:items-center md:justify-between">
      <p className="flex flex-col">
        <span className="font-medium break-all">{email}</span>
        <span className="text-sm text-ink-muted">
          {role === "member" ? areaList(areas) : admin.roles[role]} · {copy.pending}
          {hoursLeft !== null ? ` · ${copy.expires(hoursLeft)}` : ""}
        </span>
        {renewState.status === "done" && renewState.link ? (
          <span className="mt-1 text-sm break-all">{renewState.link}</span>
        ) : null}
      </p>
      {editable ? (
        <div className="flex flex-wrap items-center gap-3">
          <form action={renew}>
            <input type="hidden" name="id" value={id} />
            <button type="submit" disabled={renewing} className={TEXT_BUTTON}>
              {copy.renew}
              <span className="sr-only">: {email}</span>
            </button>
          </form>
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
        </div>
      ) : null}
    </li>
  );
}
