import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFoodItemDto } from './dto/create-food-item.dto';
import { CreateMealLogDto } from './dto/create-meal-log.dto';
import { MealHistoryQueryDto } from './dto/meal-history-query.dto';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_CALORIES_GOAL = 2000;

@Injectable()
export class NutritionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tìm kiếm món ăn trong kho dữ liệu (bao gồm món hệ thống và món người dùng tự tạo)
   */
  async searchFoods(userId: string, search?: string) {
    return this.prisma.foodItem.findMany({
      where: {
        isActive: true,
        OR: [
          { createdBy: null },
          { createdBy: userId },
        ],
        ...(search && {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        }),
      },
      orderBy: [
        { createdBy: 'asc' }, // Món hệ thống (null) lên trước
        { name: 'asc' },
      ],
      take: 50,
    });
  }

  /**
   * Người dùng tạo món ăn mới cho riêng mình (BR-NUT-06)
   */
  async createFoodItem(userId: string, dto: CreateFoodItemDto) {
    return this.prisma.foodItem.create({
      data: {
        createdBy: userId,
        name: dto.name,
        caloriesPer100g: dto.caloriesPer100g,
        proteinPer100g: dto.proteinPer100g || null,
        carbsPer100g: dto.carbsPer100g || null,
        fatPer100g: dto.fatPer100g || null,
        source: 'Người dùng tự tạo',
      },
    });
  }

  /**
   * Ghi nhận một bữa ăn mới kèm tính toán dinh dưỡng snapshot (BR-NUT-01 -> BR-NUT-05)
   */
  async createMeal(userId: string, dto: CreateMealLogDto) {
    const consumedAt = dto.consumedAt ? new Date(dto.consumedAt) : new Date();

    // Chuẩn bị snapshot dinh dưỡng cho từng món ăn
    const preparedItems: any[] = [];

    for (const item of dto.items) {
      let foodItem: any = null;
      if (item.foodItemId) {
        foodItem = await this.prisma.foodItem.findUnique({
          where: { id: item.foodItemId },
        });
      }

      const foodName = foodItem?.name || item.foodName || 'Món ăn';
      const factor = item.quantityG / 100;

      const caloriesSnapshot = foodItem?.caloriesPer100g
        ? Math.round(Number(foodItem.caloriesPer100g) * factor * 10) / 10
        : null;

      const proteinSnapshot = foodItem?.proteinPer100g
        ? Math.round(Number(foodItem.proteinPer100g) * factor * 10) / 10
        : null;

      const carbsSnapshot = foodItem?.carbsPer100g
        ? Math.round(Number(foodItem.carbsPer100g) * factor * 10) / 10
        : null;

      const fatSnapshot = foodItem?.fatPer100g
        ? Math.round(Number(foodItem.fatPer100g) * factor * 10) / 10
        : null;

      preparedItems.push({
        foodItemId: item.foodItemId || null,
        foodNameSnapshot: foodName,
        quantityG: item.quantityG,
        caloriesSnapshot,
        proteinSnapshot,
        carbsSnapshot,
        fatSnapshot,
      });
    }

    const meal = await this.prisma.mealLog.create({
      data: {
        userId,
        mealType: dto.mealType,
        consumedAt,
        note: dto.note || null,
        mealItems: {
          create: preparedItems,
        },
      },
      include: {
        mealItems: true,
      },
    });

    const totalCalories = meal.mealItems.reduce((sum, item) => sum + Number(item.caloriesSnapshot || 0), 0);
    const totalProtein = meal.mealItems.reduce((sum, item) => sum + Number(item.proteinSnapshot || 0), 0);
    const totalCarbs = meal.mealItems.reduce((sum, item) => sum + Number(item.carbsSnapshot || 0), 0);
    const totalFat = meal.mealItems.reduce((sum, item) => sum + Number(item.fatSnapshot || 0), 0);

    return {
      ...meal,
      totalNutrition: {
        calories: Math.round(totalCalories * 10) / 10,
        proteinG: Math.round(totalProtein * 10) / 10,
        carbsG: Math.round(totalCarbs * 10) / 10,
        fatG: Math.round(totalFat * 10) / 10,
      },
    };
  }

  /**
   * Thống kê dinh dưỡng hôm nay theo múi giờ người dùng
   */
  async getToday(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    const userTz = user?.timezone || 'Asia/Ho_Chi_Minh';

    const nowInUserTz = dayjs().tz(userTz);
    const startOfDay = nowInUserTz.startOf('day').toDate();
    const endOfDay = nowInUserTz.endOf('day').toDate();

    const goal = await this.prisma.healthGoal.findFirst({
      where: {
        userId,
        goalType: 'CALORIES',
        isActive: true,
      },
    });
    const targetCalories = goal ? Number(goal.targetValue) : DEFAULT_CALORIES_GOAL;

    const meals = await this.prisma.mealLog.findMany({
      where: {
        userId,
        consumedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        mealItems: true,
      },
      orderBy: { consumedAt: 'asc' },
    });

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    const mealsByType: Record<string, any[]> = {
      BREAKFAST: [],
      LUNCH: [],
      DINNER: [],
      SNACK: [],
    };

    for (const meal of meals) {
      const mealCalories = meal.mealItems.reduce((s, i) => s + Number(i.caloriesSnapshot || 0), 0);
      const mealProtein = meal.mealItems.reduce((s, i) => s + Number(i.proteinSnapshot || 0), 0);
      const mealCarbs = meal.mealItems.reduce((s, i) => s + Number(i.carbsSnapshot || 0), 0);
      const mealFat = meal.mealItems.reduce((s, i) => s + Number(i.fatSnapshot || 0), 0);

      totalCalories += mealCalories;
      totalProtein += mealProtein;
      totalCarbs += mealCarbs;
      totalFat += mealFat;

      const formattedMeal = {
        ...meal,
        totalCalories: Math.round(mealCalories * 10) / 10,
        totalProtein: Math.round(mealProtein * 10) / 10,
        totalCarbs: Math.round(mealCarbs * 10) / 10,
        totalFat: Math.round(mealFat * 10) / 10,
      };

      if (mealsByType[meal.mealType]) {
        mealsByType[meal.mealType].push(formattedMeal);
      }
    }

    const percentage = targetCalories > 0 ? Math.round((totalCalories / targetCalories) * 1000) / 10 : 0;

    return {
      date: nowInUserTz.format('YYYY-MM-DD'),
      timezone: userTz,
      summary: {
        totalCalories: Math.round(totalCalories * 10) / 10,
        targetCalories,
        percentage,
        progress: Math.min(percentage, 100),
        remainingCalories: Math.max(0, targetCalories - totalCalories),
        macros: {
          proteinG: Math.round(totalProtein * 10) / 10,
          carbsG: Math.round(totalCarbs * 10) / 10,
          fatG: Math.round(totalFat * 10) / 10,
        },
      },
      mealsByType,
      totalMeals: meals.length,
    };
  }

  /**
   * Lịch sử bữa ăn theo khoảng ngày
   */
  async getHistory(userId: string, query: MealHistoryQueryDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    const userTz = user?.timezone || 'Asia/Ho_Chi_Minh';

    const endDay = query.endDate ? dayjs(query.endDate).tz(userTz).endOf('day') : dayjs().tz(userTz).endOf('day');
    const startDay = query.startDate
      ? dayjs(query.startDate).tz(userTz).startOf('day')
      : endDay.subtract(6, 'day').startOf('day');

    const meals = await this.prisma.mealLog.findMany({
      where: {
        userId,
        consumedAt: {
          gte: startDay.toDate(),
          lte: endDay.toDate(),
        },
        ...(query.mealType && { mealType: query.mealType }),
      },
      include: {
        mealItems: true,
      },
      orderBy: { consumedAt: 'desc' },
    });

    const formattedMeals = meals.map(meal => {
      const calories = meal.mealItems.reduce((s, i) => s + Number(i.caloriesSnapshot || 0), 0);
      return {
        ...meal,
        totalCalories: Math.round(calories * 10) / 10,
      };
    });

    return {
      startDate: startDay.format('YYYY-MM-DD'),
      endDate: endDay.format('YYYY-MM-DD'),
      totalMeals: meals.length,
      meals: formattedMeals,
    };
  }

  /**
   * Xem chi tiết một bữa ăn
   */
  async getMeal(userId: string, id: string) {
    const meal = await this.prisma.mealLog.findUnique({
      where: { id },
      include: { mealItems: true },
    });

    if (!meal) {
      throw new NotFoundException('Bữa ăn không tồn tại.');
    }

    if (meal.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xem bữa ăn của người khác (BR-NUT-07).');
    }

    const totalCalories = meal.mealItems.reduce((sum, item) => sum + Number(item.caloriesSnapshot || 0), 0);

    return {
      ...meal,
      totalCalories: Math.round(totalCalories * 10) / 10,
    };
  }

  /**
   * Xóa bữa ăn
   */
  async deleteMeal(userId: string, id: string) {
    const meal = await this.prisma.mealLog.findUnique({
      where: { id },
    });

    if (!meal) {
      throw new NotFoundException('Bữa ăn không tồn tại.');
    }

    if (meal.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa bữa ăn của người khác (BR-NUT-07).');
    }

    await this.prisma.mealLog.delete({ where: { id } });
    return { message: 'Đã xóa bữa ăn thành công.' };
  }
}
