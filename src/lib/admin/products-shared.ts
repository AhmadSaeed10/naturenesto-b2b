import type { Json } from "@/lib/db/enums";

// Types and helpers used by both admin server code and client components.

export interface CollectionRule {
  field: "tag" | "product_type" | "vendor";
  value: string;
}

export function parseRules(rules: Json): CollectionRule[] {
  if (!Array.isArray(rules)) return [];
  return rules.flatMap((rule) => {
    if (!rule || typeof rule !== "object" || Array.isArray(rule)) return [];
    const field = rule.field;
    const value = rule.value;
    if (
      (field === "tag" || field === "product_type" || field === "vendor") &&
      typeof value === "string" &&
      value
    ) {
      return [{ field, value }];
    }
    return [];
  });
}

export interface PickerOption {
  id: string;
  label: string;
}

export interface MediaPickerOption extends PickerOption {
  url: string;
}
