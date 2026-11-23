import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tổng hợp toàn bộ dữ liệu sức khỏe trang chủ cho ngày hôm nay
   */
  async getTodaySummary(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        timezone: true,
        healthProfile: true,
      },
    });

    const userTz = user?.timezone || 'Asia/Ho_Chi_Minh';
    const nowInUserTz = dayjs().tz(userTz);
    const startOfDay = nowInUserTz.startOf('day').toDate();
    const endOfDay = nowInUserTz.endOf('day').toDate();

    // 1. BMI Calculation
    const height = user?.healthProfile?.heightCm ? Number(user.healthProfile.heightCm) : null;
    const weight = user?.healthProfile?.weightKg ? Number(user.healthProfile.weightKg) : null;
    let bmi: number | null = null;
    let bmiCategory = 'Chưa có dữ liệu';
    if (height && weight && height > 0 && weight > 0) {
      const heightM = height / 100;
      bmi = Math.round((weight / (heightM * heightM)) * 10) / 10;
      if (bmi < 18.5) bmiCategory = 'Gầy';
      else if (bmi < 23.0) bmiCategory = 'Bình thường';
      else if (bmi < 25.0) bmiCategory = 'Thừa cân';
      else bmiCategory = 'Béo phì';
    }

    // 2. Fetch User Goals
    const goals = await this.prisma.healthGoal.findMany({
      where: { userId, isActive: true },
    });
    const waterGoal = goals.find(g => g.goalType === 'WATER');
    const sleepGoal = goals.find(g => g.goalType === 'SLEEP');
    const stepsGoal = goals.find(g => g.goalType === 'STEPS');
    const activityGoal = goals.find(g => g.goalType === 'ACTIVITY_DURATION');
    const caloriesGoal = goals.find(g => g.goalType === 'CALORIES');

    // 3. Water Today
    const targetWaterMl = waterGoal ? Number(waterGoal.targetValue) : 2000;
    const waterLogs = await this.prisma.waterLog.findMany({
      where: {
        userId,
        consumedAt: { gte: startOfDay, lte: endOfDay },
      },
      select: { amountMl: true },
    });
    const totalWaterMl = waterLogs.reduce((sum, l) => sum + l.amountMl, 0);
    const waterPercentage = targetWaterMl > 0 ? Math.round((totalWaterMl / targetWaterMl) * 1000) / 10 : 0;

    // 4. Sleep Latest
    const targetSleepHours = sleepGoal ? Number(sleepGoal.targetValue) : 8;
    const latestSleep = await this.prisma.sleepLog.findFirst({
      where: { userId },
      orderBy: { sleepStart: 'desc' },
    });
    const sleepDurationHours = latestSleep ? Math.round((latestSleep.durationMinutes / 60) * 10) / 10 : 0;
    const sleepPercentage = targetSleepHours > 0 ? Math.round((sleepDurationHours / targetSleepHours) * 1000) / 10 : 0;

    // 5. Activity Today (Tích hợp Module 3: Daily Summary + Workout Sessions + Pedometer)
    const targetSteps = stepsGoal ? Number(stepsGoal.targetValue) : 6000;
    const targetMinutes = activityGoal ? Number(activityGoal.targetValue) : 30;
    const activityDate = nowInUserTz.format('YYYY-MM-DD');

    const [dailySummary, sessions, activityLogs] = await Promise.all([
      this.prisma.activityDailySummary.findUnique({
        where: {
          userId_activityDate: {
            userId,
            activityDate,
          },
        },
      }),
      this.prisma.activitySession.findMany({
        where: {
          userId,
          status: 'COMPLETED',
          startedAt: { gte: startOfDay, lte: endOfDay },
        },
      }),
      this.prisma.activityLog.findMany({
        where: {
          userId,
          recordedAt: { gte: startOfDay, lte: endOfDay },
        },
        select: { steps: true, durationMinutes: true },
      }),
    ]);

    const sessionsSteps = sessions.reduce((sum, s) => sum + (s.steps || 0), 0);
    const sessionsMinutes = sessions.reduce((sum, s) => sum + Math.round((s.durationSeconds || 0) / 60), 0);
    const legacySteps = activityLogs.reduce((sum, a) => sum + (a.steps || 0), 0);
    const legacyMinutes = activityLogs.reduce((sum, a) => sum + (a.durationMinutes || 0), 0);

    const totalSteps = Math.max(dailySummary?.steps || 0, sessionsSteps, legacySteps);
    const totalMinutes = Math.max(
      dailySummary ? Math.round(dailySummary.activeSeconds / 60) : 0,
      sessionsMinutes,
      legacyMinutes
    );
    const activityCalories = Math.max(
      dailySummary ? Number(dailySummary.caloriesKcal) : 0,
      sessions.reduce((sum, s) => sum + (s.caloriesKcal ? Number(s.caloriesKcal) : 0), 0),
      Math.round(totalSteps * 0.045 + totalMinutes * 6)
    );
    const distanceKm = dailySummary
      ? Math.round((Number(dailySummary.distanceMeters) / 1000) * 100) / 100
      : Math.round((totalSteps * 0.00072) * 100) / 100;

    const stepsProgress = targetSteps > 0 ? Math.min(Math.round((totalSteps / targetSteps) * 100), 100) : 0;
    const durationProgress = targetMinutes > 0 ? Math.min(Math.round((totalMinutes / targetMinutes) * 100), 100) : 0;

    // 6. Nutrition Today
    const targetCalories = caloriesGoal ? Number(caloriesGoal.targetValue) : 2000;
    const meals = await this.prisma.mealLog.findMany({
      where: {
        userId,
        consumedAt: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        mealItems: {
          select: {
            caloriesSnapshot: true,
            proteinSnapshot: true,
            carbsSnapshot: true,
            fatSnapshot: true,
          },
        },
      },
    });

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    for (const m of meals) {
      for (const item of m.mealItems) {
        totalCalories += Number(item.caloriesSnapshot || 0);
        totalProtein += Number(item.proteinSnapshot || 0);
        totalCarbs += Number(item.carbsSnapshot || 0);
        totalFat += Number(item.fatSnapshot || 0);
      }
    }

    const caloriesProgress = targetCalories > 0 ? Math.min(Math.round((totalCalories / targetCalories) * 100), 100) : 0;

    // 7. Medications Today
    const medications = await this.prisma.medication.findMany({
      where: { userId, isActive: true },
      include: {
        schedules: {
          where: { isEnabled: true },
          include: {
            logs: {
              where: { scheduledAt: { gte: startOfDay, lte: endOfDay } },
            },
          },
        },
      },
    });

    let totalMeds = 0;
    let takenMeds = 0;
    const pendingMedsList: any[] = [];

    for (const med of medications) {
      for (const s of med.schedules) {
        totalMeds += 1;
        const log = s.logs.length > 0 ? s.logs[0] : null;
        if (log && log.status === 'TAKEN') {
          takenMeds += 1;
        } else {
          pendingMedsList.push({
            medicationName: med.name,
            dosageLabel: med.dosageLabel,
            reminderTime: dayjs(s.reminderTime).utc().format('HH:mm'),
          });
        }
      }
    }

    pendingMedsList.sort((a, b) => a.reminderTime.localeCompare(b.reminderTime));

    return {
      date: nowInUserTz.format('YYYY-MM-DD'),
      user: {
        id: user?.id,
        fullName: user?.fullName,
        avatarUrl: user?.healthProfile?.avatarUrl,
        bmi,
        bmiCategory,
      },
      water: {
        totalMl: totalWaterMl,
        targetMl: targetWaterMl,
        percentage: waterPercentage,
        progress: Math.min(waterPercentage, 100),
        remainingMl: Math.max(0, targetWaterMl - totalWaterMl),
        isGoalReached: totalWaterMl >= targetWaterMl,
      },
      sleep: {
        latestDurationHours: sleepDurationHours,
        targetHours: targetSleepHours,
        percentage: sleepPercentage,
        progress: Math.min(sleepPercentage, 100),
        quality: latestSleep?.quality || null,
        isGoalReached: sleepDurationHours >= targetSleepHours,
      },
      activity: {
        totalSteps,
        targetSteps,
        stepsProgress,
        totalMinutes,
        targetMinutes,
        durationProgress,
        caloriesKcal: activityCalories,
        distanceKm,
      },
      nutrition: {
        totalCalories: Math.round(totalCalories * 10) / 10,
        targetCalories,
        progress: caloriesProgress,
        remainingCalories: Math.max(0, targetCalories - totalCalories),
        macros: {
          proteinG: Math.round(totalProtein * 10) / 10,
          carbsG: Math.round(totalCarbs * 10) / 10,
          fatG: Math.round(totalFat * 10) / 10,
        },
      },
      medications: {
        totalToday: totalMeds,
        takenToday: takenMeds,
        remainingToday: totalMeds - takenMeds,
        nextReminder: pendingMedsList.length > 0 ? pendingMedsList[0] : null,
      },
    };
  }
}
