'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

interface Problem {
  id: string;
  title: string;
  description: string;
  status: string;
  authorType: string;
  solutionCount: number;
  comparisonCount: number;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface UseProblemsOptions {
  status?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export function useProblems(options: UseProblemsOptions = {}) {
  const { status, sort = 'newest', page = 1, limit = 20 } = options;
  const [problems, setProblems] = useState<Problem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProblems = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = [`sort=${sort}`, `page=${page}`, `limit=${limit}`];
      if (status) params.push(`status=${status}`);

      const data = await apiFetch<{ problems: Problem[]; pagination: Pagination }>(
        `/problems?${params.join('&')}`
      );
      setProblems(data.problems);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch problems');
    } finally {
      setLoading(false);
    }
  }, [status, sort, page, limit]);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  return { problems, pagination, loading, error, refetch: fetchProblems };
}
