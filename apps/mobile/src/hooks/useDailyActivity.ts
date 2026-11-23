import { useState, useEffect } from 'react';
import { activityTrackingService, DailyActivityState } from '../services/activityTrackingService';
import { useAuthStore } from '../stores/auth.store';

export function useDailyActivity() {
  const [state, setState] = useState<DailyActivityState>(activityTrackingService.getState());
  const user = useAuthStore((s: any) => s.user);

  useEffect(() => {
    // Khởi tạo service khi hook mount
    activityTrackingService.init();

    const unsubscribe = activityTrackingService.subscribe((newState) => {
      setState(newState);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const stepsPercentage = state.targetSteps > 0
    ? Math.min(100, Math.round((state.steps / state.targetSteps) * 100))
    : 0;

  const durationPercentage = state.targetMinutes > 0
    ? Math.min(100, Math.round((state.activeMinutes / state.targetMinutes) * 100))
    : 0;

  return {
    ...state,
    stepsPercentage,
    durationPercentage,
    requestPermissions: () => activityTrackingService.requestPermissionAndStart(),
    startTracking: () => activityTrackingService.startTracking(),
    stopTracking: () => activityTrackingService.stopTracking(),
    simulateStepIncrement: (count?: number) => activityTrackingService.simulateStepIncrement(count),
    syncNow: () => activityTrackingService.triggerSync(),
    refetchServer: () => activityTrackingService.fetchServerDailySummary(),
  };
}
