import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { WaterLog } from '../types';

export interface TodayWaterResponse {
  totalMl: number;
  goalMl: number;
  percentage: number;
  remainingMl: number;
  isGoalReached: boolean;
  logs: WaterLog[];
}

export interface WaterDayHistory {
  date: string;
  totalMl: number;
  goalMl: number;
  percentage: number;
  isGoalReached: boolean;
  logsCount: number;
}

export function useWaterToday() {
  const queryClient = useQueryClient();

  const query = useQuery<TodayWaterResponse>({
    queryKey: ['water', 'today'],
    queryFn: async () => {
      const res = await api.get('/water/today');
      return res.data.data;
    },
  });

  const addLogMutation = useMutation({
    mutationFn: async (payload: { amountMl: number; consumedAt?: string; note?: string }) => {
      const res = await api.post('/water', payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['water', 'today'] });
      queryClient.invalidateQueries({ queryKey: ['water', 'history'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'today'] });
    },
  });

  const updateLogMutation = useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; amountMl?: number; consumedAt?: string; note?: string }) => {
      const res = await api.patch(`/water/${id}`, payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['water', 'today'] });
      queryClient.invalidateQueries({ queryKey: ['water', 'history'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'today'] });
    },
  });

  const deleteLogMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/water/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['water', 'today'] });
      queryClient.invalidateQueries({ queryKey: ['water', 'history'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'today'] });
    },
  });

  return {
    ...query,
    addLog: addLogMutation.mutateAsync,
    isAdding: addLogMutation.isPending,
    updateLog: updateLogMutation.mutateAsync,
    isUpdating: updateLogMutation.isPending,
    deleteLog: deleteLogMutation.mutateAsync,
    isDeleting: deleteLogMutation.isPending,
  };
}

export function useWaterHistory(startDate?: string, endDate?: string) {
  return useQuery<WaterDayHistory[]>({
    queryKey: ['water', 'history', startDate, endDate],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await api.get('/water/history', { params });
      return res.data.data;
    },
  });
}

