import { useState, useEffect } from 'react';
import { workoutSessionService, WorkoutSessionState } from '../services/workoutSessionService';
import { ActivityType } from '../types';

export function useWorkoutSession() {
  const [state, setState] = useState<WorkoutSessionState>(workoutSessionService.getState());

  useEffect(() => {
    const unsubscribe = workoutSessionService.subscribe((newState) => {
      setState(newState);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return {
    ...state,
    formattedDuration: formatTime(state.durationSeconds),
    formattedPace: state.averagePaceMinPerKm > 0 ? `${state.averagePaceMinPerKm.toFixed(1)}'/km` : `--'/km`,
    startWorkout: (type: ActivityType) => workoutSessionService.startWorkout(type),
    pauseWorkout: () => workoutSessionService.pauseWorkout(),
    resumeWorkout: () => workoutSessionService.resumeWorkout(),
    finishWorkout: () => workoutSessionService.finishWorkout(),
    simulateStepIncrement: (count?: number) => workoutSessionService.simulateStepIncrement(count),
    getLastCompletedSession: () => workoutSessionService.getLastCompletedSession(),
  };
}

