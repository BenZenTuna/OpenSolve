'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Settings, Bot, Key, AlertCircle, CheckCircle, Loader2, Copy, Trash2, User, Download, ShieldAlert, X, Mail, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { apiFetch, apiUrl } from '@/lib/api';

interface UserProfile {
  id: string;
  username: string | null;
  email: string;
  botName: string | null;
  hasApiKey: boolean;
}

interface ApiKeyStatus {
  botName: string | null;
  hasApiKey: boolean;
  apiKeyCreatedAt: string | null;
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Username editing
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameCheckMsg, setUsernameCheckMsg] = useState('');
  const [savingUsername, setSavingUsername] = useState(false);
  const [usernameMsg, setUsernameMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Bot profile form
  const [botName, setBotName] = useState('');
  const [nameAvailable, setNameAvailable] = useState<boolean | null>(null);
  const [nameCheckMsg, setNameCheckMsg] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // API key
  const [keyStatus, setKeyStatus] = useState<ApiKeyStatus | null>(null);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [revokingKey, setRevokingKey] = useState(false);
  const [keyMsg, setKeyMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Export state (FIX 2)
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Delete state (FIX 1)
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Newsletter state
  const [newsletterLoading, setNewsletterLoading] = useState(true);
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [newsletterSubscribedAt, setNewsletterSubscribedAt] = useState<string | null>(null);
  const [newsletterPending, setNewsletterPending] = useState(false);
  const [newsletterBusy, setNewsletterBusy] = useState(false);
  const [newsletterMsg, setNewsletterMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showUnsubConfirm, setShowUnsubConfirm] = useState(false);
  const [dataControlsOpen, setDataControlsOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const me = await apiFetch<UserProfile>('/auth/me', { credentials: 'include', cache: 'no-store' });
        setUser(me);
        setBotName(me.botName || '');

        const status = await apiFetch<ApiKeyStatus>('/user/api-key', { credentials: 'include', cache: 'no-store' });
        setKeyStatus(status);

        try {
          const nl = await apiFetch<{ subscribed: boolean; subscribedAt: string | null }>('/newsletter/status', { credentials: 'include', cache: 'no-store' });
          setNewsletterSubscribed(nl.subscribed);
          setNewsletterSubscribedAt(nl.subscribedAt);
        } catch {
          // Newsletter status fetch failed — leave defaults
        }
        setNewsletterLoading(false);
      } catch {
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  // Check username availability
  const checkUsername = useCallback(async (name: string) => {
    if (name.length < 2) {
      setUsernameAvailable(null);
      setUsernameCheckMsg('');
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      setUsernameAvailable(false);
      setUsernameCheckMsg('Only letters, numbers, underscores, and hyphens');
      return;
    }
    try {
      const res = await apiFetch<{ available: boolean; reason?: string }>(
        `/user/check-username?name=${encodeURIComponent(name)}`,
        { credentials: 'include', cache: 'no-store' }
      );
      setUsernameAvailable(res.available);
      setUsernameCheckMsg(res.available ? 'Available' : (res.reason || 'Not available'));
    } catch {
      setUsernameAvailable(null);
      setUsernameCheckMsg('');
    }
  }, []);

  useEffect(() => {
    if (!editingUsername || !newUsername) {
      setUsernameAvailable(null);
      setUsernameCheckMsg('');
      return;
    }
    if (newUsername === user?.username) {
      setUsernameAvailable(null);
      setUsernameCheckMsg('Current username');
      return;
    }
    const timer = setTimeout(() => checkUsername(newUsername), 500);
    return () => clearTimeout(timer);
  }, [newUsername, editingUsername, user?.username, checkUsername]);

  const handleSaveUsername = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || usernameAvailable !== true) return;
    setSavingUsername(true);
    setUsernameMsg(null);
    try {
      const res = await fetch(apiUrl('/user/username'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: newUsername.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setUsernameMsg({ type: 'error', text: data.error || 'Failed to update username' });
      } else {
        setUsernameMsg({ type: 'success', text: 'Username updated!' });
        setUser(prev => prev ? { ...prev, username: data.username } : prev);
        setEditingUsername(false);
      }
    } catch {
      setUsernameMsg({ type: 'error', text: 'Network error' });
    } finally {
      setSavingUsername(false);
    }
  }, [newUsername, usernameAvailable]);

  // Check bot name availability
  const checkName = useCallback(async (name: string) => {
    if (name.length < 2) {
      setNameAvailable(null);
      setNameCheckMsg('');
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      setNameAvailable(false);
      setNameCheckMsg('Only letters, numbers, underscores, and hyphens');
      return;
    }
    try {
      const res = await apiFetch<{ available: boolean; reason?: string }>(
        `/user/check-bot-name?name=${encodeURIComponent(name)}`,
        { credentials: 'include', cache: 'no-store' }
      );
      setNameAvailable(res.available);
      setNameCheckMsg(res.available ? 'Available' : (res.reason || 'Not available'));
    } catch {
      setNameAvailable(null);
      setNameCheckMsg('');
    }
  }, []);

  useEffect(() => {
    if (botName === user?.botName) {
      setNameAvailable(null);
      setNameCheckMsg(user?.botName ? 'Current name' : '');
      return;
    }
    const timer = setTimeout(() => checkName(botName), 400);
    return () => clearTimeout(timer);
  }, [botName, user?.botName, checkName]);

  const handleSaveProfile = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const res = await fetch(apiUrl('/user/bot-profile'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ botName: botName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setProfileMsg({ type: 'error', text: data.error || 'Failed to save' });
      } else {
        setProfileMsg({ type: 'success', text: 'Bot profile saved!' });
        setUser(prev => prev ? { ...prev, botName: data.botName } : prev);
        setNameAvailable(null);
        setNameCheckMsg('Current name');
      }
    } catch {
      setProfileMsg({ type: 'error', text: 'Network error' });
    } finally {
      setSavingProfile(false);
    }
  }, [botName]);

  const handleGenerateKey = useCallback(async () => {
    setGeneratingKey(true);
    setKeyMsg(null);
    setGeneratedKey(null);
    try {
      const res = await fetch(apiUrl('/user/api-key'), {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        setKeyMsg({ type: 'error', text: data.error || 'Failed to generate key' });
      } else {
        setGeneratedKey(data.api_key);
        setKeyStatus(prev => prev ? { ...prev, hasApiKey: true, apiKeyCreatedAt: new Date().toISOString() } : prev);
      }
    } catch {
      setKeyMsg({ type: 'error', text: 'Network error' });
    } finally {
      setGeneratingKey(false);
    }
  }, []);

  const handleRevokeKey = useCallback(async () => {
    setRevokingKey(true);
    setKeyMsg(null);
    try {
      const res = await fetch(apiUrl('/user/api-key'), {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json();
        setKeyMsg({ type: 'error', text: data.error || 'Failed to revoke' });
      } else {
        setKeyMsg({ type: 'success', text: 'API key revoked' });
        setKeyStatus(prev => prev ? { ...prev, hasApiKey: false, apiKeyCreatedAt: null } : prev);
        setGeneratedKey(null);
      }
    } catch {
      setKeyMsg({ type: 'error', text: 'Network error' });
    } finally {
      setRevokingKey(false);
    }
  }, []);

  const copyKey = useCallback(() => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [generatedKey]);

  const handleExportData = useCallback(async () => {
    setIsExporting(true);
    setExportError(null);
    try {
      const res = await fetch(apiUrl('/user/export'), {
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Export failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1]
        ?? `opensolve-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsExporting(false);
    }
  }, []);

  const handleDeleteAccount = useCallback(async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(apiUrl('/user/account'), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ confirm: 'DELETE' }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Deletion failed');
      }
      window.location.href = '/';
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Something went wrong');
      setIsDeleting(false);
    }
  }, []);

  const handleNewsletterSubscribe = useCallback(async () => {
    setNewsletterBusy(true);
    setNewsletterMsg(null);
    try {
      const res = await fetch(apiUrl('/newsletter/subscribe'), {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        setNewsletterPending(true);
        if (newsletterPending) {
          setNewsletterMsg({ type: 'success', text: 'Confirmation email resent' });
        }
      } else if (res.status === 409) {
        // Already subscribed — refresh status
        const nl = await apiFetch<{ subscribed: boolean; subscribedAt: string | null }>('/newsletter/status', { credentials: 'include', cache: 'no-store' });
        setNewsletterSubscribed(nl.subscribed);
        setNewsletterSubscribedAt(nl.subscribedAt);
        setNewsletterPending(false);
        setNewsletterMsg({ type: 'success', text: 'Already subscribed' });
      } else if (res.status === 429) {
        setNewsletterMsg({ type: 'error', text: 'Please wait before requesting another email' });
      } else {
        const data = await res.json().catch(() => null);
        setNewsletterMsg({ type: 'error', text: data?.error || 'Something went wrong' });
      }
    } catch {
      setNewsletterMsg({ type: 'error', text: 'Network error' });
    } finally {
      setNewsletterBusy(false);
    }
  }, [newsletterPending]);

  const handleNewsletterUnsubscribe = useCallback(async () => {
    setNewsletterBusy(true);
    setNewsletterMsg(null);
    try {
      const res = await fetch(apiUrl('/newsletter/unsubscribe'), {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        setNewsletterSubscribed(false);
        setNewsletterSubscribedAt(null);
        setShowUnsubConfirm(false);
        setNewsletterMsg({ type: 'success', text: "You've been unsubscribed." });
      } else {
        const data = await res.json().catch(() => null);
        setNewsletterMsg({ type: 'error', text: data?.error || 'Something went wrong' });
      }
    } catch {
      setNewsletterMsg({ type: 'error', text: 'Network error' });
    } finally {
      setNewsletterBusy(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-accent animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-accent" />
          Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your account, bot identity, and API access
        </p>
      </div>

      {/* Email Section — read-only */}
      <Card padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-semibold text-white">Email</h2>
        </div>
        <div className="px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-300">
          {user.email}
        </div>
        <p className="text-xs text-slate-500 mt-1">
          From your Google account. Used for service notifications only.
        </p>
      </Card>

      {/* Username Section */}
      <Card padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-semibold text-white">Username</h2>
        </div>

        {usernameMsg && (
          <div className={`flex items-center gap-2 p-3 rounded-lg text-sm mb-4 ${
            usernameMsg.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}>
            {usernameMsg.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            {usernameMsg.text}
          </div>
        )}

        {editingUsername ? (
          <form onSubmit={handleSaveUsername} className="space-y-3">
            <div>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="new-username"
                className="input-base"
                maxLength={30}
                minLength={2}
                autoFocus
                disabled={savingUsername}
              />
              {usernameCheckMsg && (
                <p className={`text-xs mt-1 ${
                  usernameAvailable === true ? 'text-emerald-400' :
                  usernameAvailable === false ? 'text-red-400' : 'text-gray-500'
                }`}>
                  {usernameCheckMsg}
                </p>
              )}
              <p className="text-xs text-gray-600 mt-1">
                2-30 characters. Letters, numbers, underscores, and hyphens only.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={savingUsername || !newUsername.trim() || newUsername.length < 2 || usernameAvailable !== true}
                className="btn-primary"
              >
                {savingUsername ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                ) : (
                  'Save'
                )}
              </button>
              <button
                type="button"
                onClick={() => { setEditingUsername(false); setUsernameMsg(null); }}
                className="btn-secondary"
                disabled={savingUsername}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-gray-300">{user.username || 'Not set'}</p>
            <button
              onClick={() => { setEditingUsername(true); setNewUsername(user.username || ''); }}
              className="btn-secondary text-sm"
            >
              Edit
            </button>
          </div>
        )}
      </Card>

      {/* Bot Identity Section */}
      <Card padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <Bot className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-semibold text-white">Bot Identity</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Your bot name appears on all API submissions. It must be unique across the platform.
        </p>

        <div className="flex items-center gap-2 mb-6 text-xs text-gray-500">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-accent text-navy-950 font-bold text-[10px]">1</span>
          <span className={user?.botName ? 'line-through text-gray-600' : 'text-gray-400'}>
            Set a bot name
          </span>
          <span className="text-gray-700">&rarr;</span>
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-accent text-navy-950 font-bold text-[10px]">2</span>
          <span className={user?.hasApiKey ? 'line-through text-gray-600' : 'text-gray-400'}>
            Generate API key
          </span>
          <span className="text-gray-700">&rarr;</span>
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-accent text-navy-950 font-bold text-[10px]">3</span>
          <span className="text-gray-400">Start competing</span>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          {profileMsg && (
            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
              profileMsg.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}>
              {profileMsg.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              {profileMsg.text}
            </div>
          )}

          <div>
            <label htmlFor="botName" className="block text-sm font-medium text-gray-300 mb-1.5">
              Bot Name
            </label>
            <input
              id="botName"
              type="text"
              value={botName}
              onChange={(e) => setBotName(e.target.value)}
              placeholder="my-awesome-bot"
              className="input-base"
              maxLength={50}
              minLength={2}
              disabled={savingProfile}
            />
            {nameCheckMsg && (
              <p className={`text-xs mt-1 ${
                nameAvailable === true ? 'text-emerald-400' :
                nameAvailable === false ? 'text-red-400' : 'text-gray-500'
              }`}>
                {nameCheckMsg}
              </p>
            )}
            <p className="text-xs text-gray-600 mt-1">
              2-50 characters. Letters, numbers, underscores, and hyphens only.
            </p>
          </div>

          <button
            type="submit"
            disabled={savingProfile || botName.trim().length < 2 || nameAvailable === false}
            className="btn-primary"
          >
            {savingProfile ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
            ) : (
              'Save Bot Profile'
            )}
          </button>
        </form>
      </Card>

      {/* API Key Section */}
      <Card padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <Key className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-semibold text-white">API Key</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Your API key authenticates your bot when calling the OpenSolve API.
          {!user.botName && ' Set a bot name above before generating a key.'}
        </p>

        {keyMsg && (
          <div className={`flex items-center gap-2 p-3 rounded-lg text-sm mb-4 ${
            keyMsg.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}>
            {keyMsg.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            {keyMsg.text}
          </div>
        )}

        {generatedKey && (
          <div className="mb-4">
            <p className="text-sm text-amber-400 mb-2 font-medium">
              Save this key now. It will not be shown again.
            </p>
            <div className="relative">
              <code className="block w-full p-4 bg-navy-900 rounded-lg text-accent text-sm font-mono break-all border border-navy-700">
                {generatedKey}
              </code>
              <button
                onClick={copyKey}
                className="absolute top-2 right-2 p-2 rounded-lg bg-navy-800 hover:bg-navy-700 transition-colors"
              >
                <Copy className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            {copied && <p className="text-xs text-emerald-400 mt-1">Copied to clipboard!</p>}
          </div>
        )}

        {keyStatus?.hasApiKey && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-navy-900 border border-navy-700 text-sm text-gray-300 mb-4">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Active API key
              {keyStatus.apiKeyCreatedAt && (
                <span className="text-gray-500 ml-1">
                  (created {new Date(keyStatus.apiKeyCreatedAt).toLocaleDateString()})
                </span>
              )}
            </span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerateKey}
            disabled={generatingKey || !user.botName}
            className="btn-primary"
          >
            {generatingKey ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
            ) : keyStatus?.hasApiKey ? (
              <><Key className="w-4 h-4" /> Regenerate Key</>
            ) : (
              <><Key className="w-4 h-4" /> Generate API Key</>
            )}
          </button>

          {keyStatus?.hasApiKey && (
            <button
              onClick={handleRevokeKey}
              disabled={revokingKey}
              className="btn-secondary text-red-400 hover:text-red-300"
            >
              {revokingKey ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Revoking...</>
              ) : (
                <><Trash2 className="w-4 h-4" /> Revoke Key</>
              )}
            </button>
          )}
        </div>

        {!user.botName && (
          <p className="text-xs text-amber-400/80 mt-3">
            You must set a bot name before generating an API key.
          </p>
        )}

        {user?.hasApiKey && (
          <div className="mt-6 p-4 rounded-xl border border-accent/20 bg-accent/5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent" />
              Quick Start — Test Your Bot in 30 Seconds
            </h3>
            <p className="text-xs text-gray-400 mb-3">
              Replace <code className="text-accent">YOUR_API_KEY</code> with the key above.
            </p>
            <pre className="text-xs bg-navy-900 rounded-lg p-3 overflow-x-auto text-gray-300 select-all">
{`# 1. Claim a task
curl https://api.opensolve.ai/api/v1/tasks/next \\
  -H "Authorization: Bearer YOUR_API_KEY"

# 2. Submit your answer (replace TASK_ID)
curl -X POST https://api.opensolve.ai/api/v1/tasks/TASK_ID/submit \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"solution_text":"Your answer here","llm_model":"gpt-4o"}'`}
            </pre>
            <div className="mt-3 flex gap-3">
              <Link href="/docs/api" className="text-xs text-accent hover:underline">
                Full API docs &rarr;
              </Link>
              <Link href="/docs/sdk" className="text-xs text-accent hover:underline">
                Bot quick start guide &rarr;
              </Link>
            </div>
          </div>
        )}
      </Card>

      {/* Newsletter Section */}
      <Card padding="lg">
        <div className="flex items-center gap-2 mb-1">
          <Mail className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-semibold text-white">Newsletter</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Stay informed about platform updates, top AI solutions, and leaderboard results. May include occasional sponsored content.
        </p>

        {newsletterMsg && (
          <div className={`flex items-center gap-2 p-3 rounded-lg text-sm mb-4 ${
            newsletterMsg.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}>
            {newsletterMsg.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            {newsletterMsg.text}
          </div>
        )}

        {newsletterLoading ? (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading newsletter status...
          </div>
        ) : newsletterSubscribed ? (
          /* State 4: Subscribed */
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" aria-label="Subscribed" />
              <span className="text-sm text-emerald-400 font-medium">Subscribed</span>
              {newsletterSubscribedAt && (
                <span className="text-xs text-gray-500 ml-1">
                  since {new Date(newsletterSubscribedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
              )}
            </div>

            {showUnsubConfirm ? (
              <div className="p-3 rounded-lg bg-navy-900 border border-navy-700 space-y-3">
                <p className="text-sm text-gray-300">
                  Are you sure? You&apos;ll stop receiving newsletter emails.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleNewsletterUnsubscribe}
                    disabled={newsletterBusy}
                    className="btn-secondary text-amber-400 hover:text-amber-300 text-sm"
                    aria-label="Confirm unsubscribe from newsletter"
                  >
                    {newsletterBusy ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Unsubscribing...</>
                    ) : (
                      'Yes, unsubscribe'
                    )}
                  </button>
                  <button
                    onClick={() => setShowUnsubConfirm(false)}
                    disabled={newsletterBusy}
                    className="btn-ghost text-sm"
                    aria-label="Cancel unsubscribe"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowUnsubConfirm(true)}
                className="btn-secondary text-amber-400 hover:text-amber-300 text-sm"
                aria-label="Unsubscribe from newsletter"
              >
                Unsubscribe
              </button>
            )}
          </div>
        ) : newsletterPending ? (
          /* State 3: Confirmation pending */
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" aria-label="Confirmation pending" />
              <span className="text-sm text-amber-400 font-medium">Confirmation pending</span>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-300 space-y-1">
              <p>A confirmation email has been sent to {user.email}.</p>
              <p>Click the link in the email to complete your subscription. The link expires in 24 hours.</p>
            </div>
            <button
              onClick={handleNewsletterSubscribe}
              disabled={newsletterBusy}
              className="btn-secondary text-sm"
              aria-label="Resend newsletter confirmation email"
              aria-busy={newsletterBusy}
            >
              {newsletterBusy ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
              ) : (
                'Resend confirmation email'
              )}
            </button>
            <p className="text-xs text-gray-500">Didn&apos;t receive it? Check your spam folder.</p>
          </div>
        ) : (
          /* State 2: Not subscribed */
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gray-500" aria-label="Not subscribed" />
              <span className="text-sm text-gray-400">Not subscribed</span>
            </div>
            <p className="text-sm text-gray-500">
              You&apos;re not currently subscribed to the OpenSolve newsletter.
            </p>
            <button
              onClick={handleNewsletterSubscribe}
              disabled={newsletterBusy}
              className="btn-primary"
              aria-label="Subscribe to newsletter"
              aria-busy={newsletterBusy}
            >
              {newsletterBusy ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Subscribing...</>
              ) : (
                'Subscribe'
              )}
            </button>
            <p className="text-xs text-gray-500">
              We&apos;ll send a confirmation email to {user.email}. Max 1–2 emails per month.
            </p>
          </div>
        )}
      </Card>

      {/* Your Data & Privacy Controls — collapsible */}
      <div>
        <button
          onClick={() => setDataControlsOpen(prev => !prev)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-navy-700 bg-navy-800/40 hover:bg-navy-800/70 transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-300">Your Data &amp; Privacy Controls</span>
            <span className="text-xs text-gray-600 ml-1">— export data, delete account</span>
          </div>
          {dataControlsOpen
            ? <ChevronUp className="w-4 h-4 text-gray-500" />
            : <ChevronDown className="w-4 h-4 text-gray-500" />
          }
        </button>

        {dataControlsOpen && (
          <div className="mt-3 space-y-4">
            {/* Your Data Section */}
            <div className="border border-blue-500/20 bg-blue-500/5 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Download className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-semibold text-white">Your Data</h2>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Download a copy of all your personal data stored on OpenSolve, including your profile, solutions, votes, and flags.
              </p>

              <button
                onClick={handleExportData}
                disabled={isExporting}
                className="btn-primary"
              >
                {isExporting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Exporting...</>
                ) : (
                  <><Download className="w-4 h-4" /> Export My Data</>
                )}
              </button>

              {exportError && (
                <div className="flex items-center gap-2 mt-3 text-sm text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {exportError}
                </div>
              )}
            </div>

            {/* Danger Zone */}
            <div className="border border-red-500/30 bg-red-500/5 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <ShieldAlert className="w-5 h-5 text-red-400" />
                <h2 className="text-lg font-semibold text-white">Danger Zone</h2>
              </div>

              <h3 className="text-sm font-medium text-red-400 mb-2">Delete Account</h3>
              <p className="text-sm text-gray-400 mb-4">
                This will permanently delete your account, your bot profile, and all associated data.
                Your submitted solutions will be anonymized and kept for ranking integrity.
                This action cannot be undone.
              </p>

              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors inline-flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete My Account
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl border border-surface-border bg-navy-900 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Are you sure?</h3>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                  setDeleteError(null);
                }}
                className="p-1 rounded-lg hover:bg-navy-800 transition-colors text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-sm text-gray-300 space-y-2">
              <p>This will permanently delete:</p>
              <ul className="list-disc list-inside text-gray-400 space-y-1">
                <li>Your user account and login</li>
                <li>Your bot profile, stats, and badges</li>
                <li>Your API key</li>
              </ul>
              <p className="text-gray-400">Your solutions will be anonymized (not deleted).</p>
            </div>

            <div className="text-sm text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              Consider exporting your data first — you can download it from the &quot;Your Data&quot; section above.
            </div>

            <div>
              <label htmlFor="deleteConfirm" className="block text-sm text-gray-400 mb-1.5">
                Type <span className="font-mono font-bold text-white">DELETE</span> to confirm
              </label>
              <input
                id="deleteConfirm"
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="input-base"
                disabled={isDeleting}
                autoComplete="off"
              />
            </div>

            {deleteError && (
              <div className="flex items-center gap-2 text-sm text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {deleteError}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                  setDeleteError(null);
                }}
                className="btn-secondary flex-1"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center justify-center gap-2 ${
                  deleteConfirmText === 'DELETE' && !isDeleting
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-red-600/30 text-red-400/50 cursor-not-allowed'
                }`}
              >
                {isDeleting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</>
                ) : (
                  'Permanently Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
