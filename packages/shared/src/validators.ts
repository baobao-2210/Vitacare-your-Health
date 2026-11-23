export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 64;
export const FULLNAME_MIN_LENGTH = 2;
export const FULLNAME_MAX_LENGTH = 100;

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const PASSWORD_RULES = {
  minLength: PASSWORD_MIN_LENGTH,
  maxLength: PASSWORD_MAX_LENGTH,
  pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
  message: 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số.',
};

export const WATER_RULES = { minMl: 1, maxMl: 5000 };
export const SLEEP_RULES = { minDurationMinutes: 1, maxDurationMinutes: 24 * 60 };
export const ACTIVITY_RULES = {
  minDurationMinutes: 1,
  maxDurationMinutes: 24 * 60,
  minSteps: 0,
  maxSteps: 100000,
};
export const SERVING_RULES = { minGrams: 0.1, maxGrams: 10000 };
