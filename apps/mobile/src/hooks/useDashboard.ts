import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface DashboardData {
  date: string;
  user: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
    bmi?: number | null;
    bmiCategory?: string;
  };
  water: {
    totalMl: number;
    targetMl: number;
    percentage: number;
    progress: number;
    remainingMl: number;
    isGoalReached: boolean;
  };
  sleep: {
    latestDurationHours: number;
    targetHours: number;
    percentage: number;
    progress: number;
    quality?: string | null;
    isGoalReached: boolean;
  };
  activity: {
    totalSteps: number;
    targetSteps: number;
    stepsProgress: number;
    totalMinutes: number;
    targetMinutes: number;
    durationProgress: number;
    caloriesKcal?: number;
    distanceKm?: number;
  };
  nutrition: {
    totalCalories: number;
    targetCalories: number;
    progress: number;
    remainingCalories: number;
    macros: {
      proteinG: number;
      carbsG: number;
      fatG: number;
    };
  };
  medications: {
    totalToday: number;
    takenToday: number;
    remainingToday: number;
    nextReminder?: {
      medicationName: string;
      dosageLabel?: string;
      reminderTime: string;
    } | null;
  };
}

export function useDashboard() {
  const queryClient = useQueryClient();

  const query = useQuery<DashboardData>({
    queryKey: ['dashboard', 'today'],
    queryFn: async () => {
      const res = await api.get('/dashboard/today');
      return res.data.data;
    },
    refetchInterval: 30000, // Tự động làm mới mỗi 30s
  });

  const quickWaterMutation = useMutation({
    mutationFn: async (amountMl: number) => {
      const res = await api.post('/water', { amountMl });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'today'] });
    },
  });

  return {
    ...query,
    logQuickWater: quickWaterMutation.mutate,
    isLoggingWater: quickWaterMutation.isPending,
  };
}

