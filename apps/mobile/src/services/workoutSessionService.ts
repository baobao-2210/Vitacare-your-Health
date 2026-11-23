import { sensorAdapter } from './activitySensorAdapter';
import { activityTrackingService } from './activityTrackingService';
import { api } from '../lib/api';
import { ActivityType, SessionStatus } from '../types';

export interface WorkoutSessionState {
  id: string | null;
  activityType: ActivityType;
  status: SessionStatus;
  startedAt: number | null;
  durationSeconds: number;
  pausedSeconds: number;
  steps: number;
  distanceKm: number;
  caloriesKcal: number;
  currentPaceMinPerKm: number; // Phút / km
  averagePaceMinPerKm: number;
}

type WorkoutSessionListener = (state: WorkoutSessionState) => void;

class WorkoutSessionService {
  private listeners: Set<WorkoutSessionListener> = new Set();
  private sensorSubscription: { remove: () => void } | null = null;
  private timer: any = null;
  private pauseStartTime: number | null = null;
  private lastStepTimestamp: number = 0;

  private state: WorkoutSessionState = {
    id: null,
    activityType: 'WALKING',
    status: 'COMPLETED',
    startedAt: null,
    durationSeconds: 0,
    pausedSeconds: 0,
    steps: 0,
    distanceKm: 0,
    caloriesKcal: 0,
    currentPaceMinPerKm: 0,
    averagePaceMinPerKm: 0,
  };

  private lastCompletedSession: WorkoutSessionState | null = null;

  getState(): WorkoutSessionState {
    return { ...this.state };
  }

  getLastCompletedSession(): WorkoutSessionState | null {
    return this.lastCompletedSession ? { ...this.lastCompletedSession } : null;
  }

  /**
   * Bắt đầu một phiên tập luyện mới
   */
  async startWorkout(activityType: ActivityType = 'WALKING', userWeightKg = 65): Promise<string> {
    // 1. Tạo session trên backend
    let sessionId = 'local-' + Date.now();
    try {
      const res = await api.post('/activity/sessions', {
        activityType,
        startedAt: new Date().toISOString(),
      });
      sessionId = res.data?.data?.id || res.data?.id || sessionId;
    } catch (e) {
      console.warn('[WorkoutSessionService] Không thể tạo session trên server, tiếp tục offline:', e);
    }

    // 2. Khởi tạo trạng thái phiên
    this.state = {
      id: sessionId,
      activityType,
      status: 'ACTIVE',
      startedAt: Date.now(),
      durationSeconds: 0,
      pausedSeconds: 0,
      steps: 0,
      distanceKm: 0,
      caloriesKcal: 0,
      currentPaceMinPerKm: 0,
      averagePaceMinPerKm: 0,
    };
    this.pauseStartTime = null;

    // 3. Khởi động Timer mỗi 1 giây
    this.startTimer(userWeightKg);

    // 4. Lắng nghe cảm biến bước chân riêng cho phiên này
    if (this.sensorSubscription) {
      this.sensorSubscription.remove();
    }
    this.sensorSubscription = sensorAdapter.subscribeToStepUpdates(({ steps }) => {
      if (this.state.status === 'ACTIVE' && steps > 0) {
        this.handleWorkoutSteps(steps, userWeightKg);
      }
    });

    this.notifyListeners();
    return sessionId;
  }

  /**
   * Tạm dừng phiên tập
   */
  async pauseWorkout() {
    if (this.state.status !== 'ACTIVE') return;

    this.state.status = 'PAUSED';
    this.pauseStartTime = Date.now();
    this.stopTimer();

    if (this.state.id && !this.state.id.startsWith('local-')) {
      api.patch(`/activity/sessions/${this.state.id}/pause`).catch((e) => {
        console.warn('[WorkoutSessionService] Lỗi gọi pause API:', e);
      });
    }

    this.notifyListeners();
  }

  /**
   * Tiếp tục phiên tập
   */
  async resumeWorkout(userWeightKg = 65) {
    if (this.state.status !== 'PAUSED') return;

    if (this.pauseStartTime) {
      const elapsedPause = Math.round((Date.now() - this.pauseStartTime) / 1000);
      this.state.pausedSeconds += elapsedPause;
      this.pauseStartTime = null;
    }

    this.state.status = 'ACTIVE';
    this.startTimer(userWeightKg);

    if (this.state.id && !this.state.id.startsWith('local-')) {
      api.patch(`/activity/sessions/${this.state.id}/resume`).catch((e) => {
        console.warn('[WorkoutSessionService] Lỗi gọi resume API:', e);
      });
    }

    this.notifyListeners();
  }

  /**
   * Kết thúc phiên tập luyện
   */
  async finishWorkout(userWeightKg = 65): Promise<WorkoutSessionState> {
    this.stopTimer();

    if (this.sensorSubscription) {
      this.sensorSubscription.remove();
      this.sensorSubscription = null;
    }

    if (this.state.status === 'PAUSED' && this.pauseStartTime) {
      const elapsedPause = Math.round((Date.now() - this.pauseStartTime) / 1000);
      this.state.pausedSeconds += elapsedPause;
      this.pauseStartTime = null;
    }

    this.state.status = 'COMPLETED';

    // Tính toán Pace trung bình: phút / km
    if (this.state.distanceKm > 0) {
      this.state.averagePaceMinPerKm = Math.round((this.state.durationSeconds / 60 / this.state.distanceKm) * 10) / 10;
    }

    const finishedSession = { ...this.state };
    this.lastCompletedSession = finishedSession;

    // Cập nhật ngay lập tức vào Daily Activity để Dashboard và Tri-rings phản ánh trực tiếp
    activityTrackingService.incorporateWorkoutSession({
      steps: finishedSession.steps,
      distanceKm: finishedSession.distanceKm,
      activeMinutes: Math.round(finishedSession.durationSeconds / 60),
      caloriesKcal: finishedSession.caloriesKcal,
    });

    // Gửi kết quả lên server
    if (this.state.id && !this.state.id.startsWith('local-')) {
      try {
        await api.patch(`/activity/sessions/${this.state.id}/finish`, {
          endedAt: new Date().toISOString(),
          steps: this.state.steps,
          durationSeconds: this.state.durationSeconds,
          pausedSeconds: this.state.pausedSeconds,
          distanceMeters: Math.round(this.state.distanceKm * 1000),
          caloriesKcal: this.state.caloriesKcal,
          averagePace: this.state.averagePaceMinPerKm,
        });
      } catch (e) {
        console.warn('[WorkoutSessionService] Lỗi gọi finish API:', e);
      }
    }

    this.notifyListeners();
    return finishedSession;
  }

  private startTimer(userWeightKg: number) {
    this.stopTimer();
    this.timer = setInterval(() => {
      if (this.state.status === 'ACTIVE') {
        this.state.durationSeconds += 1;

        // Tính calo theo thời gian và METs
        // Đi bộ MET = 3.5, Chạy bộ MET = 7.0
        const met = this.state.activityType === 'RUNNING' ? 7.0 : 3.5;
        const hours = this.state.durationSeconds / 3600;
        this.state.caloriesKcal = Math.round(met * userWeightKg * hours * 10) / 10;

        // Cập nhật pace
        if (this.state.distanceKm > 0.05) {
          this.state.averagePaceMinPerKm = Math.round((this.state.durationSeconds / 60 / this.state.distanceKm) * 10) / 10;
        }

        this.notifyListeners();
      }
    }, 1000);
  }

  private stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private handleWorkoutSteps(stepDelta: number, userWeightKg: number) {
    this.state.steps += stepDelta;

    // Quãng đường: Đi bộ sải chân 0.72m, chạy bộ 0.85m
    const strideMeters = this.state.activityType === 'RUNNING' ? 0.85 : 0.72;
    this.state.distanceKm = Math.round(((this.state.steps * strideMeters) / 1000) * 100) / 100;

    this.notifyListeners();
  }

  /**
   * Giả lập bước trong bài tập (cho Emulator / Debug mode)
   */
  simulateStepIncrement(count = 50) {
    if (this.state.status === 'ACTIVE') {
      sensorAdapter.simulateSteps(count);
    }
  }

  subscribe(listener: WorkoutSessionListener): () => void {
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

export const workoutSessionService = new WorkoutSessionService();

