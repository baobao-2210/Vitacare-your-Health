// ============================================================
// VITACARE MOBILE TYPES (VERSION 1.1)
// Synchronized with docs/DATABASE_SPECIFICATION.md v1.1
// ============================================================

export interface ApiResponse<T> {
  data: T;
  message?: string;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ------------------------------------------------------------
// Enums
// ------------------------------------------------------------

export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';

export type SleepQuality = 'VERY_POOR' | 'POOR' | 'NORMAL' | 'GOOD' | 'EXCELLENT';

export type ActivityType = 'WALKING' | 'RUNNING' | 'CYCLING' | 'GYM' | 'OTHER';

export type DataSource = 'MANUAL' | 'HEALTHKIT' | 'HEALTH_CONNECT' | 'SENSOR';

export type SessionStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

export type MedicationFrequency = 'DAILY' | 'WEEKLY' | 'INTERVAL' | 'CUSTOM';

export type MedicationLogStatus = 'PENDING' | 'TAKEN' | 'SKIPPED';

export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';

export type HealthRecordType =
  | 'WEIGHT'
  | 'HEIGHT'
  | 'BLOOD_PRESSURE'
  | 'HEART_RATE'
  | 'BLOOD_GLUCOSE'
  | 'OTHER';

export type GoalType = 'WATER' | 'SLEEP' | 'STEPS' | 'ACTIVITY_DURATION' | 'CALORIES';

export type NotificationType = 'WATER' | 'SLEEP' | 'MEDICATION' | 'ACTIVITY';

// ------------------------------------------------------------
// 1. User & Auth
// ------------------------------------------------------------

export interface User {
  id: string;
  email: string;
  fullName: string;
  timezone: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface RegisterDTO {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
}

// ------------------------------------------------------------
// 2. Health Profile & Goals
// ------------------------------------------------------------

export interface HealthProfile {
  id: string;
  userId: string;
  dateOfBirth?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  gender?: Gender | null;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HealthGoal {
  id: string;
  userId: string;
  goalType: GoalType;
  targetValue: number;
  unit: string;
  startDate: string;
  endDate?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ------------------------------------------------------------
// 3. Water Tracking
// ------------------------------------------------------------

export interface WaterLog {
  id: string;
  userId: string;
  amountMl: number;
  consumedAt: string;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WaterStats {
  totalMl: number;
  goalMl: number;
  percentage: number;
  logs: WaterLog[];
}

// ------------------------------------------------------------
// 4. Sleep Tracking
// ------------------------------------------------------------

export interface SleepLog {
  id: string;
  userId: string;
  sleepStart: string;
  sleepEnd: string;
  durationMinutes: number;
  quality?: SleepQuality | null;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ------------------------------------------------------------
// 5. Activity Tracking
// ------------------------------------------------------------

export interface ActivityLog {
  id: string;
  userId: string;
  activityType: ActivityType;
  steps?: number | null;
  durationMinutes?: number | null;
  source: DataSource;
  externalId?: string | null;
  recordedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityDailySummary {
  id: string;
  userId: string;
  activityDate: string;
  timezone: string;
  steps: number;
  distanceMeters: number;
  activeSeconds: number;
  caloriesKcal: number;
  dataSource: DataSource;
  lastSyncedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivitySession {
  id: string;
  userId: string;
  activityType: ActivityType;
  status: SessionStatus;
  startedAt: string;
  endedAt?: string | null;
  durationSeconds: number;
  pausedSeconds: number;
  steps: number;
  distanceMeters: number;
  caloriesKcal: number;
  averagePace?: number | null;
  createdAt: string;
  updatedAt: string;
}

// ------------------------------------------------------------
// 6. Medication Management
// ------------------------------------------------------------

export interface Medication {
  id: string;
  userId: string;
  name: string;
  dosageLabel?: string | null;
  note?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  schedules?: MedicationSchedule[];
}

export interface MedicationSchedule {
  id: string;
  medicationId: string;
  frequency: MedicationFrequency;
  reminderTime: string; // HH:mm:ss
  weekdays?: number[] | null;
  intervalDays?: number | null;
  startDate: string;
  endDate?: string | null;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  logs?: MedicationLog[];
}

export interface MedicationLog {
  id: string;
  scheduleId: string;
  scheduledAt: string;
  takenAt?: string | null;
  status: MedicationLogStatus;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ------------------------------------------------------------
// 7. Nutrition Tracking
// ------------------------------------------------------------

export interface FoodItem {
  id: string;
  createdBy?: string | null;
  name: string;
  caloriesPer100g?: number | null;
  proteinPer100g?: number | null;
  carbsPer100g?: number | null;
  fatPer100g?: number | null;
  source?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MealLog {
  id: string;
  userId: string;
  mealType: MealType;
  consumedAt: string;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
  mealItems: MealItem[];
}

export interface MealItem {
  id: string;
  mealLogId: string;
  foodItemId?: string | null;
  foodNameSnapshot: string;
  quantityG: number;
  caloriesSnapshot?: number | null;
  proteinSnapshot?: number | null;
  carbsSnapshot?: number | null;
  fatSnapshot?: number | null;
  createdAt: string;
  updatedAt: string;
  foodItem?: FoodItem | null;
}

// ------------------------------------------------------------
// 8. Health Records & Attachments
// ------------------------------------------------------------

export interface HealthRecord {
  id: string;
  userId: string;
  recordType: HealthRecordType;
  value: number;
  secondaryValue?: number | null;
  unit: string;
  source: DataSource;
  recordedAt: string;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
  attachments?: HealthAttachment[];
}

export interface HealthAttachment {
  id: string;
  healthRecordId: string;
  storagePath: string;
  fileName: string;
  fileType: string;
  fileSize?: number | null;
  createdAt: string;
}

// ------------------------------------------------------------
// 9. Notification Preferences
// ------------------------------------------------------------

export interface NotificationPreference {
  id: string;
  userId: string;
  notificationType: NotificationType;
  enabled: boolean;
  reminderTimes: string[];
  createdAt: string;
  updatedAt: string;
}

// ------------------------------------------------------------
// 10. Dashboard Summary
// ------------------------------------------------------------

export interface DashboardSummary {
  date: string;
  water: {
    totalMl: number;
    goalMl: number;
    percentage: number;
  };
  sleep: {
    lastSleep?: SleepLog | null;
    durationMinutes?: number | null;
    goalHours?: number | null;
  };
  activity: {
    totalSteps: number;
    totalActiveMinutes: number;
    goalSteps?: number | null;
  };
  nutrition: {
    totalCalories: number;
    goalCalories?: number | null;
  };
  medications: {
    pending: number;
    taken: number;
    total: number;
  };
}
