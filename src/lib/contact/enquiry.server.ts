import nodemailer from "nodemailer";

export type EnquiryPayload = {
  name: string;
  email: string;
  phone: string;
  company?: string;
  subject: string;
  message?: string;
  product?: string;
  sku?: string;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// Strip CR/LF to prevent SMTP header injection in single-line fields.
const oneLine = (value: string) => value.replace(/[\r\n]+/g, " ").trim();

export async function sendEnquiryEmail(payload: EnquiryPayload) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const to = process.env.SALES_EMAIL ?? user;

  if (!host || !user || !pass || !to) {
    throw new Error("Email is not configured on the server.");
  }

  const rows: Array<[string, string]> = [
    ["Name", payload.name],
    ["Email", payload.email],
    ["Phone", payload.phone],
  ];
  if (payload.company) rows.push(["Company", payload.company]);
  if (payload.product) rows.push(["Product", payload.product]);
  if (payload.sku) rows.push(["SKU", payload.sku]);

  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#1F2937">
    <h2 style="color:#0F4C81;margin:0 0 12px">New website enquiry</h2>
    <table cellpadding="6" style="border-collapse:collapse">
      ${rows
        .map(
          ([label, value]) =>
            `<tr><td style="color:#6b7280">${escapeHtml(label)}</td><td><strong>${escapeHtml(value)}</strong></td></tr>`,
        )
        .join("")}
    </table>
    ${payload.message ? `<p style="margin-top:16px;white-space:pre-wrap">${escapeHtml(payload.message)}</p>` : ""}
  </div>`;

  const text = [
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    payload.message ?? "",
  ].join("\n");

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: `"ADL Automotive Website" <${user}>`,
    to,
    replyTo: oneLine(payload.email),
    subject: oneLine(payload.subject).slice(0, 150),
    text,
    html,
  });
}