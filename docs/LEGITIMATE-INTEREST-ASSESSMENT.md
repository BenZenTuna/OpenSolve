# Legitimate Interest Assessment (LIA) — Email Address Storage

**Document version:** 1.0
**Date:** 2026-03-03
**Data controller:** Taner Tuna (OpenSolve operator — as listed in Impressum)
**Assessed by:** Taner Tuna
**Processing activity:** Storage and use of user email addresses obtained via Google OAuth
**Legal basis claimed:** GDPR Article 6(1)(f) — Legitimate Interest

**Scope note:** This assessment covers legitimate interest processing of email addresses for service notifications and platform communications only. It explicitly excludes newsletter communications — including advertising, sponsored content, and affiliate link processing — which are processed under a separate legal basis (GDPR Art. 6(1)(a) — Consent). See docs/NEWSLETTER-CONSENT-ASSESSMENT.md for the newsletter consent assessment.

---

## 1. Purpose of Processing

### What are we doing?

We store the email address of every registered user of OpenSolve (opensolve.ai). The email address is provided by Google as part of the OAuth 2.0 authentication flow. Only verified email addresses (confirmed by Google) are accepted.

### Why are we doing it?

We need to be able to contact users for service-critical communications:

1. **Privacy policy change notifications** — GDPR Article 13(3) requires us to inform data subjects of any changes to the purposes of processing or other material changes to our privacy policy. Without email, we have no way to reach users who have not visited the platform recently.

2. **Security breach notifications** — GDPR Article 34 requires us to notify data subjects without undue delay when a personal data breach is likely to result in a high risk to their rights and freedoms. Without email, we cannot fulfill this legal obligation.

3. **Terms of service changes** — We must inform users of material changes that affect their use of the platform.

4. **Account-critical notices** — Suspension, required action, or other matters that directly affect the user's account.

### What is the legitimate interest?

Our legitimate interest is twofold:

- **Compliance interest:** We have a legal obligation under GDPR to notify users of privacy policy changes and security breaches. Storing email is necessary to fulfill these obligations.
- **Operational interest:** We need a reliable communication channel to maintain a trustworthy platform and inform users of changes that affect their rights.

---

## 2. Necessity Test

### Is email storage necessary for the stated purpose?

**Yes.** There is no less intrusive means to achieve the same result:

- **In-app notifications only:** Users who don't visit the platform would never see the notification. This fails to meet the "without undue delay" requirement of Art. 34.
- **Username-only + public notice:** We have no way to confirm a user has seen a public notice. This does not constitute adequate individual notification.
- **OAuth ID only:** OAuth IDs are opaque identifiers with no communication channel.
- **Requiring email to be optional:** If email is optional, we cannot guarantee we can notify all users, creating a compliance gap for those who opted out.

### Data minimization

We collect ONLY the email address — not the user's full name, profile picture, or any other data available from Google OAuth. The email is the minimum data necessary to establish a communication channel.

---

## 3. Balancing Test

### Impact on data subjects

| Factor | Assessment |
|--------|-----------|
| Nature of data | Email address — personal data but not special category data |
| Sensitivity | Low — email addresses are routinely shared for service registration |
| Volume of data subjects | Small (pre-launch platform) |
| Expectations | Users signing in with Google reasonably expect their email may be stored for account-related communications |
| Power imbalance | Low — users can delete their account at any time to remove their email |
| Vulnerable individuals | No specific targeting of vulnerable groups; minors are not a target audience |

### Safeguards we have in place

1. **Transparency:** Users are informed at login that their email is stored (disclosure notice on the login page, detailed privacy policy).
2. **Purpose limitation:** Email is used ONLY for service-critical notifications. We explicitly commit to never sending marketing emails without separate consent.
3. **Data minimization:** We store only the email, not the full Google profile.
4. **Storage security:** Email stored in PostgreSQL on EU servers (Hetzner, Germany), behind Docker network isolation, SCRAM-SHA-256 authentication, no public port exposure.
5. **Access controls:** Email is accessible only to the user themselves (via Settings page) and administrators (via admin panel, which requires admin JWT + CSRF token).
6. **Deletion right:** Users can delete their account at any time via Settings > Delete Account, which permanently removes their email (GDPR Art. 17).
7. **Data portability:** Users can export all their data including email via Settings > Export Data (GDPR Art. 20).
8. **Right to object:** Users can object to email processing. If they do, we will assess whether our legitimate grounds override their objection.
9. **No third-party sharing:** Email is never shared with, sold to, or accessible by third parties.
10. **EU hosting:** All data stored within the EU (Hetzner, Germany), subject to EU data protection law.

### Balancing outcome

**The legitimate interest is not overridden by the data subject's rights and freedoms.** The processing is:
- **Minimal:** Only one data point (email) is collected
- **Expected:** Users signing up for a web service reasonably expect email collection
- **Proportionate:** The purpose (legal compliance notifications) directly serves the data subject's own interests in being informed about their rights
- **Safeguarded:** Robust technical and organizational measures are in place
- **Controllable:** Users have full control via deletion and export

---

## 4. Conclusion

Email storage under GDPR Article 6(1)(f) is justified because:

1. We have a clear legitimate interest in contacting users for service-critical notifications
2. Email storage is necessary — no less intrusive alternative achieves the same goal
3. The impact on data subjects is minimal and well-safeguarded
4. Data subjects' rights are not overridden by our interest
5. Users are fully informed and have deletion/export/objection rights

---

## 5. Review Schedule

This assessment will be reviewed:
- Annually, or
- When there is a material change in how email addresses are used, or
- If a data subject exercises their right to object, or
- If guidance from the Swedish IMY or EU EDPB changes the assessment landscape

---

## Appendix: Processing Register Entry (GDPR Art. 30)

| Field | Value |
|-------|-------|
| Processing activity | Storage of user email addresses for service notifications |
| Categories of data subjects | Registered users of OpenSolve |
| Categories of personal data | Email address |
| Purpose | Service-critical notifications (privacy changes, security breaches, terms changes) |
| Legal basis | Art. 6(1)(f) — Legitimate Interest |
| Recipients | No external recipients. Internal access limited to platform administrators. |
| Transfers to third countries | None. All data stored in EU (Hetzner, Germany). |
| Retention period | Lifetime of account. Deleted permanently on account deletion. |
| Technical measures | PostgreSQL with SCRAM-SHA-256, Docker network isolation, no public port exposure, TLS in transit |
| Organizational measures | Admin access requires JWT + CSRF token, rate-limited, activity logged |
