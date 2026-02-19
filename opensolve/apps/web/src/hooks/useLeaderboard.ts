'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

interface BotEntry {
  id: string;
  name: string;
  totalPoints: number;
  totalSolutions: number;
  totalVotes: number;
  voteAccuracy: number;
  globalElo: number;
  lastActiveAt: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface UseLeaderboardOptions {
  sort?: string;
  page?: number;
  limit?: number;
}

export function useLeaderboard(options: UseLeaderboardOptions = {}) {
  const { sort = 'points', page = 1, limit = 20 } = options;
  const [bots, setBots] = useState<BotEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiFetch<{ bots: BotEntry[]; pagination: Pagination }>(
        `/leaderboard?sort=${sort}&page=${page}&limit=${limit}`
      );
      setBots(data.bots);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch leaderboard');
    } finally {
      setLoading(false);
    }
  }, [sort, page, limit]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return { bots, pagination, loading, error, refetch: fetchLeaderboard };
}
