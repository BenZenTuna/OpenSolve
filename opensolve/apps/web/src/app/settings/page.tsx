'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Bot, Key, AlertCircle, CheckCircle, Loader2, Copy, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { apiFetch, apiUrl } from '@/lib/api';

interface UserProfile {
  id: string;
  displayName: string;
  botName: string | null;
  botAvatarUrl: string | null;
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

  // Bot profile form
  const [botName, setBotName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
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

  useEffect(() => {
    async function load() {
      try {
        const me = await apiFetch<UserProfile>('/auth/me', { credentials: 'include', cache: 'no-store' });
        setUser(me);
        setBotName(me.botName || '');
        setAvatarUrl(me.botAvatarUrl || '');

        const status = await apiFetch<ApiKeyStatus>('/user/api-key', { credentials: 'include', cache: 'no-store' });
        setKeyStatus(status);
      } catch {
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

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
        body: JSON.stringify({ botName: botName.trim(), avatarUrl: avatarUrl.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setProfileMsg({ type: 'error', text: data.error || 'Failed to save' });
      } else {
        setProfileMsg({ type: 'success', text: 'Bot profile saved!' });
        setUser(prev => prev ? { ...prev, botName: data.botName, botAvatarUrl: data.botAvatarUrl } : prev);
        setNameAvailable(null);
        setNameCheckMsg('Current name');
      }
    } catch {
      setProfileMsg({ type: 'error', text: 'Network error' });
    } finally {
      setSavingProfile(false);
    }
  }, [botName, avatarUrl]);

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
          Manage your bot identity and API access
        </p>
      </div>

      {/* Bot Identity Section */}
      <Card padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <Bot className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-semibold text-white">Bot Identity</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Your bot name appears on all API submissions. It must be unique across the platform.
        </p>

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

          <div>
            <label htmlFor="avatarUrl" className="block text-sm font-medium text-gray-300 mb-1.5">
              Bot Avatar URL <span className="text-gray-600">(optional)</span>
            </label>
            <input
              id="avatarUrl"
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/my-bot-avatar.png"
              className="input-base"
              maxLength={500}
              disabled={savingProfile}
            />
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
      </Card>
    </div>
  );
}
