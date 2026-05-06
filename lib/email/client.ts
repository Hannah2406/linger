import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.RESEND_FROM || "Linger <hello@linger.app>";

export async function sendEmail(args: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set, skipping send", args.subject);
    return { skipped: true };
  }
  return await resend.emails.send({
    from: FROM,
    to: args.to,
    subject: args.subject,
    html: args.html,
  });
}
