import { create } from 'zustand';
import { User, HealthProfile, AuthTokens } from '../types';
import { api, tokenStorage, setOnSessionExpired } from '../lib/api';
import { calculateBmi, BmiAnalysis } from '../utils/bmi';

export const DEMO_USER: User = {
  id: 'demo-user-vitacare-local',
  email: 'demo@vitacare.vn',
  fullName: 'Nguyễn Văn An (Dùng Thử)',
  timezone: 'Asia/Ho_Chi_Minh',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const DEMO_PROFILE: HealthProfile = {
  id: 'demo-health-profile-local',
  userId: 'demo-user-vitacare-local',
  dateOfBirth: '1995-10-20',
  heightCm: 172.5,
  weightKg: 68.0,
  gender: 'MALE',
  avatarUrl: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

interface AuthState {
  user: User | null;
  healthProfile: HealthProfile | null;
  bmiAnalysis: BmiAnalysis | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isDemoMode: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setProfileData: (profile: HealthProfile | null, bmi?: BmiAnalysis | null) => void;
  setTokens: (tokens: AuthTokens) => Promise<void>;
  login: (tokens: AuthTokens, user: User, healthProfile?: HealthProfile | null) => Promise<void>;
  enterDemoMode: () => void;
  restoreSession: () => Promise<boolean>;
  fetchProfile: () => Promise<void>;
  updateProfileState: (updatedUser: Partial<User>, updatedProfile: Partial<HealthProfile>) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => {
  // Wire session expiration to trigger clean logout in auth store
  setOnSessionExpired(() => {
    set({
      user: null,
      healthProfile: null,
      bmiAnalysis: null,
      isAuthenticated: false,
      isDemoMode: false,
      isLoading: false,
    });
  });

  return {
    user: null,
    healthProfile: null,
    bmiAnalysis: null,
    isAuthenticated: false,
    isLoading: true,
    isDemoMode: false,

    setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),

    setProfileData: (healthProfile, bmi) => {
      const calculated = bmi ?? (healthProfile ? calculateBmi(healthProfile.heightCm, healthProfile.weightKg) : null);
      set({ healthProfile, bmiAnalysis: calculated });
    },

    setTokens: async (tokens: AuthTokens) => {
      await tokenStorage.save(tokens.accessToken, tokens.refreshToken);
    },

    login: async (tokens: AuthTokens, user: User, healthProfile = null) => {
      await tokenStorage.save(tokens.accessToken, tokens.refreshToken);
      const bmi = healthProfile ? calculateBmi(healthProfile.heightCm, healthProfile.weightKg) : null;
      set({
        user,
        healthProfile,
        bmiAnalysis: bmi,
        isAuthenticated: true,
        isDemoMode: false,
        isLoading: false,
      });

      // Lazy refresh full profile with BMI analysis from backend
      try {
        const res = await api.get('/profile');
        const payload = res.data?.data || res.data;
        if (payload?.healthProfile) {
          set({
            user: payload.user || user,
            healthProfile: payload.healthProfile,
            bmiAnalysis: payload.bmiAnalysis || calculateBmi(payload.healthProfile.heightCm, payload.healthProfile.weightKg),
          });
        }
      } catch (err) {
        console.warn('[AuthStore] Post-login profile fetch failed:', err);
      }
    },

    enterDemoMode: () => {
      const bmi = calculateBmi(DEMO_PROFILE.heightCm, DEMO_PROFILE.weightKg);
      set({
        user: DEMO_USER,
        healthProfile: DEMO_PROFILE,
        bmiAnalysis: bmi,
        isAuthenticated: true,
        isDemoMode: true,
        isLoading: false,
      });
    },

    restoreSession: async () => {
      try {
        set({ isLoading: true });
        const accessToken = await tokenStorage.getAccessToken();
        if (!accessToken) {
          set({
            user: null,
            healthProfile: null,
            bmiAnalysis: null,
            isAuthenticated: false,
            isDemoMode: false,
            isLoading: false,
          });
          return false;
        }

        // Validate token with backend /auth/me
        const res = await api.get('/auth/me');
        const user = res.data?.data || res.data;

        if (user && user.id) {
          // Fetch profile and BMI
          let healthProfile: HealthProfile | null = user.healthProfile || null;
          let bmiAnalysis: BmiAnalysis | null = null;

          try {
            const profileRes = await api.get('/profile');
            const profileData = profileRes.data?.data || profileRes.data;
            if (profileData) {
              healthProfile = profileData.healthProfile || healthProfile;
              bmiAnalysis = profileData.bmiAnalysis || (healthProfile ? calculateBmi(healthProfile.heightCm, healthProfile.weightKg) : null);
            }
          } catch (profileErr) {
            console.warn('[AuthStore] Profile fetch during restore failed, using basic healthProfile:', profileErr);
            if (healthProfile) {
              bmiAnalysis = calculateBmi(healthProfile.heightCm, healthProfile.weightKg);
            }
          }

          set({
            user,
            healthProfile,
            bmiAnalysis,
            isAuthenticated: true,
            isDemoMode: false,
            isLoading: false,
          });
          return true;
        } else {
          throw new Error('Invalid user payload');
        }
      } catch (err) {
        console.warn('[AuthStore] Session restore failed:', err);
        await tokenStorage.clear();
        set({
          user: null,
          healthProfile: null,
          bmiAnalysis: null,
          isAuthenticated: false,
          isDemoMode: false,
          isLoading: false,
        });
        return false;
      }
    },

    fetchProfile: async () => {
      const { isDemoMode, isAuthenticated } = get();
      if (isDemoMode || !isAuthenticated) return;

      try {
        const res = await api.get('/profile');
        const payload = res.data?.data || res.data;
        if (payload) {
          const healthProfile = payload.healthProfile || null;
          const bmi = payload.bmiAnalysis || (healthProfile ? calculateBmi(healthProfile.heightCm, healthProfile.weightKg) : null);
          set({
            user: payload.user || get().user,
            healthProfile,
            bmiAnalysis: bmi,
          });
        }
      } catch (err) {
        console.warn('[AuthStore] fetchProfile warning:', err);
      }
    },

    updateProfileState: (updatedUser, updatedProfile) => {
      const current = get();
      const newUser = current.user ? { ...current.user, ...updatedUser } : null;
      const newProfile = current.healthProfile ? { ...current.healthProfile, ...updatedProfile } : null;
      const bmi = newProfile ? calculateBmi(newProfile.heightCm, newProfile.weightKg) : null;
      set({
        user: newUser,
        healthProfile: newProfile,
        bmiAnalysis: bmi,
      });
    },

    logout: async () => {
      const { isDemoMode } = get();
      if (!isDemoMode) {
        try {
          const refreshToken = await tokenStorage.getRefreshToken();
          if (refreshToken) {
            await api.post('/auth/logout', { refreshToken });
          }
        } catch (err) {
          console.warn('[AuthStore] Server logout notification failed:', err);
        }
      }

      await tokenStorage.clear();
      set({
        user: null,
        healthProfile: null,
        bmiAnalysis: null,
        isAuthenticated: false,
        isDemoMode: false,
        isLoading: false,
      });
    },
  };
});
