import { NextResponse } from "next/server";
import { PRODUCT_CSV_COLUMNS } from "@/lib/admin/product-csv";
import type { Json } from "@/lib/db/enums";
import { descriptionText } from "@/lib/admin/product-schema";
import { ACCESS, staffWithRole } from "@/lib/auth/staff";
import { toCsv } from "@/lib/csv";
import { paisaToRupees } from "@/lib/money";
import { asc, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { productOptions, products, productVariants } from "@/lib/db/schema";

/** Whole catalogue (not deleted) as CSV, one row per variant. */
export async function GET() {
  if (!(await staffWithRole(ACCESS.catalog))) {
    return new NextResponse(null, { status: 403 });
  }
  const [productRows, optionRows, variantRows] = await Promise.all([
    db().select().from(products).where(isNull(products.deletedAt)).orderBy(asc(products.handle)),
    db().select().from(productOptions).orderBy(asc(productOptions.position)),
    db().select().from(productVariants).orderBy(asc(productVariants.position)),
  ]);

  const rows = productRows.flatMap((product) => {
    const options = optionRows.filter((o) => o.productId === product.id);
    return variantRows
      .filter((v) => v.productId === product.id)
      .map((variant, index) => {
        const values =
          variant.optionValues &&
          typeof variant.optionValues === "object" &&
          !Array.isArray(variant.optionValues)
            ? (variant.optionValues as Record<string, unknown>)
            : {};
        const optionCells = [0, 1, 2].flatMap((i) => {
          const option = options[i];
          const value = option ? values[option.name] : undefined;
          return [option?.name ?? "", typeof value === "string" ? value : ""];
        });
        // Product fields only on the first row of each product, as in a Shopify export.
        const first = index === 0;
        return [
          product.handle,
          first ? product.title : "",
          first ? product.status : "",
          first ? product.vendor : "",
          first ? product.productType : "",
          first ? product.tags.join(", ") : "",
          first ? descriptionText(product.description as Json) : "",
          first ? product.seoTitle : "",
          first ? product.seoDescription : "",
          ...optionCells,
          variant.title,
          variant.sku,
          paisaToRupees(variant.price),
          paisaToRupees(variant.compareAtPrice),
          paisaToRupees(variant.cost),
          variant.weightG,
          variant.stock,
          variant.trackInventory,
          variant.allowBackorder,
        ];
      });
  });

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(toCsv([[...PRODUCT_CSV_COLUMNS], ...rows]), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="naturenesto-products-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
