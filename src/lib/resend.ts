import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

export const resend = apiKey ? new Resend(apiKey) : null;

export function requireResend(): Resend {
  if (!resend) {
    throw new Error(
      "Resend is not configured. Set RESEND_API_KEY in .env.local.",
    );
  }
  return resend;
}

export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "studio@example.com";
export const TO_EMAIL =
  process.env.RESEND_TO_EMAIL || "barbara@example.com";
