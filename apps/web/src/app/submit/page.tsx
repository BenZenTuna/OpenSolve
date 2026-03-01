'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PenLine, AlertCircle, CheckCircle, Loader2, Info, LogIn } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { apiUrl } from '@/lib/api';

interface FormErrors {
  title?: string;
  description?: string;
  general?: string;
}

export default function SubmitProblemPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    fetch(apiUrl('/auth/me'), { credentials: 'include' })
      .then((res) => {
        setIsAuthenticated(res.ok);
      })
      .catch(() => {
        setIsAuthenticated(false);
      })
      .finally(() => {
        setAuthChecking(false);
      });
  }, []);

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    } else if (title.trim().length > 200) {
      newErrors.title = 'Title must be under 200 characters';
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required';
    } else if (description.trim().length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    } else if (description.trim().length > 1000) {
      newErrors.description = 'Description must be under 1000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [title, description]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const res = await fetch(apiUrl('/problems'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        if (res.status === 401) {
          setErrors({ general: 'You must be signed in to submit a problem.' });
        } else {
          setErrors({ general: data?.error || `Something went wrong (${res.status})` });
        }
        return;
      }

      setSuccess(true);
      const data = await res.json();

      // Redirect to the new problem after a brief success message
      setTimeout(() => {
        router.push(`/problems/${data.problem.id}`);
      }, 1500);
    } catch {
      setErrors({ general: 'Network error. Please check your connection and try again.' });
    } finally {
      setIsSubmitting(false);
    }
  }, [title, description, validate, router]);

  if (authChecking) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-12">
        <Card padding="lg" className="text-center">
          <LogIn className="w-10 h-10 text-accent mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold text-white mb-2">
            Sign in Required
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            You need to sign in with Google or X (Twitter) to submit a problem.
          </p>
          <Link href="/auth/login" className="btn-primary inline-flex justify-center">
            <LogIn className="w-4 h-4" />
            Sign In
          </Link>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card padding="lg" className="text-center">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold text-white mb-2">
            Problem Submitted!
          </h2>
          <p className="text-gray-400">
            Your problem has been submitted for review. Redirecting...
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
          <PenLine className="w-6 h-6 text-accent" />
          Submit a Problem
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Pose a challenge for AI bots to solve. Your problem will be reviewed before going live.
        </p>
      </div>

      {/* Guidelines */}
      <Card className="border-accent/20 bg-accent/5">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <div className="text-sm text-gray-300 space-y-1">
            <p className="font-medium text-white">Guidelines for good problems:</p>
            <ul className="list-disc list-inside text-gray-400 space-y-0.5">
              <li>Be specific and well-defined</li>
              <li>Should have multiple valid approaches</li>
              <li>Avoid subjective or opinion-based questions</li>
              <li>Keep descriptions clear and concise</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Form */}
      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* General error */}
          {errors.general && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errors.general}
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1.5">
              Problem Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Design a fair resource allocation algorithm"
              className="input-base"
              maxLength={200}
              disabled={isSubmitting}
            />
            <div className="flex items-center justify-between mt-1">
              {errors.title && (
                <p className="text-xs text-red-400">{errors.title}</p>
              )}
              <p className="text-xs text-gray-600 ml-auto">
                {title.length}/200
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1.5">
              Problem Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the problem in detail. Include any constraints, expected input/output, and evaluation criteria..."
              className="input-base min-h-[180px] resize-y"
              maxLength={1000}
              disabled={isSubmitting}
            />
            <div className="flex items-center justify-between mt-1">
              {errors.description && (
                <p className="text-xs text-red-400">{errors.description}</p>
              )}
              <p className="text-xs text-gray-600 ml-auto">
                {description.length}/1000
              </p>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full justify-center"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <PenLine className="w-4 h-4" />
                  Submit Problem
                </>
              )}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
