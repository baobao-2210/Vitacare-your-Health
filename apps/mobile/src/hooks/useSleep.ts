import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { SleepLog, SleepQuality } from '../types';

export interface LatestSleepResponse {
  latestLog: (SleepLog & { durationHours: number }) | null;
  targetHours: number;
  targetMinutes: number;
  percentage: number;
  progress: number;
  isGoalReached: boolean;
}

export interface SleepHistoryResponse {
  startDate: string;
  endDate: string;
  totalLogs: number;
  totalMinutes: number;
  averageMinutes: number;
  averageHours: number;
  logs: (SleepLog & { durationHours: number })[];
}

export function useSleepLatest() {
  const queryClient = useQueryClient();

  const query = useQuery<LatestSleepResponse>({
    queryKey: ['sleep', 'latest'],
    queryFn: async () => {
      const res = await api.get('/sleep/latest');
      return res.data.data;
    },
  });

  const addLogMutation = useMutation({
    mutationFn: async (payload: {
      sleepStart: string;
      sleepEnd: string;
      quality?: SleepQuality;
      note?: string;
    }) => {
      const res = await api.post('/sleep', payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sleep'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'today'] });
    },
  });

  const deleteLogMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/sleep/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sleep'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'today'] });
    },
  });

  return {
    ...query,
    addLog: addLogMutation.mutateAsync,
    isAdding: addLogMutation.isPending,
    deleteLog: deleteLogMutation.mutateAsync,
    isDeleting: deleteLogMutation.isPending,
  };
}

export function useSleepHistory(startDate?: string, endDate?: string) {
  return useQuery<SleepHistoryResponse>({
    queryKey: ['sleep', 'history', startDate, endDate],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await api.get('/sleep/history', { params });
      return res.data.data;
    },
  });
}

