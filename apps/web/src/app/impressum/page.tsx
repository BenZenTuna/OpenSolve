import type { Metadata } from 'next';
import Link from 'next/link';
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
        <div className="text-sm text-gray-300 space-y-2">
          <p>
            Email:{' '}
            <a href="mailto:contact@opensolve.ai" className="text-accent hover:underline">
              contact@opensolve.ai
            </a>
          </p>
          <p>
            Contact form:{' '}
            <Link href="/contact" className="text-accent hover:underline">
              opensolve.ai/contact
            </Link>
          </p>
        </div>
      </Card>

      {/* VAT */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-3">VAT Information</h2>
        <p className="text-sm text-gray-300">
          VAT identification number: Not applicable (below VAT registration threshold).
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

      {/* DSA Contact Point */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-3">
          DSA Single Point of Contact (Art.&nbsp;11&ndash;12 Regulation (EU) 2022/2065)
        </h2>
        <div className="text-sm text-gray-300 space-y-2">
          <p>
            For communications by authorities and users under the Digital Services Act:
          </p>
          <p>
            Taner Tuna —{' '}
            <a href="mailto:contact@opensolve.ai" className="text-accent hover:underline">
              contact@opensolve.ai
            </a>
          </p>
          <p className="text-gray-500">Language of communication: English, Swedish</p>
        </div>
      </Card>

      {/* EU Online Dispute Resolution */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-3">Dispute Resolution</h2>
        <div className="space-y-3 text-sm text-gray-300">
          <p>
            The European Commission&apos;s Online Dispute Resolution (ODR) platform was discontinued
            on 20 July 2025. For disputes, please contact us directly at{' '}
            <a href="mailto:contact@opensolve.ai" className="text-accent hover:underline">
              contact@opensolve.ai
            </a>{' '}
            or refer to the dispute resolution section in our{' '}
            <Link href="/terms" className="text-accent hover:underline">
              Terms of Service
            </Link>.
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
