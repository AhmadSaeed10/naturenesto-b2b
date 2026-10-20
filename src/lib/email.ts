import "server-only";
import { z } from "zod";
import { site } from "@/content/site";

// Order, bulk and enquiry emails go through Resend's HTTP API (no SDK). Plain text only,
// so customer input can never inject markup into the message.

const RESEND_URL = "https://api.resend.com/emails";
const TIMEOUT_MS = 10_000;

interface EmailConfig {
  apiKey: string;
  from: string;
  to: string;
}

function emailConfig(): EmailConfig | null {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ORDER_EMAIL_FROM;
  if (!apiKey || !from) return null;
  return { apiKey, from, to: process.env.ORDER_EMAIL_TO || site.email };
}

export const emailEnabled = (): boolean => emailConfig() !== null;

const address = z.email();

interface Message {
  subject: string;
  text: string;
  /** Defaults to the store inbox (ORDER_EMAIL_TO). */
  to?: string;
  replyTo?: string;
}

/** Sends one email. Returns false (and logs) on any failure; never throws. */
export async function sendEmail(message: Message): Promise<boolean> {
  const config = emailConfig();
  if (!config) return false;
  const replyTo = message.replyTo && address.safeParse(message.replyTo).success;
  try {
    const response = await fetch(RESEND_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: config.from,
        to: [message.to ?? config.to],
        subject: message.subject,
        text: message.text,
        ...(replyTo ? { reply_to: message.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      console.error("[email] Resend refused the message", response.status, await response.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error("[email] send failed", error instanceof Error ? error.message : error);
    return false;
  }
}
