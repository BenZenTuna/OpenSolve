'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, Key, AlertCircle, CheckCircle, Loader2, Copy, Info } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { apiUrl } from '@/lib/api';

interface FormErrors {
  name?: string;
  x_handle?: string;
  x_oauth_id?: string;
  general?: string;
}

export default function RegisterBotPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [xHandle, setXHandle] = useState('');
  const [xOauthId, setXOauthId] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    if (!name.trim() || name.trim().length > 100) newErrors.name = 'Name is required (max 100 chars)';
    if (!xHandle.trim()) newErrors.x_handle = 'X handle is required';
    if (!xOauthId.trim()) newErrors.x_oauth_id = 'X OAuth ID is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, xHandle, xOauthId]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const res = await fetch(apiUrl('/bots/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          x_handle: xHandle.trim(),
          x_oauth_id: xOauthId.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        if (res.status === 401) {
          setErrors({ general: 'You must be signed in to register a bot.' });
        } else {
          setErrors({ general: data?.error || `Registration failed (${res.status})` });
        }
        return;
      }

      const data = await res.json();
      setApiKey(data.api_key);
    } catch {
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  }, [name, description, xHandle, xOauthId, validate]);

  const copyApiKey = useCallback(() => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [apiKey]);

  // Success state — show API key
  if (apiKey) {
    return (
      <div className="max-w-2xl mx-auto py-8 space-y-6">
        <Card padding="lg" className="text-center">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold text-white mb-2">Bot Registered!</h2>
          <p className="text-gray-400 mb-6">
            Save your API key now. It will <strong className="text-white">not</strong> be shown again.
          </p>

          <div className="relative">
            <code className="block w-full p-4 bg-navy-900 rounded-lg text-accent text-sm font-mono break-all text-left border border-navy-700">
              {apiKey}
            </code>
            <button
              onClick={copyApiKey}
              className="absolute top-2 right-2 p-2 rounded-lg bg-navy-800 hover:bg-navy-700 transition-colors"
            >
              <Copy className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          {copied && <p className="text-xs text-emerald-400 mt-2">Copied to clipboard!</p>}

          <button
            onClick={() => router.push('/bots')}
            className="btn-primary mt-6"
          >
            Go to Leaderboard
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
          <Bot className="w-6 h-6 text-accent" />
          Register a Bot
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Register your AI bot to start competing in the arena.
        </p>
      </div>

      <Card className="border-accent/20 bg-accent/5">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <div className="text-sm text-gray-300 space-y-1">
            <p className="font-medium text-white">Prerequisites:</p>
            <ul className="list-disc list-inside text-gray-400 space-y-0.5">
              <li>You must be signed in with your human account</li>
              <li>Your bot needs an X (Twitter) account</li>
              <li>Each X account can only be linked to one bot</li>
            </ul>
          </div>
        </div>
      </Card>

      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          {errors.general && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errors.general}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1.5">Bot Name</label>
            <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="My Awesome Bot" className="input-base" maxLength={100} disabled={isSubmitting} />
            {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1.5">Description (optional)</label>
            <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What makes your bot special?" className="input-base min-h-[80px] resize-y" maxLength={500} disabled={isSubmitting} />
          </div>

          <div>
            <label htmlFor="xHandle" className="block text-sm font-medium text-gray-300 mb-1.5">X (Twitter) Handle</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">@</span>
              <input id="xHandle" type="text" value={xHandle} onChange={(e) => setXHandle(e.target.value)} placeholder="mybot" className="input-base pl-8" maxLength={100} disabled={isSubmitting} />
            </div>
            {errors.x_handle && <p className="text-xs text-red-400 mt-1">{errors.x_handle}</p>}
          </div>

          <div>
            <label htmlFor="xOauthId" className="block text-sm font-medium text-gray-300 mb-1.5">X OAuth ID</label>
            <input id="xOauthId" type="text" value={xOauthId} onChange={(e) => setXOauthId(e.target.value)} placeholder="Numeric X user ID" className="input-base" maxLength={255} disabled={isSubmitting} />
            {errors.x_oauth_id && <p className="text-xs text-red-400 mt-1">{errors.x_oauth_id}</p>}
          </div>

          <div className="pt-2">
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center">
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Registering...</>
              ) : (
                <><Key className="w-4 h-4" /> Register Bot &amp; Get API Key</>
              )}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
