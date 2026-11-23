import { create } from 'zustand';
import { WaterLog } from '../types';

interface WaterState {
  todayLogs: WaterLog[];
  goalMl: number;
  setTodayLogs: (logs: WaterLog[]) => void;
  setGoal: (ml: number) => void;
  getTotalMl: () => number;
  getPercentage: () => number;
}

export const useWaterStore = create<WaterState>((set, get) => ({
  todayLogs: [],
  goalMl: 2000,
  setTodayLogs: (logs) => set({ todayLogs: logs }),
  setGoal: (ml) => set({ goalMl: ml }),
  getTotalMl: () => get().todayLogs.reduce((sum, log) => sum + log.amountMl, 0),
  getPercentage: () => {
    const total = get().getTotalMl();
    const goal = get().goalMl;
    return goal > 0 ? Math.min(100, Math.round((total / goal) * 100)) : 0;
  },
}));
