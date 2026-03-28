/**
 * Email HTML templates for OpenSolve.
 *
 * Plain TypeScript functions returning inline-styled HTML strings.
 * No external template libraries — keeps the dependency footprint small.
 */

// ---------------------------------------------------------------------------
// Shared layout helpers
// ---------------------------------------------------------------------------

const BRAND_COLOR = '#2563eb';
const BG_COLOR = '#f8fafc';
const TEXT_COLOR = '#1e293b';
const MUTED_COLOR = '#64748b';

function layout(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:${BG_COLOR};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${TEXT_COLOR};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BG_COLOR};">
<tr><td align="center" style="padding:40px 16px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;">
    <!-- Header -->
    <tr><td style="background-color:${BRAND_COLOR};padding:24px 32px;">
      <a href="https://opensolve.ai" style="color:#ffffff;font-size:22px;font-weight:700;text-decoration:none;">OpenSolve</a>
    </td></tr>
    <!-- Body -->
    <tr><td style="padding:32px;">
      ${body}
    </td></tr>
    <!-- Footer -->
    <tr><td style="padding:24px 32px;border-top:1px solid #e2e8f0;font-size:13px;color:${MUTED_COLOR};">
      <a href="https://opensolve.ai" style="color:${MUTED_COLOR};text-decoration:none;">opensolve.ai</a>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
}

function button(url: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
<tr><td style="background-color:${BRAND_COLOR};border-radius:6px;padding:14px 28px;">
  <a href="${url}" style="color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;display:inline-block;">${label}</a>
</td></tr>
</table>`;
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

/**
 * Important service notification (privacy policy changes, outage notices, etc.)
 *
 * Legal basis: GDPR Art. 6(1)(f) Legitimate Interest — no unsubscribe required.
 * These are infrequent, service-critical communications that users reasonably
 * expect to receive as part of using the platform.
 */
export function importantMessageTemplate(params: {
  subject: string;
  bodyHtml: string;
  username: string;
}): string {
  return layout(`
    <p style="margin:0 0 16px;font-size:15px;">Hi ${params.username},</p>
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:600;color:${TEXT_COLOR};">${params.subject}</h2>
    <div style="font-size:15px;line-height:1.6;color:${TEXT_COLOR};">
      ${params.bodyHtml}
    </div>
    <p style="margin:24px 0 0;font-size:13px;color:${MUTED_COLOR};">
      This is a service notification from OpenSolve. You are receiving this because it relates to your account.
    </p>
  `);
}

/**
 * Newsletter broadcast to opted-in subscribers.
 *
 * Legal basis: GDPR Art. 6(1)(a) Consent — double opt-in confirmed.
 * German UWG §7 compliance: unsubscribe must be one-click, no login required.
 */
export function newsletterTemplate(params: {
  subject: string;
  bodyHtml: string;
  username: string;
  unsubscribeUrl: string;
}): string {
  return layout(`
    <p style="margin:0 0 16px;font-size:15px;">Hi ${params.username},</p>
    <div style="font-size:15px;line-height:1.6;color:${TEXT_COLOR};">
      ${params.bodyHtml}
    </div>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0 16px;">
    <p style="font-size:13px;color:${MUTED_COLOR};margin:0 0 6px;">
      You are receiving this because you subscribed to the OpenSolve newsletter.
      <a href="${params.unsubscribeUrl}" style="color:${BRAND_COLOR};text-decoration:underline;">Unsubscribe</a>
    </p>
    <p style="font-size:11px;line-height:1.5;color:${MUTED_COLOR};margin:8px 0 0;">
      This newsletter may include sponsored content and affiliate links (*).
    </p>
    <!-- UWG §7 / Marknadsföringslagen: postal address required in commercial emails -->
    <p style="font-size:12px;color:${MUTED_COLOR};margin:0;">
      OpenSolve &mdash; Taner Tuna, Kantelegatan 21F, 656 36 Karlstad, Sweden &mdash;
      <a href="https://opensolve.ai" style="color:${MUTED_COLOR};text-decoration:none;">opensolve.ai</a>
    </p>
  `);
}

/**
 * Double opt-in confirmation email.
 *
 * Sent when a user subscribes to the newsletter. The subscription is not
 * active until they click the confirmation link.
 */
export function newsletterConfirmTemplate(params: {
  username: string;
  confirmUrl: string;
}): string {
  return layout(`
    <p style="margin:0 0 16px;font-size:15px;">Hi ${params.username},</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 8px;">
      Click below to confirm your OpenSolve newsletter subscription. You'll receive
      top AI solutions, leaderboard results, interesting AI news, and occasional sponsored content.
      Some emails include affiliate links marked with * — clicking them may earn OpenSolve
      a small commission at no cost to you.
    </p>
    ${button(params.confirmUrl, 'Confirm Subscription')}
    <p style="font-size:13px;color:${MUTED_COLOR};margin:0;">
      This link expires in 24 hours. If you did not request this, you can ignore this email.
    </p>
  `);
}

/**
 * Unsubscribe confirmation email.
 *
 * Sent after a user successfully unsubscribes from the newsletter.
 */
export function unsubscribeConfirmTemplate(params: {
  username: string;
}): string {
  return layout(`
    <p style="margin:0 0 16px;font-size:15px;">Hi ${params.username},</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 8px;">
      You've been unsubscribed. You won't receive any more newsletters from OpenSolve.
    </p>
    <p style="font-size:15px;line-height:1.6;margin:0;">
      Changed your mind? You can re-subscribe anytime in your
      <a href="https://opensolve.ai/settings" style="color:${BRAND_COLOR};text-decoration:underline;">account settings</a>.
    </p>
  `);
}

/**
 * Contact form submission — sent to contact@opensolve.ai.
 */
export function contactFormTemplate(params: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): string {
  return layout(`
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${TEXT_COLOR};">
      New contact form submission:
    </p>
    <table style="width:100%;border-collapse:collapse;margin:0 0 20px;">
      <tr>
        <td style="padding:8px 12px;font-weight:600;color:${TEXT_COLOR};vertical-align:top;width:80px;">From:</td>
        <td style="padding:8px 12px;color:${TEXT_COLOR};">${params.name || 'Not provided'} &lt;${params.email}&gt;</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;font-weight:600;color:${TEXT_COLOR};vertical-align:top;">Subject:</td>
        <td style="padding:8px 12px;color:${TEXT_COLOR};">${params.subject}</td>
      </tr>
    </table>
    <div style="background-color:#f1f5f9;border-radius:6px;padding:16px;margin:0 0 20px;">
      <p style="margin:0;font-size:14px;line-height:1.6;color:${TEXT_COLOR};white-space:pre-wrap;">${params.message}</p>
    </div>
  `);
}
