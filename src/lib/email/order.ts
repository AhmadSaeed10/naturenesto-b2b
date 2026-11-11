import "server-only";
import { eq } from "drizzle-orm";
import { commerce } from "@/content/commerce";
import { getOrder } from "@/lib/commerce/orders";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { formatPaisa } from "@/lib/money";
import { siteUrl } from "@/lib/seo";
import { sendEmail } from "./index";

const copy = commerce.orderEmail;
const escapeHtml = (value: string): string =>
  value.replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c,
  );

/** Who hears about a new order: ORDER_NOTIFY_EMAIL when set, otherwise every owner account. */
async function recipients(): Promise<string[]> {
  const configured = process.env.ORDER_NOTIFY_EMAIL?.split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  if (configured?.length) return configured;
  const owners = await db()
    .select({ email: profiles.email })
    .from(profiles)
    .where(eq(profiles.role, "owner"));
  return owners.map((o) => o.email);
}

/**
 * Tells the shop and the buyer about a new order. Never throws: a mail problem must not undo
 * an order that is already saved.
 */
export async function sendOrderEmails(number: number, token: string): Promise<void> {
  try {
    const order = await getOrder(number, token);
    if (!order) return;
    const lines = order.items.map(
      (item) =>
        `${item.quantity} x ${item.title}${item.variantTitle ? ` (${item.variantTitle})` : ""}  ${formatPaisa(item.lineTotal)}`,
    );
    const address = [
      order.address.line1,
      order.address.line2,
      order.address.area,
      order.address.city,
    ]
      .filter(Boolean)
      .join(", ");
    const summary = [
      ...lines,
      "",
      `${copy.total}: ${formatPaisa(order.total)} (${order.paymentMethod})`,
      `${copy.customer}: ${order.fullName}, ${order.phone}, ${order.email}`,
      `${copy.address}: ${address}`,
      order.notes ? `${copy.notes}: ${order.notes}` : "",
    ].filter((line, index, all) => line || all[index - 1] !== "");
    const html = `<ul>${lines.map((l) => `<li>${escapeHtml(l)}</li>`).join("")}</ul><p>${escapeHtml(summary.slice(lines.length + 1).join("\n")).replace(/\n/g, "<br>")}</p>`;

    const base = siteUrl();
    const adminLink = `${base}/admin/orders/${order.number}`;
    const orderLink = `${base}/orders/${order.number}?t=${token}`;

    await Promise.all([
      ...(await recipients()).map((to) =>
        sendEmail({
          to,
          subject: copy.shopSubject(order.number, formatPaisa(order.total)),
          text: `${summary.join("\n")}\n\n${adminLink}`,
          html: `${html}<p><a href="${escapeHtml(adminLink)}">${copy.openInAdmin}</a></p>`,
        }),
      ),
      sendEmail({
        to: order.email,
        subject: copy.buyerSubject(order.number),
        text: `${copy.buyerIntro}\n\n${summary.join("\n")}\n\n${orderLink}`,
        html: `<p>${escapeHtml(copy.buyerIntro)}</p>${html}<p><a href="${escapeHtml(orderLink)}">${copy.viewOrder}</a></p>`,
      }),
    ]);
  } catch (error) {
    console.error("[order-email] failed", error instanceof Error ? error.message : error);
  }
}
