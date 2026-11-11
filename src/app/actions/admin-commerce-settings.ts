"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ACCESS, staffWithRole } from "@/lib/auth/staff";
import { rupeesToPaisa } from "@/lib/money";
import { and, count, eq } from "drizzle-orm";
import { withActor } from "@/lib/db";
import { paymentMethods, shippingRates, shippingZones, taxSettings } from "@/lib/db/schema";

// Owners and admins only, checked in manager(); writes are attributed through withActor.

export interface CommerceSettingsState {
  status: "idle" | "saved" | "invalid" | "forbidden" | "failed";
}

const PATH = "/admin/settings/commerce";
// Rupee amounts as typed (commas allowed), stored as paisa.
const paisa = z.string().transform((value, ctx) => {
  const amount = rupeesToPaisa(value);
  if (amount === null) ctx.addIssue({ code: "custom", message: "amount" });
  return amount ?? 0;
});
const optionalPaisa = z.union([z.literal("").transform(() => null), paisa]);
const cities = z
  .string()
  .max(4000)
  .transform((value) => [
    ...new Set(
      value
        .split(",")
        .map((city) => city.trim().toLowerCase())
        .filter(Boolean),
    ),
  ])
  .pipe(z.array(z.string().min(2).max(80)).max(200));

const zoneSchema = z.object({
  name: z.string().trim().min(1).max(80),
  cities,
  price: paisa,
  freeOver: optionalPaisa,
  active: z.boolean(),
});

const readZone = (formData: FormData) =>
  zoneSchema.safeParse({
    name: formData.get("name"),
    cities: String(formData.get("cities") ?? ""),
    price: String(formData.get("price") ?? ""),
    freeOver: String(formData.get("freeOver") ?? "").trim(),
    active: formData.get("active") === "on",
  });

async function manager() {
  return staffWithRole(ACCESS.storeSettings);
}

export async function saveShippingZone(
  _previous: CommerceSettingsState,
  formData: FormData,
): Promise<CommerceSettingsState> {
  const actor = await manager();
  if (!actor) return { status: "forbidden" };
  const id = z.uuid().safeParse(formData.get("id"));
  const rateId = z.union([z.literal(""), z.uuid()]).safeParse(String(formData.get("rateId") ?? ""));
  const zone = readZone(formData);
  if (!id.success || !rateId.success || !zone.success) return { status: "invalid" };

  try {
    await withActor(actor.id, async (tx) => {
      await tx
        .update(shippingZones)
        .set({ name: zone.data.name, cities: zone.data.cities })
        .where(eq(shippingZones.id, id.data));
      const rate = {
        price: zone.data.price,
        freeOver: zone.data.freeOver,
        active: zone.data.active,
      };
      if (rateId.data) {
        await tx.update(shippingRates).set(rate).where(eq(shippingRates.id, rateId.data));
      } else {
        await tx
          .insert(shippingRates)
          .values({ ...rate, zoneId: id.data, name: "Standard delivery" });
      }
    });
  } catch {
    return { status: "failed" };
  }
  revalidatePath(PATH);
  return { status: "saved" };
}

export async function addShippingZone(
  _previous: CommerceSettingsState,
  formData: FormData,
): Promise<CommerceSettingsState> {
  const actor = await manager();
  if (!actor) return { status: "forbidden" };
  const zone = readZone(formData);
  if (!zone.success) return { status: "invalid" };
  try {
    await withActor(actor.id, async (tx) => {
      const [existing] = await tx.select({ n: count() }).from(shippingZones);
      const [created] = await tx
        .insert(shippingZones)
        .values({ name: zone.data.name, cities: zone.data.cities, position: existing?.n ?? 0 })
        .returning({ id: shippingZones.id });
      if (!created) throw new Error("zone not created");
      await tx.insert(shippingRates).values({
        zoneId: created.id,
        name: "Standard delivery",
        price: zone.data.price,
        freeOver: zone.data.freeOver,
        active: zone.data.active,
      });
    });
  } catch {
    return { status: "failed" };
  }
  revalidatePath(PATH);
  return { status: "saved" };
}

export async function removeShippingZone(id: string): Promise<void> {
  const actor = await manager();
  if (!actor || !z.uuid().safeParse(id).success) return;
  // The default zone catches every unlisted city, so it is never removed.
  await withActor(actor.id, (tx) =>
    tx
      .delete(shippingZones)
      .where(and(eq(shippingZones.id, id), eq(shippingZones.isDefault, false))),
  );
  revalidatePath(PATH);
}

const taxSchema = z.object({
  label: z.string().trim().min(1).max(40),
  rate: z.coerce.number().min(0).max(100),
  included: z.boolean(),
});

export async function saveTaxSettings(
  _previous: CommerceSettingsState,
  formData: FormData,
): Promise<CommerceSettingsState> {
  const actor = await manager();
  if (!actor) return { status: "forbidden" };
  const parsed = taxSchema.safeParse({
    label: formData.get("label"),
    rate: formData.get("rate"),
    included: formData.get("included") === "on",
  });
  if (!parsed.success) return { status: "invalid" };
  try {
    await withActor(actor.id, (tx) =>
      tx
        .update(taxSettings)
        .set({
          label: parsed.data.label,
          // Basis points keep the rate an integer: 17.5 percent is 1750.
          rateBps: Math.round(parsed.data.rate * 100),
          pricesIncludeTax: parsed.data.included,
        })
        .where(eq(taxSettings.singleton, true)),
    );
  } catch {
    return { status: "failed" };
  }
  revalidatePath(PATH);
  return { status: "saved" };
}

const methodSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1).max(80),
  instructions: z.string().trim().max(1000),
  enabled: z.boolean(),
});

export async function savePaymentMethod(
  _previous: CommerceSettingsState,
  formData: FormData,
): Promise<CommerceSettingsState> {
  const actor = await manager();
  if (!actor) return { status: "forbidden" };
  const parsed = methodSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    instructions: String(formData.get("instructions") ?? ""),
    enabled: formData.get("enabled") === "on",
  });
  if (!parsed.success) return { status: "invalid" };
  try {
    await withActor(actor.id, (tx) =>
      tx
        .update(paymentMethods)
        .set({
          name: parsed.data.name,
          instructions: parsed.data.instructions || null,
          enabled: parsed.data.enabled,
        })
        .where(eq(paymentMethods.id, parsed.data.id)),
    );
  } catch {
    return { status: "failed" };
  }
  revalidatePath(PATH);
  return { status: "saved" };
}
