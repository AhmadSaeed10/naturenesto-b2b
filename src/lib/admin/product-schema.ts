import { z } from "zod";
import { HANDLE_PATTERN, toTag } from "@/lib/handle";
import { ENUMS } from "@/lib/db/enums";

const MAX_PAISA = 100_000_000_00;
const paisa = z.number().int().min(0).max(MAX_PAISA);
const optionalPaisa = paisa.nullable();

export const MAX_OPTIONS = 3;
export const MAX_VARIANTS = 100;
export const MAX_IMAGES = 30;

const optionSchema = z.object({
  name: z.string().trim().min(1).max(40),
  values: z.array(z.string().trim().min(1).max(60)).min(1).max(50),
});

const variantSchema = z.object({
  id: z.uuid().nullable(),
  title: z.string().trim().min(1).max(120),
  sku: z.string().trim().max(64),
  price: paisa,
  compare_at_price: optionalPaisa,
  cost: optionalPaisa,
  weight_g: z.number().int().min(0).max(1_000_000).nullable(),
  option_values: z.record(z.string(), z.string()),
  track_inventory: z.boolean(),
  allow_backorder: z.boolean(),
  low_stock_threshold: z.number().int().min(0).max(100_000),
  /** Only used when the variant is created; later changes go through adjust_stock. */
  initial_stock: z.number().int().min(0).max(1_000_000),
});

export const productSchema = z
  .object({
    id: z.uuid().nullable(),
    title: z.string().trim().min(1).max(200),
    handle: z.string().trim().max(100).regex(HANDLE_PATTERN),
    description: z.string().max(10_000),
    status: z.enum(ENUMS.product_status),
    vendor: z.string().trim().max(100),
    product_type: z.string().trim().max(100),
    tags: z
      .array(z.string())
      .max(40)
      .transform((tags) => [...new Set(tags.map(toTag).filter(Boolean))]),
    seo_title: z.string().trim().max(70),
    seo_description: z.string().trim().max(170),
    options: z.array(optionSchema).max(MAX_OPTIONS),
    variants: z.array(variantSchema).min(1).max(MAX_VARIANTS),
    images: z
      .array(z.object({ media_id: z.uuid(), alt: z.string().trim().max(300) }))
      .max(MAX_IMAGES),
    collection_ids: z.array(z.uuid()).max(100),
    category_ids: z.array(z.uuid()).max(100),
  })
  .superRefine((product, ctx) => {
    const names = product.options.map((option) => option.name.toLowerCase());
    if (new Set(names).size !== names.length) {
      ctx.addIssue({ code: "custom", path: ["options"], message: "duplicate option" });
    }
    // Every variant names a value for every option, and no two variants share a combination.
    const seen = new Set<string>();
    product.variants.forEach((variant, index) => {
      const key = product.options
        .map((option) => {
          const value = variant.option_values[option.name];
          if (!value || !option.values.includes(value)) {
            ctx.addIssue({ code: "custom", path: ["variants", index], message: "option value" });
          }
          return value;
        })
        .join("\u0000");
      if (product.options.length > 0 && seen.has(key)) {
        ctx.addIssue({ code: "custom", path: ["variants", index], message: "duplicate variant" });
      }
      seen.add(key);
    });
    const skus = product.variants.map((variant) => variant.sku).filter(Boolean);
    if (new Set(skus).size !== skus.length) {
      ctx.addIssue({ code: "custom", path: ["variants"], message: "duplicate sku" });
    }
  });

export type ProductInput = z.input<typeof productSchema>;
export type ProductPayload = z.output<typeof productSchema>;
export type VariantInput = ProductInput["variants"][number];

/** Description is stored as JSON so the rich text editor (Stage D) can extend it. */
export interface PlainDescription {
  format: "plain";
  text: string;
}

export function descriptionText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "text" in value && typeof value.text === "string") {
    return value.text;
  }
  return "";
}

/** Every combination of option values, in option order. */
export function optionCombinations(
  options: { name: string; values: string[] }[],
): Record<string, string>[] {
  return options.reduce<Record<string, string>[]>(
    (combos, option) =>
      combos.flatMap((combo) => option.values.map((value) => ({ ...combo, [option.name]: value }))),
    [{}],
  );
}
