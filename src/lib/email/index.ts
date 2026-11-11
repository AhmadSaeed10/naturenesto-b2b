import "server-only";

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

const RESEND_URL = "https://api.resend.com/emails";
const BREVO_URL = "https://api.brevo.com/v3/smtp/email";

/** Splits `Name <address>` (the EMAIL_FROM format) into its parts. */
function parseFrom(value: string): { name: string; email: string } {
  const match = /^\s*(.*?)\s*<([^>]+)>\s*$/.exec(value);
  return match
    ? { name: match[1] || "NatureNesto", email: (match[2] ?? "").trim() }
    : { name: "NatureNesto", email: value.trim() };
}

async function sendWithBrevo(key: string, message: EmailMessage): Promise<boolean> {
  const from = process.env.EMAIL_FROM;
  if (!from) {
    console.error("[email] EMAIL_FROM must be the sender address verified in Brevo");
    return false;
  }
  const response = await fetch(BREVO_URL, {
    method: "POST",
    headers: { "api-key": key, "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: parseFrom(from),
      to: [{ email: message.to }],
      subject: message.subject,
      textContent: message.text,
      htmlContent: message.html,
    }),
  });
  if (!response.ok)
    console.error("[email] Brevo refused the message", response.status, await response.text());
  return response.ok;
}

async function sendWithResend(key: string, message: EmailMessage): Promise<boolean> {
  const from = process.env.EMAIL_FROM ?? "NatureNesto <onboarding@resend.dev>";
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
  if (!response.ok)
    console.error("[email] Resend refused the message", response.status, await response.text());
  return response.ok;
}

/**
 * Sends one transactional email with one fetch call, no SDK. Brevo (free: 300 a day, any
 * recipient, only needs one verified sender address) is used when BREVO_API_KEY is set,
 * otherwise Resend (its free plan only reaches other people once a domain is verified).
 * With neither key, development prints the message to the terminal; production logs an error.
 */
export async function sendEmail(message: EmailMessage): Promise<boolean> {
  const brevo = process.env.BREVO_API_KEY;
  const resend = process.env.RESEND_API_KEY;
  if (!brevo && !resend) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`\n[email] To: ${message.to}\n[email] ${message.subject}\n${message.text}\n`);
      return true;
    }
    console.error("[email] BREVO_API_KEY or RESEND_API_KEY is not set, email not sent");
    return false;
  }
  try {
    return brevo
      ? await sendWithBrevo(brevo, message)
      : await sendWithResend(resend ?? "", message);
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

/** Gives a new team member their one time link to set a name and password. */
export function staffInviteEmail(
  inviteLink: string,
  accessLabel: string,
  invitedBy: string,
): Omit<EmailMessage, "to"> {
  const subject = "You are invited to the NatureNesto admin";
  const text = `${invitedBy} invited you to the NatureNesto admin (${accessLabel}).\n\nOpen this link to set your name and password. It works once and expires in 24 hours:\n${inviteLink}\n\nAfter that, sign in any time at /admin with your email and password.\n\nIf you were not expecting this, you can ignore this email.`;
  const html = `<p>${escapeHtml(invitedBy)} invited you to the NatureNesto admin (<strong>${escapeHtml(accessLabel)}</strong>).</p><p><a href="${escapeHtml(inviteLink)}">Set your name and password</a><br>The link works once and expires in 24 hours.</p><p>After that, sign in any time at /admin with your email and password.</p><p>If you were not expecting this, you can ignore this email.</p>`;
  return { subject, text, html };
}
