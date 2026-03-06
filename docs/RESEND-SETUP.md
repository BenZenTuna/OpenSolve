# Resend Email Setup (Coolify / Hetzner)

How to configure Resend as the email delivery layer for OpenSolve.

---

## 1. Domain Verification in Resend

1. Log into [resend.com](https://resend.com) → **Domains** → **Add Domain**
2. Enter: `opensolve.ai`
3. Resend will provide DNS records to add at your registrar (Porkbun):

| Type | Name | Value | Purpose |
|------|------|-------|---------|
| TXT | `opensolve.ai` | `v=spf1 include:...` | **SPF** — authorises Resend to send on your behalf |
| TXT | `resend._domainkey.opensolve.ai` | `v=DKIM1; ...` | **DKIM** — cryptographic signature proving email authenticity |
| TXT | `_dmarc.opensolve.ai` | `v=DMARC1; p=...` | **DMARC** — tells receivers how to handle SPF/DKIM failures |

4. Add these records in Porkbun → DNS → **Add Record**
5. Wait for verification (usually 10–30 minutes)
6. Once verified, you can use `noreply@mail.opensolve.ai` as the sender address

---

## 2. API Key Creation in Resend

1. Go to [resend.com](https://resend.com) → **API Keys** → **Create API Key**
2. Name: `OpenSolve Production`
3. Permission: **Sending access** only (NOT full access — principle of least privilege)
4. Copy the key immediately — it is shown only once
5. The key starts with `re_` followed by a long random string

---

## 3. Adding Secrets to Coolify

1. Open your OpenSolve **API service** in Coolify
2. Go to **Settings** → **Environment Variables**
3. Add the following variables:

| Variable | Value | Notes |
|----------|-------|-------|
| `RESEND_API_KEY` | `re_xxxx...` (your actual key) | Mark as **Secret** |
| `RESEND_FROM_EMAIL` | `noreply@mail.opensolve.ai` | Must match verified domain |
| `RESEND_FROM_NAME` | `OpenSolve` | Display name in recipient's inbox |

4. Mark `RESEND_API_KEY` as **Secret** (Coolify hides it in the UI after save)
5. **Redeploy** the API service for the variables to take effect

---

## 4. GDPR Compliance Note

- **Resend, Inc.** is a US-based data processor (headquartered in San Francisco)
- The sending infrastructure region is EU (Ireland, `eu-west-1`), but Resend's control plane and company are US-based — **Standard Contractual Clauses (SCCs) and a DPA are still required**
- Recipient email addresses are processed by Resend's systems for delivery
- Resend provides SCCs — sign their DPA at [resend.com/legal](https://resend.com/legal)
- Add Resend as a data processor in the OpenSolve privacy policy (Session E will handle this)
- Resend's privacy policy: [resend.com/legal/privacy-policy](https://resend.com/legal/privacy-policy)

---

## 5. Testing the Integration

After deploying with the new environment variables:

1. **Check API logs** — you should see `EmailService initialized` on startup
2. If `RESEND_API_KEY` is missing, the log will show a warning: `RESEND_API_KEY not set — email sending is disabled`
3. **Send a test email** via the admin panel (Session C will add this UI)
4. **Verify delivery** in the Resend dashboard → **Emails** tab
5. Check spam/junk folders if the email doesn't arrive — DNS propagation for SPF/DKIM may take up to 48 hours
