'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';

type FormState = 'idle' | 'sending' | 'sent' | 'error';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('general');
  const [message, setMessage] = useState('');
  const [state, setState] = useState<FormState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const canSubmit = email.trim() && message.trim().length >= 10 && state === 'idle';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setState('sending');
    setErrorMsg('');

    try {
      const res = await fetch(
        (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1') + '/contact',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), email: email.trim(), subject, message: message.trim() }),
        }
      );

      if (res.ok) {
        setState('sent');
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error || 'Something went wrong. Please try again.');
        setState('error');
      }
    } catch {
      setErrorMsg('Network error. Please try emailing contact@opensolve.ai directly.');
      setState('error');
    }
  }

  if (state === 'sent') {
    return (
      <div className="max-w-lg mx-auto mt-12 text-center space-y-4">
        <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
        <h1 className="text-xl font-display font-bold text-white">Message Sent</h1>
        <p className="text-sm text-gray-400">
          We&apos;ll get back to you at {email}. You can also reach us directly at{' '}
          <a href="mailto:contact@opensolve.ai" className="text-accent hover:underline">
            contact@opensolve.ai
          </a>.
        </p>
        <Link href="/" className="text-sm text-accent hover:underline">
          Back to OpenSolve
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
          <Mail className="w-6 h-6 text-accent" />
          Contact Us
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          You can also email us directly at{' '}
          <a href="mailto:contact@opensolve.ai" className="text-accent hover:underline">
            contact@opensolve.ai
          </a>
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="contact-name" className="block text-sm font-medium text-gray-300 mb-1">
              Name <span className="text-gray-600">(optional)</span>
            </label>
            <input
              id="contact-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              className="w-full px-3 py-2 rounded-lg bg-navy-700 border border-gray-700 text-white text-sm focus:outline-none focus:border-accent"
              placeholder="Your name"
            />
          </div>

          <div>
            <label htmlFor="contact-email" className="block text-sm font-medium text-gray-300 mb-1">
              Email <span className="text-red-400">*</span>
            </label>
            <input
              id="contact-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={200}
              className="w-full px-3 py-2 rounded-lg bg-navy-700 border border-gray-700 text-white text-sm focus:outline-none focus:border-accent"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label htmlFor="contact-subject" className="block text-sm font-medium text-gray-300 mb-1">
              Subject <span className="text-red-400">*</span>
            </label>
            <select
              id="contact-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-navy-700 border border-gray-700 text-white text-sm focus:outline-none focus:border-accent"
            >
              <option value="general">General Inquiry</option>
              <option value="report_content">Report Content</option>
              <option value="privacy">Privacy / Data Request</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="contact-message" className="block text-sm font-medium text-gray-300 mb-1">
              Message <span className="text-red-400">*</span>
            </label>
            <textarea
              id="contact-message"
              required
              minLength={10}
              maxLength={5000}
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-navy-700 border border-gray-700 text-white text-sm focus:outline-none focus:border-accent resize-y"
              placeholder="How can we help?"
            />
            <p className="text-xs text-gray-600 mt-1">{message.length}/5000</p>
          </div>

          {state === 'error' && (
            <div className="flex items-start gap-2 text-sm text-red-400">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-accent hover:bg-accent/90 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {state === 'sending' ? (
              <>Sending...</>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Message
              </>
            )}
          </button>
        </form>
      </Card>
    </div>
  );
}
