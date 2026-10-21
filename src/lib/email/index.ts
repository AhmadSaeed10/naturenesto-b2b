import "server-only";

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

const RESEND_URL = "https://api.resend.com/emails";

/**
 * Sends one transactional email through Resend (free: 100 a day). No SDK: one fetch call.
 * Without RESEND_API_KEY, development prints the message to the terminal so sign in links
 * still work; production logs an error and sends nothing.
 */
export async function sendEmail(message: EmailMessage): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`\n[email] To: ${message.to}\n[email] ${message.subject}\n${message.text}\n`);
      return true;
    }
    console.error("[email] RESEND_API_KEY is not set, email not sent");
    return false;
  }
  const from = process.env.EMAIL_FROM ?? "NatureNesto <onboarding@resend.dev>";
  try {
    const response = await fetch(RESEND_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        html: message.html,
      }),
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

const escapeHtml = (value: string): string =>
  value.replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c,
  );

/** The sign in email, for staff and customers. The link works once and expires in one hour. */
export function signInEmail(url: string): Omit<EmailMessage, "to"> {
  const subject = "Your NatureNesto sign in link";
  const text = `Use this link to sign in to NatureNesto. It works once and expires in one hour.\n\n${url}\n\nIf you did not ask for it, you can ignore this email.`;
  const html = `<p>Use this link to sign in to NatureNesto. It works once and expires in one hour.</p><p><a href="${escapeHtml(url)}">Sign in</a></p><p>If you did not ask for it, you can ignore this email.</p>`;
  return { subject, text, html };
}
