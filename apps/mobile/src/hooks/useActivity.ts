import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { ActivityLog, ActivityType, DataSource } from '../types';

export interface TodayActivityResponse {
  date: string;
  timezone: string;
  summary: {
    totalSteps: number;
    targetSteps: number;
    stepsPercentage: number;
    stepsProgress: number;
    isStepsGoalReached: boolean;
    totalMinutes: number;
    targetMinutes: number;
    durationPercentage: number;
    durationProgress: number;
    isDurationGoalReached: boolean;
    activitiesCount: number;
    caloriesKcal?: number;
    distanceKm?: number;
    distanceMeters?: number;
  };
  logs: ActivityLog[];
}

export interface ActivityHistoryQuery {
  startDate?: string;
  endDate?: string;
  activityType?: ActivityType;
}

export interface CreateActivityPayload {
  activityType: ActivityType;
  steps?: number;
  durationMinutes?: number;
  source?: DataSource;
  externalId?: string;
  recordedAt?: string;
}

export function useActivityToday() {
  const queryClient = useQueryClient();

  const query = useQuery<TodayActivityResponse>({
    queryKey: ['activity', 'today'],
    queryFn: async () => {
      const res = await api.get('/activity/today');
      return res.data.data;
    },
  });

  const createActivityMutation = useMutation({
    mutationFn: async (payload: CreateActivityPayload) => {
      const res = await api.post('/activity', payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity', 'today'] });
      queryClient.invalidateQueries({ queryKey: ['activity', 'history'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'today'] });
    },
  });

  const deleteActivityMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/activity/${id}`);
      return res.data?.data || res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return {
    ...query,
    createActivity: createActivityMutation.mutateAsync,
    isCreatingActivity: createActivityMutation.isPending,
    deleteActivity: deleteActivityMutation.mutateAsync,
    isDeletingActivity: deleteActivityMutation.isPending,
  };
}

export interface ActivityHistoryItem {
  date: string;
  totalSteps: number;
  totalMinutes: number;
  distanceKm: number;
  caloriesKcal: number;
  sessionsCount: number;
}

export interface ActivityHistoryResponse {
  startDate: string;
  endDate: string;
  summary: {
    totalSteps: number;
    totalMinutes: number;
    totalCaloriesBurned: number;
    daysActive: number;
  };
  history: ActivityHistoryItem[];
  recentSessions?: any[];
}

export function useActivityHistory(queryParams?: ActivityHistoryQuery) {
  return useQuery<ActivityHistoryResponse>({
    queryKey: ['activity', 'history', queryParams],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (queryParams?.startDate) params.append('startDate', queryParams.startDate);
      if (queryParams?.endDate) params.append('endDate', queryParams.endDate);
      if (queryParams?.activityType) params.append('activityType', queryParams.activityType);

      const qs = params.toString();
      const res = await api.get(`/activity/history${qs ? `?${qs}` : ''}`);
      return res.data?.data || res.data;
    },
  });
}

