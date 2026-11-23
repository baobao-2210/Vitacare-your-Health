import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { FoodItem, MealType } from '../types';

export interface TodayMealFormatted {
  id: string;
  userId: string;
  mealType: MealType;
  consumedAt: string;
  note?: string | null;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  mealItems: {
    id: string;
    foodItemId?: string | null;
    foodNameSnapshot: string;
    quantityG: number;
    caloriesSnapshot?: number | null;
    proteinSnapshot?: number | null;
    carbsSnapshot?: number | null;
    fatSnapshot?: number | null;
  }[];
}

export interface TodayNutritionResponse {
  date: string;
  timezone: string;
  summary: {
    totalCalories: number;
    targetCalories: number;
    percentage: number;
    progress: number;
    remainingCalories: number;
    macros: {
      proteinG: number;
      carbsG: number;
      fatG: number;
    };
  };
  mealsByType: {
    BREAKFAST: TodayMealFormatted[];
    LUNCH: TodayMealFormatted[];
    DINNER: TodayMealFormatted[];
    SNACK: TodayMealFormatted[];
  };
  totalMeals: number;
}

export interface CreateMealPayload {
  mealType: MealType;
  consumedAt?: string;
  note?: string;
  items: {
    foodItemId?: string;
    foodName?: string;
    quantityG: number;
  }[];
}

export function useNutritionToday() {
  const queryClient = useQueryClient();

  const query = useQuery<TodayNutritionResponse>({
    queryKey: ['nutrition', 'today'],
    queryFn: async () => {
      const res = await api.get('/nutrition/meals/today');
      return res.data.data;
    },
  });

  const createMealMutation = useMutation({
    mutationFn: async (payload: CreateMealPayload) => {
      const res = await api.post('/nutrition/meals', payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition', 'today'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'today'] });
    },
  });

  const deleteMealMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/nutrition/meals/${id}`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition', 'today'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'today'] });
    },
  });

  return {
    ...query,
    createMeal: createMealMutation.mutateAsync,
    isCreatingMeal: createMealMutation.isPending,
    deleteMeal: deleteMealMutation.mutateAsync,
    isDeletingMeal: deleteMealMutation.isPending,
  };
}

export function useFoodSearch(searchTerm: string = '') {
  return useQuery<FoodItem[]>({
    queryKey: ['nutrition', 'foods', searchTerm],
    queryFn: async () => {
      const param = searchTerm.trim() ? `?search=${encodeURIComponent(searchTerm.trim())}` : '';
      const res = await api.get(`/nutrition/foods${param}`);
      return res.data.data;
    },
  });
}

