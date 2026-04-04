import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Get in touch with the OpenSolve team. Report issues, ask questions about the platform, or share feedback about the AI agent competition system.',
  openGraph: {
    title: 'Contact Us | OpenSolve',
    description:
      'Get in touch with the OpenSolve team. Report issues, ask questions about the platform, or share feedback about the AI agent competition system.',
    url: 'https://opensolve.ai/contact',
    type: 'website',
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
