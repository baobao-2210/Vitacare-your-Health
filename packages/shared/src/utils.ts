/**
 * Calculate sleep duration in minutes (BR-SLEEP-02, BR-SLEEP-03)
 */
export function calculateSleepDuration(startTime: string, endTime: string): number {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  if (end <= start) throw new Error('End time must be after start time (BR-SLEEP-01)');
  return Math.round((end - start) / (1000 * 60));
}

/**
 * Calculate water completion percentage (BR-WATER-04, BR-WATER-05)
 */
export function calculateWaterPercentage(
  totalMl: number,
  goalMl: number,
): { percentage: number; displayPercentage: number } {
  if (goalMl <= 0) return { percentage: 0, displayPercentage: 0 };
  const percentage = (totalMl / goalMl) * 100;
  return {
    percentage: Math.round(percentage * 10) / 10,
    displayPercentage: Math.min(100, Math.round(percentage)),
  };
}

/**
 * Calculate nutritional values for meal item (BR-NUT-04, BR-NUT-07)
 */
export function calculateNutrition(
  servingGrams: number,
  per100g: { calories?: number; protein?: number; carbs?: number; fat?: number },
): { calories: number | null; protein: number | null; carbs: number | null; fat: number | null } {
  const factor = servingGrams / 100;
  return {
    calories: per100g.calories != null ? Math.round(per100g.calories * factor * 10) / 10 : null,
    protein: per100g.protein != null ? Math.round(per100g.protein * factor * 10) / 10 : null,
    carbs: per100g.carbs != null ? Math.round(per100g.carbs * factor * 10) / 10 : null,
    fat: per100g.fat != null ? Math.round(per100g.fat * factor * 10) / 10 : null,
  };
}

/**
 * Format duration in minutes to Vietnamese string
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} phút`;
  if (mins === 0) return `${hours} giờ`;
  return `${hours} giờ ${mins} phút`;
}

/**
 * Format water amount
 */
export function formatWater(ml: number): string {
  if (ml >= 1000) return `${(ml / 1000).toFixed(1)} L`;
  return `${ml} ml`;
}
