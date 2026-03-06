'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Users,
  Mail,
  Send,
  Clock,
  AlertCircle,
  RefreshCw,
  Search,
  X,
  CheckCircle,
  Info,
  Loader2,
  Percent,
} from 'lucide-react';
import { adminFetch } from '@/lib/admin-api';

// Types
interface EmailStats {
  totalSubscribers: number;
  totalUsers: number;
  subscriberPercent: number;
  recentSends: number;
}

interface HistoryEntry {
  id: string;
  action: string;
  details: {
    subject: string;
    recipientType?: string;
    recipientCount: number;
    succeeded: number;
    failed: number;
    sentBy: string;
  };
  createdAt: string;
}

interface UserResult {
  id: string;
  username: string | null;
  email: string;
}

interface Subscriber {
  id: string;
  username: string | null;
  email: string;
  subscribedAt: string | null;
  consentMethod: string | null;
}

// Stat card matching admin dashboard
function StatCard({
  label,
  value,
  icon: Icon,
  color,
  suffix,
}: {
  label: string;
  value: number | string | null;
  icon: React.ElementType;
  color: string;
  suffix?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          {value !== null ? (
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {typeof value === 'number' ? value.toLocaleString() : value}
              {suffix && <span className="text-sm font-normal text-gray-500 ml-1">{suffix}</span>}
            </p>
          ) : (
            <div className="h-8 w-20 bg-gray-100 rounded animate-pulse mt-1" />
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

// Tab button
function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
      }`}
    >
      {children}
    </button>
  );
}

// Two-step confirmation dialog (inline, matching admin patterns)
function SendConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  expiresAt,
  loading,
  error,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel: string;
  expiresAt: number;
  loading: boolean;
  error: string | null;
}) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!open) return;
    const update = () => {
      const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [open, expiresAt]);

  if (!open) return null;

  const expired = timeLeft <= 0;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div
        className="w-full max-w-md bg-white rounded-xl shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 p-6 pb-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 pb-4">
          <p className="text-sm text-gray-600 whitespace-pre-line">{message}</p>

          <div className="mt-3 flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-gray-400" />
            {expired ? (
              <span className="text-red-600 font-medium">Token expired — please try again</span>
            ) : (
              <span className="text-gray-500">
                Expires in {minutes}:{seconds.toString().padStart(2, '0')}
              </span>
            )}
          </div>

          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 p-6 pt-2 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading || expired}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== Important Messages Tab =====
function ImportantMessagesTab({ stats }: { stats: EmailStats | null }) {
  const [recipientType, setRecipientType] = useState<'single' | 'all'>('single');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    token: string;
    expiresAt: number;
  }>({ open: false, token: '', expiresAt: 0 });
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Debounced user search
  useEffect(() => {
    if (recipientType !== 'single' || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      try {
        const data = await adminFetch<{ users: UserResult[] }>(
          `/admin/email/user-search?q=${encodeURIComponent(searchQuery)}`
        );
        setSearchResults(data.users);
      } catch {
        setSearchResults([]);
      }
    }, 300);

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [searchQuery, recipientType]);

  const recipientCount = recipientType === 'all' ? (stats?.totalUsers ?? 0) : (selectedUser ? 1 : 0);
  const canSend = subject.length >= 5 && bodyHtml.length >= 20 && recipientCount > 0;

  const handleSend = async () => {
    setError(null);
    setResult(null);
    try {
      // Step 1: Get confirmation token
      const tokenData = await adminFetch<{ confirmationToken: string; expiresIn: number }>(
        '/admin/email/confirmation-token',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'send-important',
            recipientType,
            recipientCount,
          }),
        }
      );

      setConfirmDialog({
        open: true,
        token: tokenData.confirmationToken,
        expiresAt: Date.now() + tokenData.expiresIn * 1000,
      });
      setConfirmError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate send');
    }
  };

  const handleConfirmSend = async () => {
    setSending(true);
    setConfirmError(null);
    try {
      const data = await adminFetch<{ sent: number; failed: number; recipientType: string }>(
        '/admin/email/send-important',
        {
          method: 'POST',
          body: JSON.stringify({
            recipientType,
            recipientUserId: recipientType === 'single' ? selectedUser?.id : undefined,
            subject,
            bodyHtml,
            confirmationToken: confirmDialog.token,
          }),
        }
      );

      setResult({ sent: data.sent, failed: data.failed });
      setConfirmDialog({ open: false, token: '', expiresAt: 0 });
      setSubject('');
      setBodyHtml('');
      setSelectedUser(null);
      setSearchQuery('');
    } catch (err) {
      setConfirmError(err instanceof Error ? err.message : 'Send failed');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Recipient selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Recipients</h3>

        <div className="flex gap-4 mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="recipientType"
              checked={recipientType === 'single'}
              onChange={() => setRecipientType('single')}
              className="text-blue-600"
            />
            <span className="text-sm text-gray-700">Single user</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="recipientType"
              checked={recipientType === 'all'}
              onChange={() => setRecipientType('all')}
              className="text-blue-600"
            />
            <span className="text-sm text-gray-700">
              All users {stats && `(${stats.totalUsers.toLocaleString()})`}
            </span>
          </label>
        </div>

        {recipientType === 'single' && (
          <div className="relative">
            {selectedUser ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-sm text-blue-800">
                  {selectedUser.username || selectedUser.email}
                </span>
                <span className="text-xs text-blue-600">{selectedUser.email}</span>
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setSearchQuery('');
                  }}
                  className="ml-auto p-0.5 rounded text-blue-400 hover:text-blue-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by username or email"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                {searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {searchResults.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => {
                          setSelectedUser(user);
                          setSearchQuery('');
                          setSearchResults([]);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between"
                      >
                        <span className="text-gray-900">{user.username || 'unnamed'}</span>
                        <span className="text-gray-500 text-xs">{user.email}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Compose area */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Compose</h3>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-700">Subject</label>
              <span className="text-xs text-gray-400">{subject.length}/200</span>
            </div>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value.slice(0, 200))}
              placeholder="Subject line"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-700">Body (HTML)</label>
              <span className="text-xs text-gray-400">{bodyHtml.length}/50000</span>
            </div>
            <textarea
              value={bodyHtml}
              onChange={(e) => setBodyHtml(e.target.value.slice(0, 50000))}
              placeholder="Email body — supports HTML"
              rows={8}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
            />
          </div>

          {/* Preview */}
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {showPreview ? 'Hide preview' : 'Show preview'}
          </button>

          {showPreview && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <p className="text-xs text-gray-500 mb-2">Preview</p>
              <div className="bg-white rounded p-4 border border-gray-100">
                <h4 className="font-semibold text-gray-900 mb-2">{subject || '(no subject)'}</h4>
                <div
                  className="text-sm text-gray-700 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: bodyHtml || '<em>(empty body)</em>' }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-800">
              Sent to {result.sent} recipient{result.sent !== 1 ? 's' : ''}
              {result.failed > 0 && ` (${result.failed} failed)`}
            </p>
            {result.failed > 0 && (
              <p className="text-xs text-green-700 mt-1">
                Some deliveries failed. Check Resend dashboard for details.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Send button */}
      <button
        onClick={handleSend}
        disabled={!canSend || sending}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Send className="w-4 h-4" />
        Send Message
      </button>

      {/* Confirmation dialog */}
      <SendConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, token: '', expiresAt: 0 })}
        onConfirm={handleConfirmSend}
        title="Confirm Send"
        message={`You are about to send an email to ${
          recipientType === 'all'
            ? `${stats?.totalUsers?.toLocaleString() ?? '?'} user(s)`
            : selectedUser?.username || selectedUser?.email || '1 user'
        }.\nSubject: ${subject}\n\nThis cannot be undone.`}
        confirmLabel="Confirm Send"
        expiresAt={confirmDialog.expiresAt}
        loading={sending}
        error={confirmError}
      />
    </div>
  );
}

// ===== Newsletter Broadcast Tab =====
function NewsletterBroadcastTab({ stats }: { stats: EmailStats | null }) {
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    token: string;
    expiresAt: number;
  }>({ open: false, token: '', expiresAt: 0 });
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const subscriberCount = stats?.totalSubscribers ?? 0;
  const canSend = subject.length >= 5 && bodyHtml.length >= 20 && subscriberCount > 0;

  const handleSend = async () => {
    setError(null);
    setResult(null);
    try {
      const tokenData = await adminFetch<{ confirmationToken: string; expiresIn: number }>(
        '/admin/email/confirmation-token',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'broadcast',
            recipientCount: subscriberCount,
          }),
        }
      );

      setConfirmDialog({
        open: true,
        token: tokenData.confirmationToken,
        expiresAt: Date.now() + tokenData.expiresIn * 1000,
      });
      setConfirmError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate broadcast');
    }
  };

  const handleConfirmSend = async () => {
    setSending(true);
    setConfirmError(null);
    try {
      const data = await adminFetch<{ sent: number; failed: number; subscriberCount: number }>(
        '/admin/email/broadcast',
        {
          method: 'POST',
          body: JSON.stringify({
            subject,
            bodyHtml,
            confirmationToken: confirmDialog.token,
          }),
        }
      );

      setResult({ sent: data.sent, failed: data.failed });
      setConfirmDialog({ open: false, token: '', expiresAt: 0 });
      setSubject('');
      setBodyHtml('');
    } catch (err) {
      setConfirmError(err instanceof Error ? err.message : 'Broadcast failed');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Subscriber summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="text-sm text-gray-700">
          <span className="font-semibold text-gray-900">{subscriberCount.toLocaleString()}</span>{' '}
          confirmed subscriber{subscriberCount !== 1 ? 's' : ''} will receive this email
        </p>
        {subscriberCount === 0 && (
          <p className="mt-2 text-sm text-amber-600 font-medium">
            No subscribers yet. The send button is disabled.
          </p>
        )}
      </div>

      {/* Compose area */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Compose Newsletter</h3>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-700">Subject</label>
              <span className="text-xs text-gray-400">{subject.length}/200</span>
            </div>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value.slice(0, 200))}
              placeholder="Newsletter subject line"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-700">Body (HTML)</label>
              <span className="text-xs text-gray-400">{bodyHtml.length}/50000</span>
            </div>
            <textarea
              value={bodyHtml}
              onChange={(e) => setBodyHtml(e.target.value.slice(0, 50000))}
              placeholder="Newsletter body — supports HTML"
              rows={8}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
            />
          </div>

          {/* Unsubscribe notice */}
          <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700">
              An unsubscribe link will be automatically added to the footer of each email.
              You do not need to add one manually. This is required by law.
            </p>
          </div>

          {/* Preview */}
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {showPreview ? 'Hide preview' : 'Show preview'}
          </button>

          {showPreview && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <p className="text-xs text-gray-500 mb-2">Preview</p>
              <div className="bg-white rounded p-4 border border-gray-100">
                <h4 className="font-semibold text-gray-900 mb-2">{subject || '(no subject)'}</h4>
                <div
                  className="text-sm text-gray-700 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: bodyHtml || '<em>(empty body)</em>' }}
                />
                <hr className="my-4 border-gray-200" />
                <p className="text-xs text-gray-400">
                  <a href="#" className="text-blue-500 underline">Unsubscribe</a> from this newsletter
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-800">
              Sent to {result.sent} subscriber{result.sent !== 1 ? 's' : ''}
              {result.failed > 0 && ` (${result.failed} failed)`}
            </p>
            {result.failed > 0 && (
              <p className="text-xs text-green-700 mt-1">
                Some deliveries failed. Check Resend dashboard for details.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Send button */}
      <button
        onClick={handleSend}
        disabled={!canSend || sending}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Send className="w-4 h-4" />
        Send Broadcast
      </button>

      {/* Confirmation dialog */}
      <SendConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, token: '', expiresAt: 0 })}
        onConfirm={handleConfirmSend}
        title="Confirm Broadcast"
        message={`You are about to send a newsletter to ${subscriberCount.toLocaleString()} confirmed subscriber${subscriberCount !== 1 ? 's' : ''}.\nSubject: ${subject}\n\nEach email will include a one-click unsubscribe link.\nThis cannot be undone.`}
        confirmLabel="Confirm Broadcast"
        expiresAt={confirmDialog.expiresAt}
        loading={sending}
        error={confirmError}
      />
    </div>
  );
}

// ===== Send History Tab =====
function SendHistoryTab() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchHistory = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch<{
        history: HistoryEntry[];
        total: number;
        page: number;
        totalPages: number;
      }>(`/admin/email/history?page=${p}&limit=20`);
      setHistory(data.history);
      setTotalPages(data.totalPages);
      setPage(data.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory(1);
  }, [fetchHistory]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
          <p className="text-sm text-gray-500 mb-3">{error}</p>
          <button
            onClick={() => fetchHistory(page)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="text-sm text-gray-500 text-center py-8">No emails sent yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-500">Email send history</h3>
        <button
          onClick={() => fetchHistory(page)}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Subject</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Recipients</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Sent / Failed</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {history.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    entry.action === 'admin_sent_newsletter_broadcast'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {entry.action === 'admin_sent_newsletter_broadcast' ? 'Newsletter' : 'Important'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-900 max-w-xs truncate">{entry.details.subject}</td>
                <td className="px-4 py-3 text-gray-600">{entry.details.recipientCount}</td>
                <td className="px-4 py-3">
                  <span className="text-green-700">{entry.details.succeeded}</span>
                  {entry.details.failed > 0 && (
                    <span className="text-red-600"> / {entry.details.failed}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {new Date(entry.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => fetchHistory(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1.5 text-xs text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
          <button
            onClick={() => fetchHistory(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-1.5 text-xs text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

// ===== Subscribers Tab =====
function SubscribersTab() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchSubscribers = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch<{
        subscribers: Subscriber[];
        total: number;
        page: number;
        totalPages: number;
      }>(`/admin/email/subscribers?page=${p}&limit=50`);
      setSubscribers(data.subscribers);
      setTotalPages(data.totalPages);
      setPage(data.page);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscribers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscribers(1);
  }, [fetchSubscribers]);

  // Mask email: first 3 chars + *** + @domain
  const maskEmail = (email: string) => {
    const [local, domain] = email.split('@');
    if (!domain) return email;
    const visible = local.slice(0, 3);
    return `${visible}***@${domain}`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
          <p className="text-sm text-gray-500 mb-3">{error}</p>
          <button
            onClick={() => fetchSubscribers(page)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (subscribers.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="text-sm text-gray-500 text-center py-8">No subscribers yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-500">{total} subscriber{total !== 1 ? 's' : ''}</h3>
        <div className="flex items-center gap-2">
          <p className="text-xs text-gray-400">Full email addresses are available in the Resend dashboard.</p>
          <button
            onClick={() => fetchSubscribers(page)}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Username</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Subscribed since</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Consent method</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {subscribers.map((sub) => (
              <tr key={sub.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-900">{sub.username || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{maskEmail(sub.email)}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {sub.subscribedAt
                    ? new Date(sub.subscribedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '—'}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    {sub.consentMethod || 'unknown'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => fetchSubscribers(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1.5 text-xs text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
          <button
            onClick={() => fetchSubscribers(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-1.5 text-xs text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

// ===== Main Page =====
export default function CommunicationsPage() {
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'important' | 'broadcast' | 'history' | 'subscribers'>('important');

  const fetchStats = useCallback(async () => {
    try {
      const data = await adminFetch<EmailStats>('/admin/email/stats');
      setStats(data);
    } catch {
      // Stats are non-critical — page still works
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Refresh stats on tab switch
  useEffect(() => {
    fetchStats();
  }, [activeTab, fetchStats]);

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Email Communications</h1>
        <p className="text-sm text-gray-500 mt-1">
          Send important messages and manage newsletter broadcasts
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Subscribers"
          value={statsLoading ? null : stats?.totalSubscribers ?? 0}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          label="Subscriber Rate"
          value={statsLoading ? null : `${stats?.subscriberPercent ?? 0}%`}
          icon={Percent}
          color="bg-purple-500"
        />
        <StatCard
          label="Sends (30 days)"
          value={statsLoading ? null : stats?.recentSends ?? 0}
          icon={Mail}
          color="bg-green-500"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        <TabButton active={activeTab === 'important'} onClick={() => setActiveTab('important')}>
          Important Messages
        </TabButton>
        <TabButton active={activeTab === 'broadcast'} onClick={() => setActiveTab('broadcast')}>
          Newsletter Broadcast
        </TabButton>
        <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')}>
          Send History
        </TabButton>
        <TabButton active={activeTab === 'subscribers'} onClick={() => setActiveTab('subscribers')}>
          Subscribers
        </TabButton>
      </div>

      {/* Tab content */}
      {activeTab === 'important' && <ImportantMessagesTab stats={stats} />}
      {activeTab === 'broadcast' && <NewsletterBroadcastTab stats={stats} />}
      {activeTab === 'history' && <SendHistoryTab />}
      {activeTab === 'subscribers' && <SubscribersTab />}
    </div>
  );
}
