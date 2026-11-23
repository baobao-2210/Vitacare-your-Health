import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Medication, MedicationFrequency, MedicationLogStatus } from '../types';

export interface TodayReminder {
  medicationId: string;
  medicationName: string;
  dosageLabel?: string;
  scheduleId: string;
  reminderTime: string;
  status: MedicationLogStatus;
  takenAt?: string | null;
  logId?: string | null;
}

export interface TodayMedicationsResponse {
  date: string;
  totalCount: number;
  takenCount: number;
  remainingCount: number;
  reminders: TodayReminder[];
}

export function useMedicationsToday() {
  const queryClient = useQueryClient();

  const query = useQuery<TodayMedicationsResponse>({
    queryKey: ['medications', 'today'],
    queryFn: async () => {
      const res = await api.get('/medications/today');
      return res.data.data;
    },
  });

  const confirmLogMutation = useMutation({
    mutationFn: async (payload: {
      scheduleId: string;
      scheduledAt: string;
      status: MedicationLogStatus;
      takenAt?: string;
      note?: string;
    }) => {
      const res = await api.post('/medications/logs/confirm', payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'today'] });
    },
  });

  return {
    ...query,
    confirmLog: confirmLogMutation.mutateAsync,
    isConfirming: confirmLogMutation.isPending,
  };
}

export function useMedicationsList() {
  return useQuery<Medication[]>({
    queryKey: ['medications', 'list'],
    queryFn: async () => {
      const res = await api.get('/medications');
      return res.data.data;
    },
  });
}

export function useMedicationDetail(id: string) {
  return useQuery<Medication>({
    queryKey: ['medications', 'detail', id],
    queryFn: async () => {
      const res = await api.get(`/medications/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateMedication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      name: string;
      dosageLabel?: string;
      note?: string;
      schedules?: {
        frequency: MedicationFrequency;
        reminderTime: string;
        weekdays?: number[];
        intervalDays?: number;
        startDate?: string;
        endDate?: string;
      }[];
    }) => {
      const res = await api.post('/medications', payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'today'] });
    },
  });
}

export function useDeleteMedication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/medications/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'today'] });
    },
  });
}

