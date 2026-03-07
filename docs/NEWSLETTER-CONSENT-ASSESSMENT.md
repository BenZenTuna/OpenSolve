# Newsletter Consent Assessment
## OpenSolve — GDPR Article 6(1)(a) Consent Basis for Newsletter Processing

**Document version:** 1.1
**Date:** 2026-03-07
**Author:** OpenSolve operator
**Reviewed:** 2026-03-07

---

## 1. Purpose of This Document

This document records the legal basis assessment for the processing of personal data in connection with the OpenSolve newsletter. It demonstrates compliance with GDPR Article 6(1)(a) (consent) and German UWG §7 (prohibition on unsolicited commercial communications).

This assessment covers:
- The newsletter subscription and confirmation process
- The data processed during subscription
- The consent withdrawal mechanism
- The data retention period for consent records
- The distinction between newsletter consent and legitimate interest (service notifications)

---

## 2. Processing Activity Described

**Activity:** Sending periodic newsletter emails to users who have opted in.
**Data subjects:** OpenSolve registered users who have explicitly subscribed.
**Personal data processed:**
- Email address (already collected for service notifications under Art. 6(1)(f))
- Newsletter subscription status (boolean)
- Subscription confirmation timestamp
- IP address at time of opt-in confirmation
- Consent method (how the subscription was initiated)
- Unsubscribe token (pseudonymous, stored for one-click withdrawal)

**Data processor:** Resend, Inc. (email delivery only)

---

## 3. Why Consent — Not Legitimate Interest

Newsletter emails are not required to fulfill any function of the OpenSolve service. Unlike service notifications (which are necessary to fulfill transparency obligations under GDPR and to maintain the user relationship), newsletter emails are promotional communications whose sole purpose is to keep users informed about optional updates.

The three-part test for legitimate interest (necessity, balancing, reasonable expectation) is not satisfied for newsletter communications:

- **Necessity:** No — the platform operates fully without newsletter emails. A user who never receives a newsletter is not disadvantaged.
- **Balancing:** Newsletter emails impose a burden on the recipient (inbox clutter, attention cost) with no corresponding benefit to the user unless they want them. This tips the balance toward the data subject's interests.
- **Reasonable expectation:** A user signing up for an AI problem-solving platform would not reasonably expect to receive newsletter emails simply by creating an account.

Therefore, consent under Art. 6(1)(a) is the correct and only appropriate legal basis.

The Legitimate Interest Assessment (docs/LEGITIMATE-INTEREST-ASSESSMENT.md) explicitly carves out newsletter communications from the LI basis. Those two documents must be read together.

---

## 4. Consent Validity Under GDPR Article 7

GDPR Art. 4(11) defines consent as freely given, specific, informed, and unambiguous. Each element is addressed below.

**Freely given:**
- Newsletter subscription is entirely optional. No service functionality is withheld from non-subscribers.
- Subscription is not bundled with account creation or any other action.
- Non-subscribers are not treated differently in any way.
- The subscription toggle is presented neutrally, without dark patterns or pre-ticking.

**Specific:**
- The consent covers only: receiving periodic OpenSolve newsletter emails.
- It does not cover: service notifications (separate legal basis), third-party marketing, or any other processing activity.

**Informed:**
- The settings page clearly explains what the newsletter contains before subscribing.
- The confirmation email restates what the user is confirming.
- The privacy policy (accessible from all pages) explains the processing in detail.
- No hidden purposes.

**Unambiguous:**
- Consent is obtained via active action only: user clicks "Subscribe" and then clicks the confirmation link in the email (double opt-in).
- There is no pre-ticked box, no opt-out flow, no assumed consent.
- Silence does not constitute consent.

---

## 5. Double Opt-In — UWG §7 Compliance

German UWG §7(2)(3) prohibits advertising by electronic mail without prior explicit consent. German courts have consistently interpreted this to require double opt-in for email marketing: the recipient must confirm their email address and their intent to subscribe before any newsletter email is sent.

OpenSolve's implementation satisfies this requirement:

1. User clicks "Subscribe" in Settings — a confirmation email is sent immediately. The user's newsletter_subscribed status remains FALSE at this point.
2. The confirmation email contains a unique, time-limited link (24-hour expiry).
3. User clicks the confirmation link — only at this point does the system set newsletter_subscribed = TRUE and record the consent (IP, method, timestamp).
4. No newsletter content is ever sent before Step 3 is complete.

The confirmation email itself (Steps 1-2) is not a newsletter email — it is a transactional email required to complete the user's requested action. It does not contain promotional content and is sent under legitimate interest (Art. 6(1)(f)).

---

## 6. Consent Withdrawal Mechanism

GDPR Art. 7(3) requires that withdrawal of consent must be as easy as giving it.

**Available withdrawal methods:**
1. **One-click unsubscribe from email footer:** Every newsletter email contains a unique, per-user unsubscribe link. Clicking it immediately unsubscribes the user without requiring login, account access, or any additional confirmation step.
2. **Settings page toggle:** Logged-in users can toggle off newsletter subscription from their Settings page with a single confirmation step.

**Effect of withdrawal:**
- newsletter_subscribed is set to FALSE immediately.
- The unsubscribe token is rotated (old token invalidated).
- No further newsletter emails are sent.
- A confirmation email is sent informing the user of their unsubscription.
- The consent record (IP, method, timestamp) is retained for three years (see §7).

**Login requirement:** The email-footer unsubscribe link requires NO login. Requiring login to unsubscribe would violate UWG §7 and is explicitly prohibited.

---

## 7. Data Retention for Consent Records

The consent record (subscription timestamp, IP address, consent method) is retained for three years after the last subscription confirmation. This reflects:

- The standard limitation period for German civil claims (BGB §195 — three years from end of the year in which the claim arose)
- The practical need to defend against UWG §7 complaints, which require proof of prior consent

After three years, consent records are permanently deleted. The retention applies only to the consent record, not to the email address itself (which is retained under separate legal basis for service notifications).

---

## 8. Resend as Data Processor

Resend, Inc. processes recipient email addresses solely for the purpose of delivery. The Data Processing Agreement with Resend (signed via resend.com/legal) establishes:

- Resend acts as data processor (not controller) for delivery purposes
- Processing is limited to what is necessary for email delivery
- Resend does not use the data for its own purposes
- Standard Contractual Clauses (SCCs) govern the US transfer
- Resend's EU sending infrastructure (Ireland) is used

---

## 9. Conclusion

The OpenSolve newsletter processing satisfies all requirements for valid consent under GDPR Art. 6(1)(a) and Art. 7, and complies with German UWG §7 double opt-in requirements. The consent is freely given, specific, informed, unambiguous, and withdrawable at any time without disadvantage to the data subject.

---

## 10. Review Schedule

This assessment should be reviewed:
- When the newsletter scope or frequency changes materially
- When the consent collection mechanism changes
- When Resend is replaced with another email processor
- Annually as a routine compliance review

**Next scheduled review:** 2027-03-07

---

## 11. Commercial Content Scope

### Consent Scope Extension

The consent obtained via double opt-in explicitly covers:

- **Editorial content:** Platform highlights, top AI solutions, weekly/monthly leaderboard results, AI industry news
- **Sponsored content and advertisements:** Clearly labeled sections (marked "Advertisement" / "Anzeige")
- **Affiliate links:** Marked with an asterisk (*); clicking may earn OpenSolve a small commission at no extra cost to the subscriber

This scope is disclosed in: the opt-in banner (NewsletterBanner component), the Settings page newsletter description, the confirmation email, and the Terms of Service (Newsletter section).

### Legal Basis

- **All newsletter content including advertising:** GDPR Art. 6(1)(a) consent — the same consent basis as the newsletter subscription itself. Consent language has been updated across all touchpoints to explicitly cover commercial content.
- **Affiliate network click tracking:** Affiliate networks (e.g., Amazon Associates, impact.com) are independent data controllers. When a subscriber clicks an affiliate link, the affiliate network tracks the conversion under its own privacy policy. OpenSolve receives only aggregated commission data — no individual subscriber data is shared with or received from affiliate networks.

### UWG §7 / Marknadsföringslagen Compliance Measures

1. **Permanent disclosure block:** Every newsletter email contains a fixed disclosure block (immediately after the header, before content) stating that the email may contain sponsored content and affiliate links.
2. **Individual affiliate link marking:** All affiliate links are marked with an asterisk (*).
3. **Sponsored section labeling:** Sponsored content sections are labeled "Advertisement" / "Anzeige".
4. **Commercial intent disclosed at opt-in:** The NewsletterBanner, Settings page, and confirmation email all state that the newsletter includes occasional sponsored content and affiliate links before the user subscribes.
