import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export enum HealthRecordType {
  WEIGHT = 'WEIGHT',
  HEIGHT = 'HEIGHT',
  BLOOD_PRESSURE = 'BLOOD_PRESSURE',
  HEART_RATE = 'HEART_RATE',
  BLOOD_GLUCOSE = 'BLOOD_GLUCOSE',
  OTHER = 'OTHER',
}

export interface Attachment {
  id?: string;
  storagePath: string;
  fileName: string;
  fileType: string;
  fileSize?: number;
}

export interface HealthRecord {
  id: string;
  userId: string;
  recordType: HealthRecordType;
  value: number;
  secondaryValue?: number | null;
  unit: string;
  source: string;
  recordedAt: string;
  note?: string | null;
  attachments?: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateHealthRecordPayload {
  recordType: HealthRecordType;
  value: number;
  secondaryValue?: number;
  unit: string;
  source?: string;
  recordedAt?: string;
  note?: string;
  attachments?: {
    storagePath: string;
    fileName: string;
    fileType: string;
    fileSize?: number;
  }[];
}

export interface HealthRecordQueryParams {
  recordType?: HealthRecordType;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export const HEALTH_RECORD_KEYS = {
  all: ['health-records'] as const,
  latest: () => [...HEALTH_RECORD_KEYS.all, 'latest'] as const,
  list: (params?: HealthRecordQueryParams) => [...HEALTH_RECORD_KEYS.all, 'list', params] as const,
  detail: (id: string) => [...HEALTH_RECORD_KEYS.all, 'detail', id] as const,
};

export function useLatestVitals() {
  return useQuery<Record<HealthRecordType, HealthRecord | null>>({
    queryKey: HEALTH_RECORD_KEYS.latest(),
    queryFn: async () => {
      const response = await api.get('/health-records/latest');
      return response.data?.data || response.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useHealthRecordsList(params?: HealthRecordQueryParams) {
  return useQuery<HealthRecord[]>({
    queryKey: HEALTH_RECORD_KEYS.list(params),
    queryFn: async () => {
      const response = await api.get('/health-records', { params });
      const resData = response.data?.data || response.data;
      return Array.isArray(resData) ? resData : [];
    },
    staleTime: 30 * 1000,
  });
}

export function useHealthRecordDetail(id: string) {
  return useQuery<HealthRecord>({
    queryKey: HEALTH_RECORD_KEYS.detail(id),
    queryFn: async () => {
      const response = await api.get(`/health-records/${id}`);
      return response.data?.data || response.data;
    },
    enabled: !!id,
  });
}

export function useCreateHealthRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateHealthRecordPayload) => {
      const response = await api.post('/health-records', payload);
      return response.data?.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HEALTH_RECORD_KEYS.all });
    },
  });
}

export interface UpdateHealthRecordPayload {
  id: string;
  value?: number;
  secondaryValue?: number;
  unit?: string;
  recordedAt?: string;
  note?: string;
}

export function useUpdateHealthRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateHealthRecordPayload) => {
      const response = await api.patch(`/health-records/${id}`, payload);
      return response.data?.data || response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: HEALTH_RECORD_KEYS.all });
      queryClient.invalidateQueries({ queryKey: HEALTH_RECORD_KEYS.detail(variables.id) });
    },
  });
}

export function useDeleteHealthRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/health-records/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HEALTH_RECORD_KEYS.all });
    },
  });
}
