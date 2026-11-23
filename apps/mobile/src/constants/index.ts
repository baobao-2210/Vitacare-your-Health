export * from './theme';

export const APP_NAME = 'VitaCare';

export const QUICK_WATER_OPTIONS = [100, 200, 300, 500] as const;

export const MEAL_TYPES = {
  BREAKFAST: 'Bữa sáng',
  LUNCH: 'Bữa trưa',
  DINNER: 'Bữa tối',
  SNACK: 'Bữa phụ',
} as const;

export const ACTIVITY_TYPES = {
  WALKING: 'Đi bộ',
  RUNNING: 'Chạy bộ',
  CYCLING: 'Đạp xe',
  GYM: 'Tập gym',
  OTHER: 'Khác',
} as const;

export const SLEEP_QUALITY_LABELS = {
  VERY_POOR: 'Rất tệ',
  POOR: 'Tệ',
  NORMAL: 'Bình thường',
  GOOD: 'Tốt',
  EXCELLENT: 'Rất tốt',
} as const;

export const HEALTH_RECORD_LABELS = {
  WEIGHT: 'Cân nặng',
  HEIGHT: 'Chiều cao',
  BLOOD_PRESSURE: 'Huyết áp',
  HEART_RATE: 'Nhịp tim',
  BLOOD_GLUCOSE: 'Đường huyết',
  OTHER: 'Chỉ số khác',
} as const;

export const GOAL_TYPE_LABELS = {
  WATER: 'Nước uống',
  SLEEP: 'Giấc ngủ',
  STEPS: 'Số bước chân',
  ACTIVITY_DURATION: 'Thời gian vận động',
  CALORIES: 'Calo tiêu thụ',
} as const;
