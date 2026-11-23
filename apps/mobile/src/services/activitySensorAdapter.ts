import { Platform } from 'react-native';

export interface SensorPermissionResult {
  granted: boolean;
  canAskAgain?: boolean;
}

export type StepUpdateCallback = (data: { steps: number; timestamp: number }) => void;

class ActivitySensorAdapter {
  private pedometerModule: any = null;
  private isInitialized = false;
  private isAvailable = false;
  private simulatedStepListeners: Set<StepUpdateCallback> = new Set();
  private activeSubscription: any = null;

  private async loadPedometer() {
    if (this.isInitialized) return this.pedometerModule;
    try {
      // Lazy load expo-sensors to prevent crash if not yet bundled
      const sensors = require('expo-sensors');
      this.pedometerModule = sensors.Pedometer;
      this.isAvailable = await this.pedometerModule.isAvailableAsync();
    } catch (e) {
      console.warn('[ActivitySensorAdapter] Không thể tải Pedometer module:', e);
      this.pedometerModule = null;
      this.isAvailable = false;
    }
    this.isInitialized = true;
    return this.pedometerModule;
  }

  /**
   * Kiểm tra thiết bị có cảm biến đếm bước phần cứng hay không
   */
  async checkAvailability(): Promise<boolean> {
    await this.loadPedometer();
    return this.isAvailable;
  }

  /**
   * Kiểm tra quyền truy cập cảm biến chuyển động
   */
  async getPermissions(): Promise<SensorPermissionResult> {
    const pedometer = await this.loadPedometer();
    if (!pedometer) return { granted: false, canAskAgain: false };

    try {
      const res = await pedometer.getPermissionsAsync();
      return {
        granted: res.granted,
        canAskAgain: res.canAskAgain,
      };
    } catch (e) {
      console.warn('[ActivitySensorAdapter] Lỗi kiểm tra quyền:', e);
      return { granted: false };
    }
  }

  /**
   * Xin quyền truy cập cảm biến chuyển động (Motion & Fitness / Activity Recognition)
   */
  async requestPermissions(): Promise<SensorPermissionResult> {
    const pedometer = await this.loadPedometer();
    if (!pedometer) return { granted: false };

    try {
      const res = await pedometer.requestPermissionsAsync();
      return {
        granted: res.granted,
        canAskAgain: res.canAskAgain,
      };
    } catch (e) {
      console.warn('[ActivitySensorAdapter] Lỗi xin quyền:', e);
      return { granted: false };
    }
  }

  /**
   * Lấy số bước lịch sử trong một khoảng thời gian (iOS CMPedometer hỗ trợ trực tiếp)
   */
  async getHistoricalSteps(startDate: Date, endDate: Date): Promise<number | null> {
    const pedometer = await this.loadPedometer();
    if (!pedometer || !this.isAvailable) return null;

    try {
      const result = await pedometer.getStepCountAsync(startDate, endDate);
      return result?.steps ?? null;
    } catch (e) {
      // Trên Android hoặc thiết bị không hỗ trợ query range
      console.warn('[ActivitySensorAdapter] getStepCountAsync không khả dụng trên nền tảng này:', e);
      return null;
    }
  }

  /**
   * Lắng nghe cập nhật số bước thời gian thực từ cảm biến
   */
  subscribeToStepUpdates(callback: StepUpdateCallback): { remove: () => void } {
    let nativeSubscription: any = null;
    let lastReportedSteps = 0;

    this.loadPedometer().then((pedometer) => {
      if (pedometer && this.isAvailable) {
        try {
          nativeSubscription = pedometer.watchStepCount((result: { steps: number }) => {
            const currentSteps = result.steps ?? 0;
            const delta = currentSteps - lastReportedSteps;
            lastReportedSteps = currentSteps;
            if (delta > 0) {
              callback({
                steps: delta,
                timestamp: Date.now(),
              });
            }
          });
          this.activeSubscription = nativeSubscription;
        } catch (e) {
          console.warn('[ActivitySensorAdapter] Lỗi watchStepCount:', e);
        }
      }
    });

    this.simulatedStepListeners.add(callback);

    return {
      remove: () => {
        if (nativeSubscription && typeof nativeSubscription.remove === 'function') {
          nativeSubscription.remove();
        }
        this.simulatedStepListeners.delete(callback);
      },
    };
  }

  /**
   * Giả lập bước chân cho chế độ Debug / Emulator khi máy ảo không có cảm biến vật lý
   */
  simulateSteps(stepsCount: number) {
    const timestamp = Date.now();
    for (const listener of this.simulatedStepListeners) {
      listener({ steps: stepsCount, timestamp });
    }
  }
}

export const sensorAdapter = new ActivitySensorAdapter();

