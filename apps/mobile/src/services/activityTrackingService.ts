import { AppState, AppStateStatus } from 'react-native';
import { sensorAdapter, StepUpdateCallback } from './activitySensorAdapter';
import { api } from '../lib/api';
import dayjs from 'dayjs';

export interface DailyActivityState {
  date: string;
  steps: number;
  targetSteps: number;
  distanceKm: number;
  activeMinutes: number;
  targetMinutes: number;
  caloriesKcal: number;
  isSensorAvailable: boolean;
  permissionGranted: boolean;
  isTracking: boolean;
  lastSyncedAt: string | null;
}

type DailyActivityListener = (state: DailyActivityState) => void;

class ActivityTrackingService {
  private listeners: Set<DailyActivityListener> = new Set();
  private subscription: { remove: () => void } | null = null;
  private appStateSubscription: any = null;

  private state: DailyActivityState = {
    date: dayjs().format('YYYY-MM-DD'),
    steps: 0,
    targetSteps: 8000,
    distanceKm: 0,
    activeMinutes: 0,
    targetMinutes: 45,
    caloriesKcal: 0,
    isSensorAvailable: false,
    permissionGranted: false,
    isTracking: false,
    lastSyncedAt: null,
  };

  private lastSyncSteps = 0;
  private lastSyncTime = 0;
  private syncTimer: any = null;

  async init(userWeightKg = 65, userHeightCm = 170) {
    // 1. Kiểm tra cảm biến và quyền
    const available = await sensorAdapter.checkAvailability();
    const perm = await sensorAdapter.getPermissions();

    this.state.isSensorAvailable = available;
    this.state.permissionGranted = perm.granted;
    this.state.date = dayjs().format('YYYY-MM-DD');

    // 2. Khôi phục dữ liệu từ server cho ngày hôm nay
    await this.fetchServerDailySummary();

    // 3. Nếu quyền đã cấp, bắt đầu theo dõi
    if (perm.granted) {
      this.startTracking();
    }

    // 4. Lắng nghe AppState để reconcile khi app mở lại
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);

    this.notifyListeners();
  }

  private handleAppStateChange = async (nextState: AppStateStatus) => {
    if (nextState === 'active') {
      // Reconcile: Kiểm tra đổi ngày và đồng bộ
      const currentDate = dayjs().format('YYYY-MM-DD');
      if (currentDate !== this.state.date) {
        // Đã bước sang ngày mới
        this.state.date = currentDate;
        this.state.steps = 0;
        this.state.distanceKm = 0;
        this.state.activeMinutes = 0;
        this.state.caloriesKcal = 0;
        this.lastSyncSteps = 0;
      }
      await this.fetchServerDailySummary();
      this.notifyListeners();
    }
  };

  async requestPermissionAndStart(): Promise<boolean> {
    const res = await sensorAdapter.requestPermissions();
    this.state.permissionGranted = res.granted;
    if (res.granted) {
      this.startTracking();
    }
    this.notifyListeners();
    return res.granted;
  }

  startTracking() {
    if (this.subscription) return;

    this.state.isTracking = true;

    this.subscription = sensorAdapter.subscribeToStepUpdates(({ steps }) => {
      this.handleIncomingSteps(steps);
    });

    this.notifyListeners();
  }

  stopTracking() {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }
    this.state.isTracking = false;
    this.notifyListeners();
  }

  private handleIncomingSteps(stepDelta: number) {
    if (stepDelta <= 0) return;

    // Kiểm tra ranh giới ngày
    const today = dayjs().format('YYYY-MM-DD');
    if (today !== this.state.date) {
      this.state.date = today;
      this.state.steps = 0;
      this.lastSyncSteps = 0;
    }

    this.state.steps += stepDelta;

    // Tính toán ước tính theo thể trạng
    const strideMeters = 0.72; // ~0.72m
    const totalDistanceMeters = this.state.steps * strideMeters;
    this.state.distanceKm = Math.round((totalDistanceMeters / 1000) * 100) / 100;
    this.state.caloriesKcal = Math.round(this.state.steps * 0.045 * 10) / 10;
    this.state.activeMinutes = Math.round((this.state.steps / 100) * 1);

    this.notifyListeners();
    this.scheduleSync();
  }

  /**
   * Đồng bộ số bước lên server (Throttled & Idempotent)
   */
  private scheduleSync() {
    const now = Date.now();
    const stepsDelta = Math.abs(this.state.steps - this.lastSyncSteps);

    // Đồng bộ nếu tăng quá 50 bước hoặc đã qua 30 giây kể từ lần đồng bộ trước
    if (stepsDelta >= 50 || now - this.lastSyncTime > 30000) {
      this.triggerSync();
    } else if (!this.syncTimer) {
      this.syncTimer = setTimeout(() => {
        this.triggerSync();
        this.syncTimer = null;
      }, 15000);
    }
  }

  async triggerSync() {
    if (this.state.steps === 0 && !this.state.lastSyncedAt) return;

    try {
      const res = await api.post('/activity/sync', {
        activityDate: this.state.date,
        steps: this.state.steps,
        distanceMeters: Math.round(this.state.distanceKm * 1000),
        activeSeconds: this.state.activeMinutes * 60,
        caloriesKcal: this.state.caloriesKcal,
        dataSource: 'SENSOR',
      });

      this.lastSyncSteps = this.state.steps;
      this.lastSyncTime = Date.now();
      this.state.lastSyncedAt = new Date().toISOString();
      this.notifyListeners();
    } catch (e) {
      console.warn('[ActivityTrackingService] Lỗi đồng bộ syncDaily:', e);
    }
  }

  /**
   * Lấy tổng kết ngày từ server để khôi phục trạng thái
   */
  async fetchServerDailySummary() {
    try {
      const res = await api.get('/activity/daily', {
        params: { date: this.state.date },
      });
      const data = res.data?.data?.summary || res.data?.summary;
      if (data) {
        // Chỉ cập nhật nếu server có số bước lớn hơn bộ đếm hiện tại (tránh ghi đè ngược)
        if (data.totalSteps > this.state.steps) {
          this.state.steps = data.totalSteps;
          this.state.distanceKm = data.distanceKm || Math.round((data.distanceMeters / 1000) * 100) / 100;
          this.state.activeMinutes = data.totalMinutes || 0;
          this.state.caloriesKcal = Number(data.caloriesKcal) || 0;
          this.lastSyncSteps = this.state.steps;
        }
        if (data.targetSteps) this.state.targetSteps = data.targetSteps;
        if (data.targetMinutes) this.state.targetMinutes = data.targetMinutes;
      }
      this.notifyListeners();
    } catch (e) {
      console.warn('[ActivityTrackingService] Không thể tải daily summary từ server:', e);
    }
  }

  /**
   * Cập nhật kết quả phiên tập luyện vừa hoàn thành vào tổng kết ngày
   */
  incorporateWorkoutSession(workout: {
    steps: number;
    distanceKm: number;
    activeMinutes: number;
    caloriesKcal: number;
  }) {
    this.state.steps += workout.steps;
    this.state.distanceKm = Math.round((this.state.distanceKm + workout.distanceKm) * 100) / 100;
    this.state.activeMinutes = this.state.activeMinutes + workout.activeMinutes;
    this.state.caloriesKcal = Math.round((this.state.caloriesKcal + workout.caloriesKcal) * 10) / 10;

    this.notifyListeners();
    this.triggerSync();
  }

  /**
   * Giả lập bước chân (Dành cho máy ảo hoặc kiểm thử không có sensor)
   */
  simulateStepIncrement(count = 100) {
    this.handleIncomingSteps(count);
    sensorAdapter.simulateSteps(count);
  }

  getState(): DailyActivityState {
    return { ...this.state };
  }

  subscribe(listener: DailyActivityListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    const currentState = this.getState();
    for (const listener of this.listeners) {
      listener(currentState);
    }
  }
}

export const activityTrackingService = new ActivityTrackingService();

