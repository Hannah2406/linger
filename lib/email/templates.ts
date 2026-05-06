// Simple HTML email templates. Warm voice, no preachy copy.

import { formatMoney } from "@/lib/format";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://linger.app";

const baseStyles = `
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: #faf6f1;
  color: #2a1a2e;
  padding: 32px 16px;
  line-height: 1.6;
`;

const wrapper = (inner: string) =>
  `<div style="${baseStyles}">
    <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 24px; padding: 32px; border: 1px solid #ece4dc;">
      ${inner}
      <p style="margin-top: 32px; font-size: 12px; color: #6b5a6e; text-align: center;">
        — Linger
      </p>
    </div>
  </div>`;

export function cooldownEndedEmail(args: {
  itemId: string;
  itemName: string;
  itemImage: string | null;
  price: number;
  currency: string;
}) {
  const subject = `Time's up on your ${args.itemName}`;
  const html = wrapper(`
    ${args.itemImage ? `<img src="${args.itemImage}" alt="" style="width:100%; aspect-ratio: 4/5; object-fit: cover; border-radius: 16px; margin-bottom: 16px;"/>` : ""}
    <p style="font-family: serif; font-size: 28px; margin: 0 0 8px;">Still want it?</p>
    <p style="margin: 0; color: #6b5a6e;">${args.itemName} · ${formatMoney(args.price, args.currency)}</p>
    <a href="${APP_URL}/items/${args.itemId}" style="display:inline-block; margin-top: 24px; background: #d98aa6; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 999px; font-weight: 500;">Decide now</a>
  `);
  return { subject, html };
}

export function priceDropEmail(args: {
  itemId: string;
  itemName: string;
  oldPrice: number;
  newPrice: number;
  currency: string;
  daysLeft: number;
}) {
  const subject = `${args.itemName} dropped to ${formatMoney(args.newPrice, args.currency)}`;
  const html = wrapper(`
    <p style="font-family: serif; font-size: 24px; margin: 0 0 8px;">A heads up.</p>
    <p style="margin: 0;">Your ${args.itemName} is now <strong>${formatMoney(args.newPrice, args.currency)}</strong> (was ${formatMoney(args.oldPrice, args.currency)}). Cooldown still has ${args.daysLeft} day${args.daysLeft === 1 ? "" : "s"}.</p>
    <a href="${APP_URL}/items/${args.itemId}" style="display:inline-block; margin-top: 24px; background: #d98aa6; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 999px;">View item</a>
  `);
  return { subject, html };
}

export function lowStockEmail(args: {
  itemId: string;
  itemName: string;
  daysLeft: number;
}) {
  const subject = `${args.itemName} is selling out`;
  const html = wrapper(`
    <p style="font-family: serif; font-size: 24px; margin: 0 0 8px;">A heads up.</p>
    <p style="margin: 0;">Your ${args.itemName} is selling out — last sizes or units. Cooldown still has ${args.daysLeft} day${args.daysLeft === 1 ? "" : "s"}.</p>
    <a href="${APP_URL}/items/${args.itemId}" style="display:inline-block; margin-top: 24px; background: #d98aa6; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 999px;">View item</a>
  `);
  return { subject, html };
}

export function milestoneEmail(args: {
  threshold: number;
  total: number;
  translation: string;
  currency: string;
}) {
  const subject = `You've kept ${formatMoney(args.threshold, args.currency)} ✨`;
  const html = wrapper(`
    <p style="font-family: serif; font-size: 40px; margin: 0 0 8px; color: #7a9b6e;">
      ${formatMoney(args.threshold, args.currency)}
    </p>
    <p style="font-family: serif; font-size: 22px; margin: 0 0 16px;">kept so far.</p>
    <p style="margin: 0; color: #6b5a6e;">
      That's roughly ${args.translation}. The lifetime counter on Linger now reads
      <strong>${formatMoney(args.total, args.currency)}</strong>.
    </p>
    <a href="${APP_URL}/home" style="display:inline-block; margin-top: 24px; background: #d98aa6; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 999px;">Open Linger</a>
  `);
  return { subject, html };
}
