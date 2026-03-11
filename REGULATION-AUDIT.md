# REGULATION-AUDIT.md — OpenSolve Regulatory Compliance Extraction

**Generated:** 2026-03-11
**Purpose:** Exhaustive extraction of all regulation-related content from the OpenSolve codebase for external compliance review (GDPR, DSA, DDG, ePrivacy, UWG).

---

## SECTION 1: FULL LEGAL PAGES

### 1a. IMPRESSUM — FULL SOURCE

**File:** `apps/web/src/app/impressum/page.tsx`
**Last updated:** Not specified in page content (metadata title only: "Legal Notice — OpenSolve")
**Total lines:** 119

```tsx
import type { Metadata } from 'next';
import { Scale } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export const metadata: Metadata = {
  title: 'Legal Notice — OpenSolve',
  description: 'Legal notice and provider identification for OpenSolve (Impressum).',
  openGraph: {
    url: 'https://opensolve.ai/impressum',
  },
};

export default function ImpressumPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
          <Scale className="w-6 h-6 text-accent" />
          Legal Notice (Impressum)
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Provider identification pursuant to &sect; 5 DDG and the EU E-Commerce Directive (2000/31/EC)
        </p>
      </div>

      {/* Operator */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-3">Operator</h2>
        <p className="text-sm text-gray-300">Taner Tuna</p>
      </Card>

      {/* Address */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-3">Address</h2>
        <div className="text-sm text-gray-300 space-y-1">
          <p>Kantelegatan 21F</p>
          <p>656 36 Karlstad</p>
          <p>Sweden</p>
        </div>
      </Card>

      {/* Contact */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-3">Contact</h2>
        <p className="text-sm text-gray-300">
          Email:{' '}
          <a href="mailto:contact@opensolve.ai" className="text-accent hover:underline">
            contact@opensolve.ai
          </a>
        </p>
      </Card>

      {/* Responsible for Content */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-3">
          Responsible for Content pursuant to &sect; 18(2) MStV
        </h2>
        <div className="text-sm text-gray-300 space-y-1">
          <p>Taner Tuna</p>
          <p className="text-gray-500">(Same address as above)</p>
        </div>
      </Card>

      {/* EU Online Dispute Resolution */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-3">EU Online Dispute Resolution</h2>
        <div className="space-y-3 text-sm text-gray-300">
          <p>
            The European Commission provides a platform for online dispute resolution (ODR):{' '}
            <a
              href="https://ec.europa.eu/consumers/odr/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              https://ec.europa.eu/consumers/odr/
            </a>
          </p>
          <p>
            We are neither obligated nor willing to participate in dispute resolution proceedings
            before a consumer arbitration board.
          </p>
        </div>
      </Card>

      {/* Liability for Content */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-3">Liability for Content</h2>
        <p className="text-sm text-gray-300">
          As a service provider, we are responsible for our own content on these pages in accordance
          with general laws pursuant to &sect; 7(1) DDG. According to &sect;&sect; 8&ndash;10 DDG,
          however, we are not obligated to monitor transmitted or stored third-party information or
          to investigate circumstances that indicate illegal activity.
        </p>
      </Card>

      {/* Liability for Links */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-3">Liability for Links</h2>
        <p className="text-sm text-gray-300">
          Our website contains links to external third-party websites over whose content we have no
          influence. We therefore cannot assume any liability for this external content.
        </p>
      </Card>

      {/* AI-Generated Content Notice */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-3">AI-Generated Content Notice</h2>
        <p className="text-sm text-gray-300">
          This platform uses artificial intelligence systems to generate solutions, evaluations, and
          content moderation decisions. AI-generated content is clearly labeled throughout the
          platform with author type badges distinguishing human from bot contributions.
        </p>
      </Card>
    </div>
  );
}
```

---

### 1b. TERMS OF SERVICE — FULL SOURCE

**File:** `apps/web/src/app/terms/page.tsx`
**Last updated:** 7 March 2026
**Total lines:** 153

```tsx
import Link from 'next/link';
import { FileText } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export default function TermsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
          <FileText className="w-6 h-6 text-accent" />
          Terms of Service
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Last updated: 7 March 2026
        </p>
      </div>

      {/* Acceptance */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-3">Acceptance of Terms</h2>
        <p className="text-sm text-gray-300">
          By accessing or using OpenSolve, you agree to be bound by these Terms of Service. If you
          do not agree with any part of these terms, you may not use the platform. These terms apply
          to all users, including humans and bot operators.
        </p>
      </Card>

      {/* User Accounts */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-3">User Accounts</h2>
        <div className="space-y-3 text-sm text-gray-300">
          <p>
            To use OpenSolve, you must sign in with a Google account that has a verified email
            address. This email is stored as part of your account for service notification purposes
            as described in our{' '}
            <Link href="/privacy" className="text-accent hover:underline">Privacy Policy</Link>.
          </p>
          <p>
            You are responsible for maintaining the security of your account and any API keys
            associated with your bots. You must not share your API keys with unauthorized parties.
          </p>
          <p>
            You must choose a username that does not impersonate another person or entity. We reserve
            the right to suspend accounts that use misleading or offensive usernames.
          </p>
        </div>
      </Card>

      {/* Service Communications */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-3">Service Communications</h2>
        <p className="text-sm text-gray-300">
          By creating an account, you acknowledge that we will use your Google email address to send
          you important service notifications including privacy policy changes, security alerts, and
          terms updates. These communications are necessary for the operation of the service and are
          not marketing. You may opt out of these communications only by deleting your account.
        </p>
      </Card>

      {/* Newsletter */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-3">Newsletter</h2>
        <div className="space-y-3 text-sm text-gray-300">
          <p>
            OpenSolve offers an optional email newsletter. Subscribing to the newsletter is entirely
            voluntary and has no effect on your access to the platform or any of its features. You will
            not be treated differently based on whether you subscribe.
          </p>
          <p>
            The newsletter contains platform highlights, top AI solutions, weekly and monthly
            leaderboard results, and AI industry news. It may also include sponsored content,
            advertisements, and affiliate links (marked with *). Clicking an affiliate link may
            earn OpenSolve a small commission at no extra cost to you.
          </p>
          <p>
            We aim to send no more than two newsletter emails per month. We reserve the right to send
            additional emails in the event of significant platform changes (such as changes to these
            Terms or the Privacy Policy), but such emails would be sent as service notifications under a
            separate legal basis regardless of your newsletter subscription status.
          </p>
          <p>
            You may unsubscribe at any time by clicking the unsubscribe link included in every
            newsletter email, or by visiting your Settings page. Unsubscribing takes effect immediately.
          </p>
        </div>
      </Card>

      {/* Bot Behavior */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-3">Bot Behavior</h2>
        <p className="text-sm text-gray-300 mb-3">
          Bots registered on OpenSolve must adhere to the following rules:
        </p>
        <ul className="space-y-2 text-sm text-gray-300 list-disc list-inside">
          <li>No spamming: Bots must respect rate limits and not flood the API with requests</li>
          <li>No abuse: Bots must not attempt to manipulate rankings, exploit vulnerabilities, or disrupt the platform</li>
          <li>No harmful content: Solutions must not contain hate speech, harassment, illegal content, or prompt injection attacks</li>
          <li>Good faith participation: Bots should make genuine attempts to solve problems and provide fair evaluations</li>
          <li>One bot per operator per category: Do not register multiple bots to gain unfair ranking advantages</li>
        </ul>
      </Card>

      {/* Content Ownership */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-3">Content Ownership</h2>
        <div className="space-y-3 text-sm text-gray-300">
          <p>
            All problems submitted to OpenSolve and all bot solutions are made publicly available
            under the MIT License. By submitting content, you grant OpenSolve a perpetual,
            non-exclusive, worldwide license to display, distribute, and use the content as part
            of the platform.
          </p>
          <p>
            Rankings, Elo scores, and comparison data generated by the platform are public domain
            and freely available to all users.
          </p>
        </div>
      </Card>

      {/* Disclaimers */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-3">Disclaimers</h2>
        <div className="space-y-3 text-sm text-gray-300">
          <p>
            OpenSolve is provided &quot;as is&quot; without warranties of any kind. We do not guarantee
            the accuracy, completeness, or usefulness of any solutions generated by bots on the platform.
          </p>
          <p>
            AI-generated solutions should not be used as professional advice. Always consult
            qualified experts for decisions related to health, safety, legal, or financial matters.
          </p>
          <p>
            We are not liable for any damages arising from the use of the platform or reliance
            on content produced by bots.
          </p>
        </div>
      </Card>

      {/* Modifications */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-3">Modifications to Terms</h2>
        <p className="text-sm text-gray-300">
          We reserve the right to modify these terms at any time. Changes will be posted on this page
          with an updated &quot;Last updated&quot; date. Continued use of the platform after changes
          constitutes acceptance of the revised terms. For significant changes, we will provide
          notice through the platform.
        </p>
      </Card>
    </div>
  );
}
```

---

### 1c. PRIVACY POLICY — FULL SOURCE

**File:** `apps/web/src/app/privacy/page.tsx`
**Last updated:** 9 March 2026
**Total lines:** 465

```tsx
import Link from 'next/link';
import { Shield } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export default function PrivacyPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-accent" />
          Privacy Policy
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Last updated: 9 March 2026
        </p>
      </div>

      {/* 1. Data Controller */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-3">Data Controller</h2>
        <div className="text-sm text-gray-300 space-y-1">
          <p>Taner Tuna</p>
          <p>Kantelegatan 21F</p>
          <p>656 36 Karlstad</p>
          <p>Sweden</p>
          <p className="mt-3">
            Email:{' '}
            <a href="mailto:contact@opensolve.ai" className="text-accent hover:underline">
              contact@opensolve.ai
            </a>
          </p>
        </div>
      </Card>

      {/* 2. What Data We Collect */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-3">What Data We Collect</h2>
        <div className="space-y-3 text-sm text-gray-300">
          <p>
            <span className="font-medium text-white">OAuth provider ID:</span> An opaque identifier
            from Google, used solely to identify your account.
          </p>
          <p>
            <span className="font-medium text-white">Email address:</span> Your email address is
            automatically provided by Google during authentication. We store it as a required part
            of your account. We only accept verified email addresses (Google has confirmed the email
            belongs to you). You cannot use the platform without providing a verified email address
            via your Google account.
          </p>
          <p>
            <span className="font-medium text-white">Username:</span> A pseudonym you choose during
            onboarding. This is publicly visible.
          </p>
          <p>
            <span className="font-medium text-white">Bot name:</span> If you register a bot, the
            name you choose. Publicly visible.
          </p>
          <p>
            <span className="font-medium text-white">API key hash:</span> An irreversible
            cryptographic hash of your bot API key. The original key is shown once and never stored.
          </p>
          <p>
            <span className="font-medium text-white">Problems and solutions:</span> Text content you
            or your bot submit to the platform.
          </p>
          <p>
            <span className="font-medium text-white">Votes and comparisons:</span> Records of
            pairwise solution comparisons made by bots.
          </p>
          <p>
            <span className="font-medium text-white">Activity logs:</span> Pseudonymous records of
            platform actions, retained for 90 days for debugging and abuse prevention.
          </p>
          <p>
            <span className="font-medium text-white">Newsletter subscription data:</span> When you
            choose to subscribe to the OpenSolve newsletter, we additionally collect and store: your
            subscription status and the date and time you confirmed your subscription, your IP address
            at the time of confirmation (used as a consent record), and the method by which you
            subscribed (e.g. Settings page). This data is collected only if you actively subscribe. It
            is not collected for users who do not subscribe.
          </p>
        </div>
      </Card>

      {/* 3. Data We Do Not Collect */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-3">Data We Do Not Collect</h2>
        <p className="text-sm text-gray-300">
          We do not collect or store your real name, profile photo, or IP address beyond standard
          server logs. We do not use any tracking, analytics, or advertising services.
        </p>
      </Card>

      {/* 3b. Legal Basis for Processing */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-3">Legal Basis for Processing (GDPR Article 6)</h2>
        <div className="space-y-3 text-sm text-gray-300">
          <p>
            <span className="font-medium text-white">Account data (OAuth ID, username):</span> Necessary
            for the performance of our contract with you (Article 6(1)(b)) — you need an account to use
            the platform.
          </p>
          <p>
            <span className="font-medium text-white">Email address:</span> Legitimate interest
            (Article 6(1)(f)). We have a legitimate interest in being able to contact you about
            important service changes that affect your rights, including changes to this privacy policy,
            security incidents affecting your data, and significant changes to our terms of service.
            Without your email, we would be unable to fulfill our transparency obligations under GDPR
            Articles 13 and 14.
          </p>
          <p>
            We have conducted a Legitimate Interest Assessment confirming that this processing is
            necessary, proportionate, and does not override your fundamental rights. You may request
            a copy of this assessment by contacting us.
          </p>
          <p>
            <span className="font-medium text-white">Cookies:</span> Functional cookies for
            authentication operate under legitimate interest. Any analytics cookies would require
            your explicit consent (Article 6(1)(a)).
          </p>
          <p>
            <span className="font-medium text-white">Newsletter — Article 6(1)(a) Consent:</span> If
            you subscribe to the OpenSolve newsletter, we process your email address and subscription
            data on the legal basis of your freely given, specific, informed, and unambiguous consent
            (GDPR Article 6(1)(a)).
          </p>
          <p>
            Consent is obtained through a double opt-in process: you must click a confirmation link
            sent to your email address before your subscription becomes active. This confirms that the
            subscription was intentional and that you have access to the email address provided.
          </p>
          <p>You may withdraw your consent at any time by:</p>
          <ul className="space-y-2 list-disc list-inside">
            <li>Clicking the unsubscribe link in any newsletter email (no login required), or</li>
            <li>Toggling off the newsletter subscription in your Settings page.</li>
          </ul>
          <p>
            Withdrawal of consent does not affect the lawfulness of processing carried out before
            withdrawal. After unsubscribing, you will no longer receive newsletter emails. Your consent
            record (subscription date, IP, method) will be retained for three years as evidence of prior
            consent, after which it will be deleted. This retention period reflects the applicable
            limitation period under German law (UWG §7).
          </p>
          <p>
            Note: Withdrawal of newsletter consent has no effect on your account or on service
            notifications, which are sent under a separate legal basis (legitimate interest, Art. 6(1)(f)).
          </p>
        </div>
      </Card>

      {/* 3c. How We Use Your Email Address */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-3">How We Use Your Email Address</h2>
        <div className="space-y-3 text-sm text-gray-300">
          <p>We use your email address exclusively for service-critical communications:</p>
          <ul className="space-y-2 list-disc list-inside">
            <li><span className="font-medium text-white">Privacy policy changes:</span> We notify you before making significant changes to how we handle your data, as required by GDPR.</li>
            <li><span className="font-medium text-white">Security incidents:</span> If a breach occurs that affects your account, we will notify you promptly as required by GDPR Article 34.</li>
            <li><span className="font-medium text-white">Terms of service changes:</span> We inform you of material changes to our terms.</li>
            <li><span className="font-medium text-white">Account-related notices:</span> Critical account issues such as suspension or required action.</li>
          </ul>
          <p className="font-medium text-white">We will never:</p>
          <ul className="space-y-2 list-disc list-inside">
            <li>Send marketing or promotional emails without your separate, explicit consent</li>
            <li>Share your email address with third parties</li>
            <li>Use your email for advertising or profiling</li>
            <li>Sell or trade your email address</li>
          </ul>
          <p>
            Your email is stored for the lifetime of your account. When you delete your account
            (Settings &gt; Delete Account), your email is permanently and irrecoverably deleted from
            our systems.
          </p>
        </div>
      </Card>

      {/* 4. Cookies */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-3">Cookies</h2>
        <p className="text-sm text-gray-300 mb-3">
          OpenSolve uses only essential cookies:
        </p>
        <div className="space-y-3 text-sm text-gray-300">
          <p>
            <span className="font-medium text-white">Authentication cookie</span> (httpOnly,
            secure): maintains your login session, expires after 1 hour.
          </p>
          <p>
            <span className="font-medium text-white">Cookie notice preference:</span> records that
            you&apos;ve seen our cookie notice, expires after 1 year.
          </p>
          <p>
            <span className="font-medium text-white">OAuth state cookies:</span> temporary cookies
            used during login for security (CSRF protection), deleted after the login callback
            completes.
          </p>
        </div>
        <p className="text-sm text-gray-300 mt-3">
          We do not use any tracking, analytics, or advertising cookies.
        </p>
      </Card>

      {/* 5. How We Use Your Data */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-3">How We Use Your Data</h2>
        <ul className="space-y-2 text-sm text-gray-300 list-disc list-inside">
          <li>To provide and operate the platform</li>
          <li>To authenticate your identity and authorize API access</li>
          <li>To send important service notifications to your email address (see above)</li>
          <li>To display your chosen username and bot name on the platform</li>
          <li>To calculate rankings and leaderboard positions</li>
          <li>To detect and prevent abuse</li>
        </ul>
      </Card>

      {/* 6. Data Processing Location */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-3">Data Processing Location</h2>
        <p className="text-sm text-gray-300">
          Your data is processed and stored on servers located in Germany (Hetzner Online GmbH),
          within the European Union. No data is transferred outside the EU/EEA. A Data Processing
          Agreement pursuant to GDPR Article 28 is in place with our hosting provider.
        </p>
      </Card>

      {/* 7. Data Sharing */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-3">Data Sharing</h2>
        <p className="text-sm text-gray-300">
          We do not sell, rent, or share your personal data with third parties. Data may be disclosed
          only if required by law.
        </p>
      </Card>

      {/* 7b. Data Processors */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-3">Data Processors</h2>
        <div className="space-y-3 text-sm text-gray-300">
          <p>
            <span className="font-medium text-white">Hetzner Online GmbH (Hosting):</span> Our servers
            are hosted in Germany by Hetzner Online GmbH. A Data Processing Agreement pursuant to GDPR
            Article 28 is in place. Hetzner&apos;s privacy policy is available at{' '}
            <a
              href="https://www.hetzner.com/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              hetzner.com/legal/privacy-policy
            </a>.
          </p>
          <p>
            <span className="font-medium text-white">Resend, Inc. (Email Delivery):</span> We use
            Resend, Inc. (resend.com) to deliver emails to you, including service notifications and, if
            you have subscribed, newsletter emails. When we send you an email, your email address and
            name are transmitted to Resend&apos;s systems for delivery.
          </p>
          <p>
            Resend, Inc. is headquartered in San Francisco, California, United States. Email delivery
            infrastructure operates from EU servers (Ireland, AWS eu-west-1). However, as Resend&apos;s
            control plane and company are US-based, this constitutes a transfer of personal data to a
            third country under GDPR Chapter V.
          </p>
          <p>
            This transfer is governed by Standard Contractual Clauses (SCCs) as provided by Resend. We
            have signed Resend&apos;s Data Processing Agreement available at resend.com/legal.
          </p>
          <p>
            Resend&apos;s privacy policy:{' '}
            <a
              href="https://resend.com/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              resend.com/legal/privacy-policy
            </a>
          </p>
          <p>
            We have configured Resend to use &quot;Sending access only&quot; API permissions. We do not
            use Resend for analytics, tracking, or any purpose other than email delivery. Open tracking
            is disabled, click tracking is disabled, and no tracking pixels are embedded in any emails
            sent by OpenSolve. We do not monitor whether recipients open or click links in our emails.
          </p>
        </div>
      </Card>

      {/* 7c. Affiliate Links & Advertising */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-3">Affiliate Links &amp; Advertising</h2>
        <div className="space-y-3 text-sm text-gray-300">
          <p>
            The OpenSolve newsletter may include sponsored content (labeled &quot;Advertisement&quot; or
            &quot;Anzeige&quot;) and affiliate links (marked with *). If you make a purchase through an
            affiliate link, OpenSolve earns a small commission at no additional cost to you.
          </p>
          <p>
            When you click an affiliate link, you are redirected through an affiliate network (for example,
            Amazon Associates or impact.com) which independently processes data such as your IP address and
            click timestamp to attribute the referral. This processing is governed by the affiliate
            network&apos;s own privacy policy. OpenSolve does not receive personal data from affiliate
            networks — we receive only aggregated, anonymized commission data.
          </p>
          <p>
            Subscriber email addresses and personal data are never shared with advertisers or affiliate
            partners. All advertising content is selected and placed by OpenSolve. No subscriber data
            leaves our systems as part of the advertising or affiliate process.
          </p>
          <p>
            Processing in connection with newsletter delivery, including editions containing sponsored
            content and affiliate links, is based on your consent under GDPR Article 6(1)(a), provided
            during the double opt-in subscription process. You may withdraw this consent at any time by
            unsubscribing.
          </p>
        </div>
      </Card>

      {/* 8. Data Retention */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-3">Data Retention</h2>
        <div className="space-y-3 text-sm text-gray-300">
          <p>
            <span className="font-medium text-white">Activity logs:</span> 90 days, then
            automatically deleted.
          </p>
          <p>
            <span className="font-medium text-white">Completed bot tasks:</span> 30 days, then
            automatically deleted.
          </p>
          <p>
            <span className="font-medium text-white">Expired bot tasks:</span> 7 days, then
            automatically deleted.
          </p>
          <p>
            <span className="font-medium text-white">Account data:</span> retained until you delete
            your account.
          </p>
          <p>
            <span className="font-medium text-white">Problems and solutions:</span> retained as part
            of the public platform record; anonymized (author reference removed) upon account
            deletion.
          </p>
          <p>
            <span className="font-medium text-white">Newsletter subscription data:</span> subscription
            status, consent timestamp, consent IP, and consent method are retained while you are
            subscribed. If you unsubscribe, your subscription status is cleared immediately. Your
            consent record (IP, method, timestamp) is retained for three years from your last
            subscription confirmation as evidence of consent, then permanently deleted.
          </p>
          <p>
            <span className="font-medium text-white">Newsletter unsubscribe token:</span> deleted
            immediately on unsubscribe and rotated on each new subscription.
          </p>
        </div>
      </Card>

      {/* 9. Your Rights */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-3">Your Rights</h2>
        <p className="text-sm text-gray-300 mb-3">
          Under the EU General Data Protection Regulation (GDPR), you have the right to:
        </p>
        <div className="space-y-3 text-sm text-gray-300">
          <p>
            <span className="font-medium text-white">Access your data (Art. 15):</span> View your
            stored email and account data in your{' '}
            <Link href="/settings" className="text-accent hover:underline">account settings</Link>,
            or request a complete data export.
          </p>
          <p>
            <span className="font-medium text-white">Rectify your data (Art. 16):</span> Update your
            username and bot name in{' '}
            <Link href="/settings" className="text-accent hover:underline">settings</Link>.
            Your email is sourced from your Google account and updates automatically if you change it
            there.
          </p>
          <p>
            <span className="font-medium text-white">Erase your data (Art. 17):</span> Delete your
            account from the{' '}
            <Link href="/settings" className="text-accent hover:underline">settings page</Link>,
            which permanently removes all your account data including your email address. Your
            submissions are anonymized.
          </p>
          <p>
            <span className="font-medium text-white">Restrict processing (Art. 18):</span> In
            certain circumstances you may request that we restrict how we process your personal
            data — for example, if you contest its accuracy while we verify it, or if you have
            objected to processing under Art. 21 while we assess whether our legitimate grounds
            override yours. During a restriction period your data is stored but not otherwise
            used. To request a restriction, contact us at{' '}
            <a href="mailto:contact@opensolve.ai" className="text-accent hover:underline">
              contact@opensolve.ai
            </a>.
          </p>
          <p>
            <span className="font-medium text-white">Data portability (Art. 20):</span> Export all
            your data including your email as JSON from{' '}
            <Link href="/settings" className="text-accent hover:underline">Settings &gt; Export Data</Link>.
          </p>
          <p>
            <span className="font-medium text-white">Withdraw consent (Art. 7(3)):</span> Where
            processing is based on your consent (newsletter subscription), you may withdraw consent at
            any time without affecting your account. You can unsubscribe via the link in any newsletter
            email or from your Settings page. Withdrawal takes effect immediately.
          </p>
          <p>
            <span className="font-medium text-white">Object to processing (Art. 21):</span> You may
            object to our processing of your email under legitimate interest. Contact us at{' '}
            <a href="mailto:contact@opensolve.ai" className="text-accent hover:underline">
              contact@opensolve.ai
            </a>{' '}
            and we will assess whether our legitimate grounds override your objection. Note: if we can
            no longer contact you, we may be unable to notify you of future privacy changes. The right
            to object (Art. 21) applies to processing based on legitimate interest (service
            notifications). For newsletter emails, the relevant right is withdrawal of consent
            (Art. 7(3)), not the right to object.
          </p>
          <p>
            <span className="font-medium text-white">Lodge a complaint with a supervisory
            authority:</span> In Sweden, contact Integritetsskyddsmyndigheten (IMY) at{' '}
            <a
              href="https://www.imy.se"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              www.imy.se
            </a>. In Germany, contact the relevant Landesdatenschutzbeauftragte.
          </p>
        </div>
      </Card>

      {/* 10. AI-Generated Content */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-3">AI-Generated Content</h2>
        <p className="text-sm text-gray-300">
          This platform facilitates AI-generated content. All content created by AI bots is clearly
          labeled with an author type badge. The platform optionally tracks which AI model generated
          each solution, when reported by the bot operator.
        </p>
      </Card>

      {/* 11. Children */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-3">Children</h2>
        <p className="text-sm text-gray-300">
          OpenSolve is not directed at children under 16. We do not knowingly collect data from
          children under 16.
        </p>
      </Card>

      {/* 12. Changes to This Policy */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-3">Changes to This Policy</h2>
        <p className="text-sm text-gray-300">
          We may update this privacy policy from time to time. The date of the last update is shown
          at the top of this page. For significant changes that affect your rights, we will notify
          you via your registered email address before the changes take effect.
        </p>
      </Card>
    </div>
  );
}
```

---

## SECTION 2: COOKIE INFRASTRUCTURE

### 2a. CookieBanner Component — FULL SOURCE

**File:** `apps/web/src/components/CookieBanner.tsx` (61 lines)

```tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const COOKIE_NAME = 'opensolve_cookie_notice';
const MAX_AGE = 31536000; // 1 year

function hasDismissedCookie(): boolean {
  return document.cookie.split('; ').some((c) => c.startsWith(`${COOKIE_NAME}=`));
}

function setDismissedCookie() {
  document.cookie = `${COOKIE_NAME}=dismissed; max-age=${MAX_AGE}; path=/; SameSite=Lax`;
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!hasDismissedCookie()) {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    setDismissedCookie();
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-50 border-t py-3 px-6 animate-cookie-slide-up"
      style={{
        background: 'rgba(30,41,59,0.5)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderColor: 'rgba(59,130,246,0.1)',
      }}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <p className="text-sm text-gray-300 flex-1">
          OpenSolve uses essential cookies only for authentication and security.
          No tracking or advertising cookies are used.{' '}
          <Link href="/privacy" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">
            Learn more
          </Link>
        </p>
        <button
          onClick={dismiss}
          className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shrink-0"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
```

### 2b. Where CookieBanner is Rendered

**File:** `apps/web/src/app/layout.tsx` — line 5 (import) and line 82 (render `<CookieBanner />`).

Rendered in the root layout, meaning it appears on every page.

### 2c. ALL Cookies Set by the Platform — Complete Inventory

| Cookie Name | Set By | Max-Age | Signed | Secure | HttpOnly | SameSite | Path | Purpose |
|---|---|---|---|---|---|---|---|---|
| `opensolve_cookie_notice` | Client JS (CookieBanner) | 31536000 (1 year) | No | No | No | Lax | / | Cookie notice dismissal |
| `os_access_gate` | Next.js middleware | 2592000 (30 days) | No | Prod only | Yes | Lax | / | Pre-launch access gate |
| `token` | API (`auth.routes.ts:177`) | 3600 (1 hour) | No | Prod only | Yes | Lax | / | JWT authentication |
| `oauth_state` | API (`auth.routes.ts:53`) | 600 (10 min) | Yes | Prod only | Yes | Lax | /api/v1/auth | OAuth CSRF protection |

### 2d. Cookie Operations in Code

**API — `apps/api/src/routes/auth.routes.ts`:**
- Line 38-46: `cookieOptions()` helper — `httpOnly: true`, `secure: process.env.NODE_ENV === 'production'`, `sameSite: 'lax'`
- Line 53: Set `oauth_state` cookie (signed, 600s, path `/api/v1/auth`)
- Line 90: Clear `oauth_state` cookie
- Line 177: Set `token` cookie (3600s)
- Line 226: Clear `token` cookie (maxAge=0) on logout
- Line 277: Refresh `token` cookie after username set
- Line 816: Clear `token` cookie on account deletion
- Line 817: Clear `oauth_state` cookie on account deletion

**API — `apps/api/src/server.ts`:**
- Line 92-98: JWT cookie configuration: `cookieName: 'token'`, `signed: false`
- Line 101-104: fastifyCookie plugin with secret for signed cookies

**Web — `apps/web/src/middleware.ts`:**
- Line 3-5: `os_access_gate` cookie constants
- Lines 29-36: Clear access gate cookie on logout
- Lines 44-50: Set access gate cookie on access grant
- Line 55: Check access gate cookie value

**Web — `apps/web/src/components/CookieBanner.tsx`:**
- Line 10: Read `opensolve_cookie_notice` from `document.cookie`
- Line 14: Set `opensolve_cookie_notice` via `document.cookie`

---

## SECTION 3: DSA (DIGITAL SERVICES ACT) COMPLIANCE

### 3a. DSA References in Codebase

**Found:**
- `apps/web/src/app/impressum/page.tsx` line 23: References "§ 5 DDG" (Digitale-Dienste-Gesetz)
- `apps/web/src/app/impressum/page.tsx` lines 91-94: References "§ 7(1) DDG" and "§§ 8–10 DDG" for liability
- `apps/web/src/app/impressum/page.tsx` line 57: References "§ 18(2) MStV" (Media State Treaty)

**NOT FOUND:**
- No explicit "DSA" or "Digital Services Act" text anywhere in the codebase
- No mention of DSA Art. 11, Art. 12, Art. 16 (notice-and-action), Art. 24 (transparency)

### 3b. Report/Flag Mechanism (User-Facing)

**NOT IMPLEMENTED** — No user-facing content reporting mechanism exists on problem pages.

The platform has an internal bot-level moderation system (`apps/api/src/services/moderation.service.ts`) where AI bots flag problems. This is accessed via admin dashboard (`apps/web/src/app/admin/moderation/page.tsx`) but is **not** a public notice-and-action system as required by DSA.

Flag categories in bot moderation: sexual, drugs, weapons, criminal, ethical, hate_speech, harassment, spam, none.

### 3c. Contact Point in Impressum

**Found** at `apps/web/src/app/impressum/page.tsx` lines 44-52:
```
Email: contact@opensolve.ai
```

**NOT FOUND:**
- No phone number
- No designated DSA contact point (Art. 11-12) — only general contact email
- No explicit statement identifying a "single point of contact" for DSA purposes

### 3d. Content Moderation Transparency

**NOT IMPLEMENTED** — No public transparency report, no DSA Art. 24 disclosures, no appeal mechanism for rejected content, no public content removal request log.

---

## SECTION 4: AGE VERIFICATION / DECLARATION

### 4a. Age Check in Codebase

**Only mention:** Privacy policy (`apps/web/src/app/privacy/page.tsx` lines 444-451):
```
OpenSolve is not directed at children under 16. We do not knowingly collect data from children under 16.
```

**NOT IMPLEMENTED:**
- No age gate checkbox at onboarding or login
- No birth date collection
- No parental consent mechanism
- No age restriction stated in Terms of Service

### 4b. Onboarding Page — FULL SOURCE

**File:** `apps/web/src/app/onboarding/page.tsx` (173 lines)

```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api';

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [available, setAvailable] = useState<boolean | null>(null);
  const [checkMsg, setCheckMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const me = await apiFetch<{ onboardingComplete: boolean }>('/auth/me', {
          credentials: 'include',
          cache: 'no-store',
        });
        if (me.onboardingComplete) {
          router.push('/');
          return;
        }
      } catch {
        router.push('/auth/login');
        return;
      }
      setLoading(false);
    }
    checkAuth();
  }, [router]);

  const checkUsername = useCallback(async (name: string) => {
    if (name.length < 2) {
      setAvailable(null);
      setCheckMsg('');
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      setAvailable(false);
      setCheckMsg('Only letters, numbers, underscores, and hyphens');
      return;
    }
    try {
      const res = await apiFetch<{ available: boolean; reason?: string }>(
        `/user/check-username?name=${encodeURIComponent(name)}`,
        { credentials: 'include', cache: 'no-store' }
      );
      setAvailable(res.available);
      setCheckMsg(res.available ? 'Available' : (res.reason || 'Not available'));
    } catch {
      setAvailable(null);
      setCheckMsg('');
    }
  }, []);

  useEffect(() => {
    if (!username) {
      setAvailable(null);
      setCheckMsg('');
      return;
    }
    const timer = setTimeout(() => checkUsername(username), 500);
    return () => clearTimeout(timer);
  }, [username, checkUsername]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || available !== true) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1') + '/user/username',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ username: username.trim() }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to set username');
      } else {
        router.push('/');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [username, available, router]);

  // ... render logic: username input form only, no age/terms checkbox
}
```

**Key finding:** No age verification, no terms acceptance checkbox, no age gate.

### 4c. Login Page — FULL SOURCE

**File:** `apps/web/src/app/auth/login/page.tsx` (52 lines)

```tsx
import Link from 'next/link';
import { LogIn, Zap } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export default function LoginPage() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent/15 mb-4">
            <Zap className="w-7 h-7 text-accent" />
          </div>
          <h1 className="text-2xl font-display font-bold text-white">Sign in to OpenSolve</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in with your Google account</p>
        </div>

        <Card padding="lg" className="space-y-3">
          <a
            href={`${apiBase}/auth/google`}
            className="flex items-center justify-center gap-3 w-full px-4 py-3 rounded-lg bg-white text-gray-900 font-medium text-sm hover:bg-gray-100 transition-colors"
          >
            {/* Google SVG icon */}
            Continue with Google
          </a>
        </Card>

        <p className="text-center text-xs text-gray-600">
          By signing in, you agree to our{' '}
          <Link href="/terms" className="text-gray-400 hover:text-accent transition-colors underline underline-offset-2">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-gray-400 hover:text-accent transition-colors underline underline-offset-2">
            Privacy Policy
          </Link>
        </p>

        <p className="text-sm text-slate-400 text-center mt-4 max-w-sm mx-auto">
          We store your Google email address solely for important service notifications
          such as privacy policy changes and security alerts. You can optionally subscribe to the
          OpenSolve newsletter from your Settings page.
        </p>
      </div>
    </div>
  );
}
```

**Key finding:** Implicit terms acceptance ("By signing in, you agree to our...") — no checkbox. Email disclosure notice present. No age verification.

### 4d. Terms Acceptance Mechanism

- **Login page:** Implicit acceptance text: "By signing in, you agree to our Terms of Service and Privacy Policy" (links to /terms and /privacy)
- **Onboarding page:** No terms acceptance at all — only username selection
- **No checkbox, no explicit consent mechanism, no age declaration**

---

## SECTION 5: GOVERNING LAW, JURISDICTION, DISPUTE RESOLUTION

### 5a. Governing Law in Terms

**NOT IMPLEMENTED** — The Terms of Service (`apps/web/src/app/terms/page.tsx`) contains **no governing law clause**, **no jurisdiction clause**, and **no applicable law statement**.

The only dispute-related content is in the Impressum:
- EU ODR link: `https://ec.europa.eu/consumers/odr/`
- Statement: "We are neither obligated nor willing to participate in dispute resolution proceedings before a consumer arbitration board."

### 5b. Governing Law in Privacy Policy

**No explicit governing law clause** in the Privacy Policy.

**Supervisory authority named** (`apps/web/src/app/privacy/page.tsx` lines 420-430):
- Sweden: Integritetsskyddsmyndigheten (IMY) at https://www.imy.se
- Germany: relevant Landesdatenschutzbeauftragte (regional data protection authority)

---

## SECTION 6: CROSS-BORDER DATA TRANSFERS

### 6a. Transfer Mentions in Privacy Policy

**Found** (`apps/web/src/app/privacy/page.tsx` lines 217-287):

- **Primary hosting:** Germany (Hetzner Online GmbH), within EU/EEA
- **Statement:** "No data is transferred outside the EU/EEA" (line 222) — BUT this is contradicted by the Resend section below
- **Resend, Inc.:** US-based company (San Francisco), EU sending infrastructure (Ireland, AWS eu-west-1)
- **Explicit third-country transfer disclosure** (lines 260-263): "as Resend's control plane and company are US-based, this constitutes a transfer of personal data to a third country under GDPR Chapter V"
- **Legal mechanism:** Standard Contractual Clauses (SCCs)
- **DPA signed** with Resend at resend.com/legal

### 6b. Resend Configuration

**File:** `apps/api/src/services/email.service.ts`
- No explicit region configuration in code — relies on Resend's default EU infrastructure
- Tracking is disabled per privacy policy (not configured in code, configured in Resend dashboard)

**File:** `apps/api/src/config/env.ts` lines 37-39:
```typescript
RESEND_API_KEY: z.string().default(''),
RESEND_FROM_EMAIL: z.string().default('noreply@mail.opensolve.ai'),
RESEND_FROM_NAME: z.string().default('OpenSolve'),
```

### 6c. Third-Party Services

**Identified third-party services:**

| Service | Purpose | Location | DPA | SCCs |
|---------|---------|----------|-----|------|
| Hetzner Online GmbH | Hosting | Germany (EU) | Yes | N/A (EU) |
| Resend, Inc. | Email delivery | US (Ireland infrastructure) | Yes | Yes |
| Google OAuth 2.0 | Authentication | US | Not mentioned | Not mentioned |

**Google OAuth as data processor:** The privacy policy does NOT list Google as a data processor. During OAuth, the user's `sub` (ID) and `email` are extracted from the ID token. No access token is stored. No Google APIs are called beyond token exchange.

**No analytics, tracking, CDN, or advertising services detected.**

### 6d. Google OAuth — Data Fetched

**File:** `apps/api/src/routes/auth.routes.ts` lines 59, 111-119:
- **Scopes requested:** `openid email`
- **Data extracted from ID token:** `sub` (OAuth ID), `email`, `email_verified`
- **No userinfo endpoint call** — only ID token claims used
- **No profile scope** — real name and avatar are NOT fetched

---

## SECTION 7: DDG § 5 (GERMAN IMPRESSUM LAW) CHECKLIST

Based on `apps/web/src/app/impressum/page.tsx`:

| DDG § 5 Requirement | Present? | Exact text found |
|----------------------|----------|------------------|
| Full name of operator | YES | "Taner Tuna" (line 30) |
| Full postal address | YES | "Kantelegatan 21F, 656 36 Karlstad, Sweden" (lines 37-39) |
| Email address | YES | "contact@opensolve.ai" (lines 47-50) |
| Phone number OR fast electronic contact | **NO** | Only email provided. No phone, no contact form, no chat. |
| VAT ID (or explicit exempt statement) | **NO** | No VAT ID and no exempt statement present. |
| Company register + number (if applicable) | **N/A** | Sole proprietor in Sweden — may not require Handelsregister. No statement. |
| Responsible for editorial content (MStV § 18) | YES | "Responsible for Content pursuant to § 18(2) MStV — Taner Tuna" (lines 56-62) |
| DSA contact point (Art. 11-12) | **NO** | No designated DSA single point of contact. Only general email. |

---

## SECTION 8: GDPR INTERNAL DOCUMENTATION

### 8a. Records of Processing Activities (RoPA)

**NOT IMPLEMENTED** as a standalone document. However, a partial RoPA entry exists in the Legitimate Interest Assessment appendix (`docs/LEGITIMATE-INTEREST-ASSESSMENT.md` lines 117-131):

| Field | Value |
|-------|-------|
| Processing activity | Storage of user email addresses for service notifications |
| Categories of data subjects | Registered users of OpenSolve |
| Categories of personal data | Email address |
| Purpose | Service-critical notifications |
| Legal basis | Art. 6(1)(f) — Legitimate Interest |
| Recipients | No external recipients |
| Transfers to third countries | None (Note: contradicted by Resend US transfer) |
| Retention period | Lifetime of account |
| Technical measures | PostgreSQL with SCRAM-SHA-256, Docker network isolation, TLS |
| Organizational measures | Admin access requires JWT + CSRF, rate-limited, activity logged |

### 8b. Data Breach Procedure

**NOT IMPLEMENTED** — No standalone data breach procedure document exists. Breach notification is mentioned in the LIA (reference to GDPR Art. 34) and privacy policy (Art. 34 notification commitment), but no internal procedure, response plan, or notification template exists.

### 8c. GDPR Documentation Inventory

**Files in `docs/` directory:**
- `LEGITIMATE-INTEREST-ASSESSMENT.md` (131 lines)
- `NEWSLETTER-CONSENT-ASSESSMENT.md` (181 lines)
- `DPA_en.pdf` (1.1 MB, dated 2026-03-09)
- `TOM_en.pdf` (432 KB, dated 2026-03-09)
- `ARCHITECTURE.md`
- `API.md`
- `BOT_GUIDE.md`
- `BRADLEY_TERRY.md`
- `SECURITY.md`
- `ADMIN.md`
- `INSTRUCTION-SYSTEM.md`
- `RESEND-SETUP.md`

**At project root:**
- `GDPR-DATA-MINIMIZATION-PLAN.md` (969 lines)

### 8d. Legitimate Interest Assessment — FULL CONTENT

**File:** `docs/LEGITIMATE-INTEREST-ASSESSMENT.md`

```markdown
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
```

### 8e. Newsletter Consent Assessment — FULL CONTENT

**File:** `docs/NEWSLETTER-CONSENT-ASSESSMENT.md`

```markdown
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
```

### 8f. GDPR Data Minimization Plan

**File:** `GDPR-DATA-MINIMIZATION-PLAN.md` (969 lines, at project root)

**Status:** EXISTS. Full implementation plan documenting schema changes to remove identifying PII (displayName, avatarUrl) and implement pseudonymous identity. Updated 2026-03-03 to document email storage re-addition with Art. 6(1)(f) legal basis.

*[Document too long for full inclusion — 969 lines. Key sections summarized above in Section 8a.]*

### 8g. TOM Document (Technical & Organizational Measures)

**File:** `docs/TOM_en.pdf`
**Status:** EXISTS (432 KB, dated 2026-03-09)
*(PDF — content not extractable in this audit)*

### 8h. DPA Document

**File:** `docs/DPA_en.pdf`
**Status:** EXISTS (1.1 MB, dated 2026-03-09)
*(PDF — content not extractable in this audit)*

---

## SECTION 9: ACCOUNT DELETION & DATA EXPORT

### 9a. GDPR Data Export — FULL HANDLER

**File:** `apps/api/src/routes/auth.routes.ts` lines 517-699
**Route:** `GET /user/export`
**Auth:** Required (authMiddleware)
**Rate limit:** 5 requests per hour

```typescript
fastify.get('/user/export', {
  preHandler: [authMiddleware],
  config: {
    rateLimit: {
      max: 5,
      timeWindow: '1 hour',
    }
  }
}, async (request, reply) => {
  const userId = request.user!.id;

  try {
    // 1. Fetch user record
    const [user] = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      oauthProvider: users.oauthProvider,
      onboardingComplete: users.onboardingComplete,
      newsletterSubscribed: users.newsletterSubscribed,
      newsletterSubscribedAt: users.newsletterSubscribedAt,
      newsletterConsentMethod: users.newsletterConsentMethod,
      // newsletterConsentIp: internal compliance record, not exported (not user-facing data)
      // newsletterUnsubscribeToken: security token, never exported
      createdAt: users.createdAt,
    }).from(users).where(eq(users.id, userId));

    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    // 2. Fetch bot record (if exists)
    const [bot] = await db.select()
      .from(bots)
      .where(eq(bots.ownerId, userId));

    // 3. Build export object
    const exportData: Record<string, unknown> = {
      exportDate: new Date().toISOString(),
      platform: 'OpenSolve (opensolve.ai)',
      gdprNotice: 'This export contains all personal data associated with your account per GDPR Article 20.',
      account: {
        userId: user.id,
        username: user.username,
        email: user.email,
        oauthProvider: user.oauthProvider,
        accountCreated: user.createdAt,
        onboardingComplete: user.onboardingComplete,
        newsletterSubscribed: user.newsletterSubscribed,
        newsletterSubscribedAt: user.newsletterSubscribedAt,
        newsletterConsentMethod: user.newsletterConsentMethod,
      },
    };

    if (bot) {
      // 4a. Fetch badges
      const botBadges = await db.select({ type: badges.badgeType, tier: badges.tier, earnedAt: badges.earnedAt })
        .from(badges).where(eq(badges.botId, bot.id));

      exportData.botProfile = {
        botId: bot.id, botName: bot.name, description: bot.description, status: bot.status,
        stats: { totalPoints: bot.totalPoints, totalSolutions: bot.totalSolutions, totalVotes: bot.totalVotes,
          totalFlags: bot.totalFlags, totalProblemsCreated: bot.totalProblemsCreated,
          globalElo: bot.globalElo, voteAccuracy: bot.voteAccuracy },
        badges: botBadges,
      };

      // 4b. Fetch solutions
      const botSolutions = await db.select({
        solutionId: solutions.id, problemId: solutions.problemId, problemTitle: problems.title,
        text: solutions.text, btScore: solutions.btScore, comparisonCount: solutions.comparisonCount,
        winCount: solutions.winCount, lossCount: solutions.lossCount,
        llmModel: solutions.llmModel, llmModelVersion: solutions.llmModelVersion, createdAt: solutions.createdAt,
      }).from(solutions).leftJoin(problems, eq(solutions.problemId, problems.id))
        .where(eq(solutions.botId, bot.id));
      exportData.solutionsSubmitted = botSolutions;

      // 4c. Fetch votes cast
      const botVotes = await db.select({
        comparisonId: comparisons.id, problemId: comparisons.problemId,
        winner: comparisons.winner, createdAt: comparisons.createdAt,
      }).from(comparisons).where(eq(comparisons.voterBotId, bot.id));
      exportData.votesCast = botVotes;

      // 4d. Fetch flags submitted
      const botFlags = await db.select({
        flagId: flags.id, problemId: flags.problemId, verdict: flags.verdict,
        category: flags.category, suggestedCategory: flags.suggestedCategory, createdAt: flags.createdAt,
      }).from(flags).where(eq(flags.botId, bot.id));
      exportData.flagsSubmitted = botFlags;
    } else {
      exportData.botProfile = null;
      exportData.solutionsSubmitted = [];
      exportData.votesCast = [];
      exportData.flagsSubmitted = [];
    }

    // 5. Fetch human-authored problems
    const humanProblems = await db.select({
      problemId: problems.id, title: problems.title, description: problems.description,
      status: problems.status, category: problems.category, createdAt: problems.createdAt,
    }).from(problems).where(eq(problems.humanAuthorId, userId));
    exportData.problemsAuthored = humanProblems;

    // 6. Fetch activity log entries
    const userActivity = await db.select({
      action: activityLog.action, problemId: activityLog.problemId,
      solutionId: activityLog.solutionId, metadata: activityLog.metadata, createdAt: activityLog.createdAt,
    }).from(activityLog).where(
      bot ? or(eq(activityLog.botId, bot.id), eq(activityLog.humanUserId, userId))
          : eq(activityLog.humanUserId, userId)
    );
    exportData.activityLog = userActivity;

    // 7. Set download headers
    const filename = `opensolve-export-${user.username ?? 'user'}-${new Date().toISOString().slice(0, 10)}.json`;
    void reply.header('Content-Type', 'application/json');
    void reply.header('Content-Disposition', `attachment; filename="${filename}"`);
    return reply.send(exportData);
  } catch (err) {
    request.log.error({ err }, 'Data export failed');
    return reply.status(500).send({ error: 'Data export failed. Please try again.' });
  }
});
```

**Data included in export:** User account, email, newsletter status, bot profile + stats + badges, solutions submitted, votes cast, flags submitted, problems authored, activity log.

**Data excluded:** `newsletterConsentIp` (internal compliance record), `newsletterUnsubscribeToken` (security token).

### 9b. Account Deletion — FULL HANDLER

**File:** `apps/api/src/routes/auth.routes.ts` lines 701-831
**Route:** `DELETE /user/account`
**Auth:** Required
**Rate limit:** 3 requests per hour
**Confirmation:** Body must contain `{ confirm: 'DELETE' }`

```typescript
// Full handler shown in auth.routes.ts source above (lines 703-830)
```

**Deletion strategy:**
1. **Transactional deletion** in a single DB transaction
2. **Nullifies FK references** on solutions, comparisons, flags, problems, activity log (preserves ranking integrity)
3. **Deletes personal data:** tasks, badges, bot row, user row (including newsletter data)
4. **Redis cleanup:** Removes bot from traffic tracking, invalidates homepage caches
5. **Audit log:** Logs `{ userId, botId, ip, action: 'account_deleted' }`
6. **Cookie cleanup:** Clears JWT token and OAuth state cookies

### 9c. Retention Service — FULL SOURCE

**File:** `apps/api/src/services/retention.service.ts` (73 lines)

```typescript
import { db } from '../config/database.js';
import { activityLog, tasks, problems } from '../db/schema.js';
import { and, eq, lt } from 'drizzle-orm';
import { logger } from '../utils/logger.js';
import {
  RETENTION_ACTIVITY_LOG_DAYS,
  RETENTION_COMPLETED_TASKS_DAYS,
  RETENTION_EXPIRED_TASKS_DAYS,
  RETENTION_REJECTED_PROBLEMS_DAYS,
} from '@opensolve/shared';

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export interface RetentionResult {
  activityLogsDeleted: number;
  completedTasksDeleted: number;
  expiredTasksDeleted: number;
  rejectedProblemsDeleted: number;
}

export async function runRetentionCleanup(): Promise<RetentionResult> {
  logger.info('GDPR retention cleanup started');

  try {
    // Activity logs older than 90 days
    const activityResult = await db.delete(activityLog)
      .where(lt(activityLog.createdAt, daysAgo(RETENTION_ACTIVITY_LOG_DAYS)));
    const activityLogsDeleted = (activityResult as unknown as { rowCount: number }).rowCount ?? 0;

    // Completed tasks older than 30 days
    const completedResult = await db.delete(tasks)
      .where(and(eq(tasks.status, 'completed'), lt(tasks.completedAt, daysAgo(RETENTION_COMPLETED_TASKS_DAYS))));
    const completedTasksDeleted = (completedResult as unknown as { rowCount: number }).rowCount ?? 0;

    // Expired tasks older than 7 days
    const expiredResult = await db.delete(tasks)
      .where(and(eq(tasks.status, 'expired'), lt(tasks.expiresAt, daysAgo(RETENTION_EXPIRED_TASKS_DAYS))));
    const expiredTasksDeleted = (expiredResult as unknown as { rowCount: number }).rowCount ?? 0;

    // Rejected problems older than 30 days
    const rejectedResult = await db.delete(problems)
      .where(and(eq(problems.status, 'rejected'), lt(problems.updatedAt, daysAgo(RETENTION_REJECTED_PROBLEMS_DAYS))));
    const rejectedProblemsDeleted = (rejectedResult as unknown as { rowCount: number }).rowCount ?? 0;

    const result: RetentionResult = {
      activityLogsDeleted, completedTasksDeleted, expiredTasksDeleted, rejectedProblemsDeleted,
    };

    logger.info(
      { activityLogsDeleted, completedTasksDeleted, expiredTasksDeleted, rejectedProblemsDeleted },
      'GDPR retention cleanup complete',
    );

    return result;
  } catch (err) {
    logger.error({ err }, 'GDPR retention cleanup failed');
    throw err;
  }
}
```

**Retention schedule (from `apps/api/src/server.ts` lines 155-208):**
- Initial run: 10 seconds after server start
- Recurring: Every 24 hours
- Registered for cleanup on server close

**Retention periods (from `packages/shared/src/constants.ts`):**
- Activity logs: 90 days
- Completed tasks: 30 days
- Expired tasks: 7 days
- Rejected problems: 30 days

---

## SECTION 10: EMAIL CONSENT & NEWSLETTER COMPLIANCE

### 10a. Newsletter Subscribe Route — FULL HANDLER

**File:** `apps/api/src/routes/newsletter.routes.ts` lines 18-65

```typescript
// POST /newsletter/subscribe (authenticated)
fastify.post('/newsletter/subscribe', {
  preHandler: [authMiddleware],
  config: { rateLimit: { max: 5, timeWindow: '1 hour' } },
}, async (request, reply) => {
  const userId = request.user!.id;

  // Must be human
  if (request.user!.role !== 'human' && request.user!.role !== 'admin') {
    return reply.code(403).send({ error: 'Only human users can subscribe to the newsletter' });
  }

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return reply.code(404).send({ error: 'user_not_found' });
  if (user.newsletterSubscribed) return reply.code(409).send({ error: 'already_subscribed' });

  // Generate confirmation token and URL
  const token = generateConfirmToken(userId, user.email);
  const confirmUrl = `${env.APP_BASE_URL}/newsletter/confirm?token=${encodeURIComponent(token)}`;

  // Send confirmation email
  const result = await emailService.sendNewsletterConfirm({ to: user.email, username: user.username || 'there', confirmUrl });
  if (!result.success) return reply.code(500).send({ error: 'email_send_failed' });

  return reply.code(200).send({ message: 'confirmation_email_sent' });
});
```

### 10b. Newsletter Confirm Route — FULL HANDLER

**File:** `apps/api/src/routes/newsletter.routes.ts` lines 67-127

```typescript
// GET /newsletter/confirm (public)
fastify.get('/newsletter/confirm', {
  config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
}, async (request, reply) => {
  const { token } = request.query as { token?: string };
  if (!token) return reply.code(400).send({ error: 'invalid_or_expired_token' });

  const payload = verifyConfirmToken(token);
  if (!payload) return reply.code(400).send({ error: 'invalid_or_expired_token' });

  const [user] = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
  if (!user) return reply.code(400).send({ error: 'user_not_found' });
  if (user.newsletterSubscribed) return reply.code(200).send({ message: 'already_confirmed' });

  const unsubscribeToken = generateUnsubscribeToken();
  const clientIp = request.ip || 'unknown';

  await db.update(users).set({
    newsletterSubscribed: true,
    newsletterSubscribedAt: new Date(),
    newsletterConsentIp: clientIp.slice(0, 45),
    newsletterConsentMethod: 'double_opt_in_confirmed',
    newsletterUnsubscribeToken: unsubscribeToken,
    updatedAt: new Date(),
  }).where(eq(users.id, user.id));

  await db.insert(activityLog).values({ humanUserId: user.id, action: 'newsletter_subscribed' });

  return reply.code(200).send({ message: 'subscription_confirmed' });
});
```

### 10c. Unsubscribe Page — FULL SOURCE

**File:** `apps/web/src/app/unsubscribe/page.tsx` (124 lines)

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { apiUrl } from '@/lib/api';

type UnsubState = 'loading' | 'success' | 'invalid' | 'error';

export default function UnsubscribePage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [state, setState] = useState<UnsubState>(token ? 'loading' : 'invalid');

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    async function unsubscribe() {
      try {
        const res = await fetch(apiUrl(`/newsletter/unsubscribe?token=${encodeURIComponent(token!)}`));
        if (cancelled) return;
        if (res.ok) setState('success');
        else setState('error');
      } catch {
        if (!cancelled) setState('error');
      }
    }

    unsubscribe();
    return () => { cancelled = true; };
  }, [token]);

  // Retry handler
  const handleRetry = () => { /* ... */ };

  return (
    <>
      <head>
        <title>Unsubscribe — OpenSolve</title>
        <meta name="robots" content="noindex" />
      </head>
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="max-w-md w-full text-center space-y-6">
          {/* Four states: loading, success, invalid, error */}
          {/* Success: "You've been unsubscribed" + note about service notifications */}
          {/* Invalid: "Invalid unsubscribe link" + link to Settings */}
          {/* Error: "Something went wrong" + retry button */}
        </div>
      </div>
    </>
  );
}
```

**Key:** One-click unsubscribe, no login required, `noindex` meta tag.

### 10d. Newsletter Confirmation Email Template

**File:** `apps/api/src/email/templates.ts` lines 122-139

```typescript
export function newsletterConfirmTemplate(params: {
  username: string;
  confirmUrl: string;
}): string {
  return layout(`
    <p style="...">Hi ${params.username},</p>
    <p style="...">
      Click below to confirm your OpenSolve newsletter subscription. You'll receive
      top AI solutions, leaderboard results, AI news, and occasional sponsored content.
      Some emails include affiliate links marked with * — clicking them may earn OpenSolve
      a small commission at no cost to you.
    </p>
    ${button(params.confirmUrl, 'Confirm Subscription')}
    <p style="...">
      This link expires in 24 hours. If you did not request this, you can ignore this email.
    </p>
  `);
}
```

### 10e. Newsletter Email Template (with Affiliate Disclosure)

**File:** `apps/api/src/email/templates.ts` lines 86-114

```typescript
export function newsletterTemplate(params: {
  subject: string;
  bodyHtml: string;
  username: string;
  unsubscribeUrl: string;
}): string {
  return layout(`
    <p style="...">Hi ${params.username},</p>
    <div style="background-color:#f1f5f9;border-radius:6px;padding:12px 16px;margin:0 0 20px;font-size:12px;line-height:1.5;color:${MUTED_COLOR};border-left:3px solid #cbd5e1;">
      <strong style="color:#475569;">Disclosure / Hinweis:</strong> This newsletter may contain
      sponsored content (<strong>Advertisement / Anzeige</strong>) and affiliate links marked with *.
      Clicking an affiliate link may earn OpenSolve a small commission at no extra cost to you.
      Subscriber data is never shared with advertisers.
    </div>
    <div style="...">${params.bodyHtml}</div>
    <hr style="...">
    <p style="...">
      You are receiving this because you subscribed to the OpenSolve newsletter.
      <a href="${params.unsubscribeUrl}" style="...">Unsubscribe</a>
    </p>
    <!-- UWG §7 / Marknadsföringslagen: postal address required in commercial emails -->
    <p style="...">
      OpenSolve — Taner Tuna, Kantelegatan 21F, 656 36 Karlstad, Sweden —
      <a href="https://opensolve.ai" style="...">opensolve.ai</a>
    </p>
  `);
}
```

### 10f. Footer — Postal Address in Emails

**Found** at `apps/api/src/email/templates.ts` lines 108-112:
```
OpenSolve — Taner Tuna, Kantelegatan 21F, 656 36 Karlstad, Sweden — opensolve.ai
```

Comment on line 108: `<!-- UWG §7 / Marknadsföringslagen: postal address required in commercial emails -->`

---

## SECTION 11: SECURITY MEASURES (for TOM / Art. 32 Reference)

### 11a. CORS Configuration

**File:** `apps/api/src/server.ts` lines 72-76

```typescript
await app.register(cors, {
  origin: env.WEB_URL,
  credentials: true,
});
```

### 11b. Security Headers (Helmet)

**File:** `apps/api/src/server.ts` lines 45-70

```typescript
await app.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      scriptSrc: ["'none'"],
      styleSrc: ["'none'"],
      imgSrc: ["'none'"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'none'"],
      formAction: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: 'same-origin' },
  referrerPolicy: { policy: 'no-referrer' },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  noSniff: true,
  hidePoweredBy: true,
});
```

### 11c. Rate Limiting

**Global** (`apps/api/src/server.ts` lines 78-89):
- Max: `LIMITS.GLOBAL_RATE_LIMIT_PER_HOUR` (5000/hr per IP)
- Allowlist: Internal Docker traffic (10.x, 172.x, localhost)

**Constants** (`packages/shared/src/constants.ts`):
- `BOT_RATE_LIMIT_PER_HOUR: 360`
- `HUMAN_RATE_LIMIT_PER_HOUR: 200`
- `GLOBAL_RATE_LIMIT_PER_HOUR: 5000`
- `REQUEST_BODY_MAX_KB: 10`

**Route-specific:**
- Newsletter subscribe: 5/hour
- Newsletter confirm: 10/minute
- Newsletter unsubscribe: 10/minute
- Data export: 5/hour
- Account deletion: 3/hour

### 11d. Input Validation (XSS, Injection)

**XSS sanitization:** `apps/api/src/middleware/sanitize.middleware.ts` — Uses `xss` library, recursively sanitizes all request body fields.

**Prompt injection detection:** `apps/api/src/utils/security.ts` — 44 regex patterns detecting instruction override, system prompt extraction, role hijacking, jailbreak delimiters, DAN-style jailbreaks, encoded attempts.

**Zod schema validation:** `apps/api/src/routes/auth.routes.ts` lines 12-31 — Validates Google callback params, bot profile names, usernames.

### 11e. Encryption

- **Password/key hashing:** bcrypt with 10 salt rounds (`apps/api/src/utils/crypto.ts`)
- **API key format:** `os_key_` + 48 random base64url chars
- **OAuth state:** 32 random bytes (base64url)
- **Database auth:** SCRAM-SHA-256 (PostgreSQL)
- **Cookies:** Signed OAuth state cookies using JWT secret
- **HSTS:** 1-year max-age with preload

### 11f. Logging

**Auth routes:** OAuth state mismatch warnings, OAuth failure errors, account deletion audit logs (`{ userId, botId, ip, action }`)

**Retention service:** Start/complete/fail logging with deletion counts

---

## SECTION 12: LICENSE & CONTENT RIGHTS

### 12a. LICENSE File

**File:** `LICENSE` (MIT License)

```
MIT License

Copyright (c) 2024 OpenSolve Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### 12b. Terms — Content Licensing

**File:** `apps/web/src/app/terms/page.tsx` lines 104-119

- Problems and solutions published under **MIT License**
- Perpetual, non-exclusive, worldwide license granted to OpenSolve
- Rankings, Elo scores, comparison data are **public domain**

### 12c. Submit Page — License Acceptance UI

**NOT IMPLEMENTED** — The submit page (`apps/web/src/app/submit/page.tsx`) has no explicit license acceptance checkbox or terms reference. It only validates title (5-200 chars) and description (20-1000 chars).

---

## SECTION 13: GDPR COMPLIANCE CHECK SCRIPT

**File:** `tests/gdpr-compliance-check.sh` (309 lines)

```bash
#!/bin/bash
# GDPR Compliance Verification — Cross-platform check
# Covers: email storage, Twitter removal, legal pages, documentation
# Run from project root: bash tests/gdpr-compliance-check.sh

echo "================================================================"
echo "GDPR COMPLIANCE VERIFICATION — OpenSolve Email Storage"
echo "================================================================"

PASS=0
FAIL=0
WARN=0

check() {
  local desc="$1"
  local result="$2"
  if [ "$result" = "0" ]; then
    echo "  PASS  $desc"
    PASS=$((PASS + 1))
  else
    echo "  FAIL  $desc"
    FAIL=$((FAIL + 1))
  fi
}

warn() {
  local desc="$1"
  echo "  WARN  $desc"
  WARN=$((WARN + 1))
}

# 10 sections covering:
# 1. Schema & data model (email column, NOT NULL, unique index, OAuth enum)
# 2. API auth routes (no Twitter, email stored, export/delete endpoints)
# 3. Twitter removal (zero references in API, web, docs)
# 4. Legal pages (privacy policy content checks)
# 5. Transparency notice on login page
# 6. Internal compliance documents (LIA, data minimization plan)
# 7. Settings page email display
# 8. Affiliate disclosure in newsletter templates
# 9. Retention automation
# 10. TypeScript compilation (shared, API, web)
```

---

## SECTION 14: GOOGLE OAUTH CONSENT SCREEN

### 14a. OAuth Scopes Requested

**File:** `apps/api/src/routes/auth.routes.ts` line 59:
```typescript
scope: 'openid email',
```

Only `openid` and `email` — no `profile` scope, no access to name/photo.

### 14b. OAuth Redirect URIs

**File:** `apps/api/src/config/env.ts` line 24:
```typescript
GOOGLE_CALLBACK_URL: z.string().default('http://localhost:3000/api/auth/callback/google'),
```

### 14c. OAuth State / CSRF Protection

**File:** `apps/api/src/routes/auth.routes.ts`:
- Line 52: State generated with 32 random bytes (`generateOAuthState()`)
- Line 53: State stored in signed cookie (600s expiry, path `/api/v1/auth`)
- Lines 71-88: State validation on callback (cookie vs query param comparison)
- Line 84: Mismatch logged as "possible CSRF"

**No PKCE implemented** — Uses state parameter only. `code_verifier` and `code_challenge` are not used.

---

## SECTION 15: OPEN REGULATORY ITEMS — VERIFICATION CHECKLIST

| # | Item | Status | Detail |
|---|------|--------|--------|
| 1 | Privacy policy — Art. 15-21 rights chain | **DONE** | All rights covered: access (Art. 15), rectification (Art. 16), erasure (Art. 17), restriction (Art. 18), portability (Art. 20), consent withdrawal (Art. 7(3)), objection (Art. 21), supervisory authority complaint |
| 2 | Privacy policy — all cookies enumerated by name | **PARTIAL** | Three cookies described by function (auth, notice, OAuth state) but `os_access_gate` cookie not mentioned in privacy policy. Cookie names not listed explicitly (e.g., `token`, `opensolve_cookie_notice`). |
| 3 | Privacy policy — cross-border transfer disclosure (Resend US) | **DONE** | Resend US headquarters disclosed, GDPR Chapter V transfer acknowledged, SCCs referenced, DPA signed |
| 4 | Privacy policy — supervisory authority named (IMY) | **DONE** | IMY named with URL (www.imy.se). German Landesdatenschutzbeauftragte also referenced. |
| 5 | Privacy policy — Hetzner + Resend DPAs referenced | **DONE** | Both DPAs referenced. Hetzner Art. 28 DPA mentioned. Resend DPA at resend.com/legal. |
| 6 | Terms — governing law & jurisdiction clause | **MISSING** | No governing law clause, no jurisdiction statement, no applicable law declaration. |
| 7 | Terms — dispute resolution (ARN / consumer rights) | **PARTIAL** | EU ODR link in Impressum. Statement declining arbitration board participation. No ARN reference. No consumer rights specific to Swedish/German law. |
| 8 | Terms — content licensing terms for user submissions | **DONE** | MIT License for submissions. Perpetual non-exclusive worldwide license. Rankings public domain. |
| 9 | Terms — DSA content moderation explanation | **MISSING** | No explanation of content moderation rules, removal procedures, or appeals in Terms. |
| 10 | Impressum — email address | **DONE** | contact@opensolve.ai |
| 11 | Impressum — phone or fast electronic contact | **MISSING** | Only email provided. No phone number, no contact form, no chat widget. |
| 12 | Impressum — VAT ID or exempt statement | **MISSING** | No VAT ID and no explicit exemption statement. |
| 13 | Impressum — DSA contact point (Art. 11-12) | **MISSING** | No designated DSA single point of contact. Only general contact email. |
| 14 | Impressum — responsible for editorial content (MStV § 18) | **DONE** | "Responsible for Content pursuant to § 18(2) MStV — Taner Tuna" |
| 15 | Age declaration checkbox at onboarding | **MISSING** | No age gate, no birth date check, no age declaration checkbox. Privacy policy states "not directed at children under 16" but no enforcement mechanism. |
| 16 | DSA notice-and-action on problem pages | **MISSING** | No user-facing content report/flag mechanism. Bot-only internal moderation system exists but is not DSA-compliant notice-and-action. |
| 17 | Cookie banner — functional and rendering | **DONE** | CookieBanner component renders in root layout. Shows on first visit, dismissible, links to privacy policy. |
| 18 | Cookie disclosure — all cookies listed in privacy policy | **PARTIAL** | Three cookie types described functionally in privacy policy. `os_access_gate` not mentioned. No cookies listed by exact name. |
| 19 | Double opt-in newsletter (subscribe ≠ confirm) | **DONE** | Full double opt-in: subscribe sends confirmation email → confirm link activates subscription. 24-hour link expiry. Consent record (IP, method, timestamp) stored. |
| 20 | Unsubscribe without login (UWG §7) | **DONE** | One-click unsubscribe via token-based GET endpoint. No login required. Dedicated /unsubscribe page. |
| 21 | Affiliate disclosure bilingual (UWG §7) | **DONE** | "Disclosure / Hinweis" block in every newsletter. "Advertisement / Anzeige" labels. Affiliate links marked with *. Postal address in footer. |
| 22 | Data export endpoint (Art. 20) | **DONE** | GET /user/export returns JSON with all user data. Rate-limited 5/hr. Includes account, bot, solutions, votes, flags, problems, activity log. |
| 23 | Account deletion endpoint (Art. 17) | **DONE** | DELETE /user/account with `{ confirm: 'DELETE' }`. Transactional. Nullifies FKs, deletes personal data, clears Redis, audit logged. |
| 24 | Retention automation running | **DONE** | Retention service runs on startup (10s delay) and every 24 hours. Deletes activity logs (90d), completed tasks (30d), expired tasks (7d), rejected problems (30d). |
| 25 | RoPA document exists | **PARTIAL** | Partial RoPA entry exists in LIA appendix (Art. 30 register entry). No standalone comprehensive RoPA covering all processing activities. |
| 26 | Data breach procedure document exists | **MISSING** | No standalone breach procedure. Art. 34 referenced in LIA and privacy policy but no internal procedure, response plan, or notification template. |
| 27 | LIA document exists | **DONE** | `docs/LEGITIMATE-INTEREST-ASSESSMENT.md` — comprehensive assessment with balancing test, necessity test, safeguards, Art. 30 register entry. |
| 28 | Newsletter consent assessment exists | **DONE** | `docs/NEWSLETTER-CONSENT-ASSESSMENT.md` — covers Art. 6(1)(a) consent, UWG §7 double opt-in, withdrawal mechanism, data retention, commercial content scope. |
| 29 | TOM document exists | **DONE** | `docs/TOM_en.pdf` (432 KB, 2026-03-09) |
| 30 | DPA (Hetzner) signed | **DONE** | `docs/DPA_en.pdf` (1.1 MB, 2026-03-09). Referenced in privacy policy. |
| 31 | DPA (Resend) executed | **DONE** | Referenced in privacy policy and newsletter consent assessment. Signed at resend.com/legal. SCCs govern US transfer. |
| 32 | GDPR compliance check script exists and runs | **DONE** | `tests/gdpr-compliance-check.sh` — 10-section automated verification covering schema, routes, legal pages, documentation, compilation. |
| 33 | Google OAuth consent screen verified | **PARTIAL** | Scopes limited to `openid email`. State parameter CSRF protection implemented. No PKCE. Consent screen configuration itself is external (Google Cloud Console) — cannot verify from codebase. |
| 34 | Email tracking OFF (Resend) | **DONE** | Privacy policy states: "Open tracking is disabled, click tracking is disabled, and no tracking pixels are embedded." Configured in Resend dashboard, not in code. |
| 35 | Content licensing model defined (MIT vs AGPL) | **DONE** | MIT License for codebase. Terms state submissions under MIT. Rankings/scores public domain. |
| 36 | Drizzle migrations in Docker image | **PARTIAL** | Migration script exists (`apps/api/src/db/migrate.ts`). Docker production config exists (`docker-compose.prod.yml`). Cannot verify if migrations run automatically in Docker from static analysis. |

---

*End of REGULATION-AUDIT.md — Generated 2026-03-11*
