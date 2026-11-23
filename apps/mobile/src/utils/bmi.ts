/**
 * Tiện ích tính toán chỉ số khối cơ thể (BMI)
 * Tiêu chuẩn WHO khu vực Châu Á - Thái Bình Dương (đồng bộ 100% với Backend NestJS)
 */

export interface BmiAnalysis {
  bmi: number;
  category: 'UNDERWEIGHT' | 'NORMAL' | 'OVERWEIGHT' | 'OBESE_1' | 'OBESE_2';
  categoryText: string;
  categoryColor: string;
  idealWeightMinKg: number;
  idealWeightMaxKg: number;
}

export function calculateBmi(heightCm?: number | null, weightKg?: number | null): BmiAnalysis | null {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) {
    return null;
  }

  const heightM = heightCm / 100;
  const bmiRaw = weightKg / (heightM * heightM);
  const bmi = Math.round(bmiRaw * 10) / 10;

  let category: BmiAnalysis['category'];
  let categoryText: string;
  let categoryColor: string;

  if (bmi < 18.5) {
    category = 'UNDERWEIGHT';
    categoryText = 'Gầy / Thiếu cân';
    categoryColor = '#F59E0B'; // Amber
  } else if (bmi < 23.0) {
    category = 'NORMAL';
    categoryText = 'Bình thường / Lý tưởng';
    categoryColor = '#006C4C'; // Primary Green
  } else if (bmi < 25.0) {
    category = 'OVERWEIGHT';
    categoryText = 'Thừa cân / Tiền béo phì';
    categoryColor = '#EA580C'; // Orange
  } else if (bmi < 30.0) {
    category = 'OBESE_1';
    categoryText = 'Béo phì độ 1';
    categoryColor = '#DC2626'; // Red
  } else {
    category = 'OBESE_2';
    categoryText = 'Béo phì độ 2 (Nguy hiểm)';
    categoryColor = '#991B1B'; // Dark Red
  }

  const idealWeightMinKg = Math.round(18.5 * heightM * heightM * 10) / 10;
  const idealWeightMaxKg = Math.round(22.9 * heightM * heightM * 10) / 10;

  return {
    bmi,
    category,
    categoryText,
    categoryColor,
    idealWeightMinKg,
    idealWeightMaxKg,
  };
}

