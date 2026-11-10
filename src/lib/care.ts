import { z } from "zod";

// Plant care facts shown on the product page. Stored as one jsonb object on products.care.
// Every value is a closed list (or short free text) so the page can map it to an icon and a label.

export const CARE_LIGHT = ["low", "medium", "bright"] as const;
export const CARE_WATER = ["low", "moderate", "frequent"] as const;
export const CARE_PET = ["safe", "toxic"] as const;
export const CARE_LEVEL = ["easy", "moderate", "expert"] as const;

const choice = <T extends readonly [string, ...string[]]>(values: T) =>
  z.union([z.literal(""), z.enum(values)]);

export const careSchema = z.object({
  light: choice(CARE_LIGHT),
  water: choice(CARE_WATER),
  pet: choice(CARE_PET),
  level: choice(CARE_LEVEL),
  size: z.string().trim().max(80),
  notes: z.string().trim().max(1200),
});

export type Care = z.infer<typeof careSchema>;

export const EMPTY_CARE: Care = { light: "", water: "", pet: "", level: "", size: "", notes: "" };

/** Reads whatever is stored; anything unknown falls back to empty so a bad row never breaks a page. */
export function parseCare(value: unknown): Care {
  const parsed = careSchema.safeParse({ ...EMPTY_CARE, ...(isRecord(value) ? value : {}) });
  return parsed.success ? parsed.data : EMPTY_CARE;
}

export const hasCare = (care: Care): boolean => Object.values(care).some(Boolean);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
