import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateActivityLogDto } from './dto/create-activity-log.dto';
import { UpdateActivityLogDto } from './dto/update-activity-log.dto';
import { ActivityHistoryQueryDto } from './dto/activity-history-query.dto';
import { SyncDailyActivityDto } from './dto/sync-daily-activity.dto';
import { CreateWorkoutSessionDto } from './dto/create-workout-session.dto';
import { FinishWorkoutSessionDto } from './dto/finish-workout-session.dto';
import { UpdateActivityGoalDto } from './dto/activity-goal.dto';
import { DataSource, SessionStatus, ActivityType } from '@prisma/client';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_STEPS_GOAL = 6000;
const DEFAULT_ACTIVITY_MINUTES_GOAL = 30;

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  // =========================================================================
  // 1. DAILY ACTIVITY TRACKING (BR-ACT-01 -> 05)
  // =========================================================================

  /**
   * Đồng bộ số bước từ Native Sensor (Idempotent theo userId + activityDate)
   */
  async syncDaily(userId: string, dto: SyncDailyActivityDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    const userTz = dto.timezone || user?.timezone || 'Asia/Ho_Chi_Minh';

    // Tính toán ước tính distance và calories nếu client chưa truyền
    let distanceMeters = dto.distanceMeters;
    if (distanceMeters === undefined || distanceMeters === null) {
      // Stride length ~ 0.72m
      distanceMeters = Math.round(dto.steps * 0.72 * 100) / 100;
    }

    let caloriesKcal = dto.caloriesKcal;
    if (caloriesKcal === undefined || caloriesKcal === null) {
      // ~ 0.045 kcal/step
      caloriesKcal = Math.round(dto.steps * 0.045 * 100) / 100;
    }

    const activeSeconds = dto.activeSeconds ?? Math.round((dto.steps / 100) * 60);

    const summary = await this.prisma.activityDailySummary.upsert({
      where: {
        userId_activityDate: {
          userId,
          activityDate: dto.activityDate,
        },
      },
      create: {
        userId,
        activityDate: dto.activityDate,
        timezone: userTz,
        steps: dto.steps,
        distanceMeters,
        activeSeconds,
        caloriesKcal,
        dataSource: dto.dataSource || DataSource.SENSOR,
        lastSyncedAt: new Date(),
      },
      update: {
        steps: dto.steps,
        distanceMeters,
        activeSeconds,
        caloriesKcal,
        dataSource: dto.dataSource || DataSource.SENSOR,
        timezone: userTz,
        lastSyncedAt: new Date(),
      },
    });

    return summary;
  }

  /**
   * Lấy tổng kết ngày (ActivityDailySummary)
   */
  async getDailySummary(userId: string, date?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    const userTz = user?.timezone || 'Asia/Ho_Chi_Minh';
    const targetDate = date || dayjs().tz(userTz).format('YYYY-MM-DD');

    // Lấy mục tiêu từ HealthGoal
    const goals = await this.prisma.healthGoal.findMany({
      where: {
        userId,
        goalType: { in: ['STEPS', 'ACTIVITY_DURATION'] },
        isActive: true,
      },
    });

    const stepsGoal = goals.find(g => g.goalType === 'STEPS');
    const targetSteps = stepsGoal ? Number(stepsGoal.targetValue) : DEFAULT_STEPS_GOAL;

    const durationGoal = goals.find(g => g.goalType === 'ACTIVITY_DURATION');
    const targetMinutes = durationGoal ? Number(durationGoal.targetValue) : DEFAULT_ACTIVITY_MINUTES_GOAL;

    const startOfDay = dayjs(targetDate).tz(userTz).startOf('day').toDate();
    const endOfDay = dayjs(targetDate).tz(userTz).endOf('day').toDate();

    const [summary, sessions, legacyLogs] = await Promise.all([
      this.prisma.activityDailySummary.findUnique({
        where: {
          userId_activityDate: {
            userId,
            activityDate: targetDate,
          },
        },
      }),
      this.prisma.activitySession.findMany({
        where: {
          userId,
          status: SessionStatus.COMPLETED,
          startedAt: { gte: startOfDay, lte: endOfDay },
        },
        orderBy: { startedAt: 'desc' },
      }),
      this.prisma.activityLog.findMany({
        where: {
          userId,
          recordedAt: { gte: startOfDay, lte: endOfDay },
        },
        orderBy: { recordedAt: 'desc' },
      }),
    ]);

    // Tổng hợp từ các phiên tập workout đã hoàn thành trong ngày
    const sessionsSteps = sessions.reduce((acc, s) => acc + (s.steps || 0), 0);
    const sessionsSeconds = sessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
    const sessionsDistanceMeters = sessions.reduce((acc, s) => acc + (s.distanceMeters ? Number(s.distanceMeters) : 0), 0);
    const sessionsCalories = sessions.reduce((acc, s) => acc + (s.caloriesKcal ? Number(s.caloriesKcal) : 0), 0);

    // Dữ liệu hợp nhất (Hợp nhất Pedometer nền và Session, không double-count nếu Pedometer đã đếm lớn hơn)
    const steps = Math.max(summary?.steps || 0, sessionsSteps);
    const distanceMeters = Math.max(summary ? Number(summary.distanceMeters) : 0, sessionsDistanceMeters);
    const activeSeconds = Math.max(summary?.activeSeconds || 0, sessionsSeconds);
    const activeMinutes = Math.round(activeSeconds / 60);
    const caloriesKcal = Math.max(summary ? Number(summary.caloriesKcal) : 0, sessionsCalories);

    const stepsPercentage = targetSteps > 0 ? Math.round((steps / targetSteps) * 1000) / 10 : 0;
    const durationPercentage = targetMinutes > 0 ? Math.round((activeMinutes / targetMinutes) * 1000) / 10 : 0;

    // Chuyển đổi sessions thành format log để UI hiển thị ở mục "Hoạt động đã hoàn thành"
    const sessionLogs = sessions.map((s) => ({
      id: s.id,
      activityType: s.activityType,
      steps: s.steps,
      durationMinutes: Math.round(s.durationSeconds / 60) || 1,
      source: DataSource.SENSOR,
      caloriesKcal: s.caloriesKcal ? Number(s.caloriesKcal) : undefined,
      distanceMeters: s.distanceMeters ? Number(s.distanceMeters) : undefined,
      recordedAt: s.startedAt.toISOString(),
      isSession: true,
    }));

    const logs = [...sessionLogs, ...legacyLogs];

    return {
      date: targetDate,
      timezone: userTz,
      summary: {
        totalSteps: steps,
        targetSteps,
        stepsPercentage,
        stepsProgress: Math.min(stepsPercentage, 100),
        isStepsGoalReached: steps >= targetSteps,
        distanceMeters,
        distanceKm: Math.round((distanceMeters / 1000) * 100) / 100,
        activeSeconds,
        totalMinutes: activeMinutes,
        targetMinutes,
        durationPercentage,
        durationProgress: Math.min(durationPercentage, 100),
        isDurationGoalReached: activeMinutes >= targetMinutes,
        caloriesKcal,
        dataSource: summary?.dataSource || (sessions.length > 0 ? 'SENSOR' : 'NO_DATA'),
        lastSyncedAt: summary?.lastSyncedAt || null,
        activitiesCount: logs.length,
      },
      sessions,
      logs,
    };
  }

  /**
   * Lấy mục tiêu bước chân & thời lượng
   */
  async getGoals(userId: string) {
    const goals = await this.prisma.healthGoal.findMany({
      where: {
        userId,
        goalType: { in: ['STEPS', 'ACTIVITY_DURATION'] },
        isActive: true,
      },
    });

    const stepsGoal = goals.find(g => g.goalType === 'STEPS');
    const durationGoal = goals.find(g => g.goalType === 'ACTIVITY_DURATION');

    return {
      targetSteps: stepsGoal ? Number(stepsGoal.targetValue) : DEFAULT_STEPS_GOAL,
      targetMinutes: durationGoal ? Number(durationGoal.targetValue) : DEFAULT_ACTIVITY_MINUTES_GOAL,
    };
  }

  /**
   * Cập nhật mục tiêu bước chân
   */
  async updateGoals(userId: string, dto: UpdateActivityGoalDto) {
    const existingSteps = await this.prisma.healthGoal.findFirst({
      where: { userId, goalType: 'STEPS', isActive: true },
    });
    if (existingSteps) {
      await this.prisma.healthGoal.update({
        where: { id: existingSteps.id },
        data: { targetValue: dto.targetSteps },
      });
    } else {
      await this.prisma.healthGoal.create({
        data: {
          userId,
          goalType: 'STEPS',
          targetValue: dto.targetSteps,
          unit: 'bước',
          isActive: true,
        },
      });
    }

    if (dto.targetMinutes !== undefined) {
      const existingDuration = await this.prisma.healthGoal.findFirst({
        where: { userId, goalType: 'ACTIVITY_DURATION', isActive: true },
      });
      if (existingDuration) {
        await this.prisma.healthGoal.update({
          where: { id: existingDuration.id },
          data: { targetValue: dto.targetMinutes },
        });
      } else {
        await this.prisma.healthGoal.create({
          data: {
            userId,
            goalType: 'ACTIVITY_DURATION',
            targetValue: dto.targetMinutes,
            unit: 'phút',
            isActive: true,
          },
        });
      }
    }

    return this.getGoals(userId);
  }

  // =========================================================================
  // 2. WORKOUT SESSION TRACKING
  // =========================================================================

  /**
   * Bắt đầu phiên tập luyện mới
   */
  async createSession(userId: string, dto: CreateWorkoutSessionDto) {
    // Đóng các phiên tập ACTIVE/PAUSED cũ nếu có để tránh phiên ma
    await this.prisma.activitySession.updateMany({
      where: {
        userId,
        status: { in: [SessionStatus.ACTIVE, SessionStatus.PAUSED] },
      },
      data: {
        status: SessionStatus.CANCELLED,
        endedAt: new Date(),
      },
    });

    const startedAt = dto.startedAt ? new Date(dto.startedAt) : new Date();

    const session = await this.prisma.activitySession.create({
      data: {
        userId,
        activityType: dto.activityType,
        status: SessionStatus.ACTIVE,
        startedAt,
        steps: 0,
        durationSeconds: 0,
        pausedSeconds: 0,
        distanceMeters: 0,
        caloriesKcal: 0,
      },
    });

    return session;
  }

  /**
   * Tạm dừng phiên tập
   */
  async pauseSession(userId: string, id: string) {
    const session = await this.prisma.activitySession.findUnique({ where: { id } });
    if (!session) {
      throw new NotFoundException('Phiên tập không tồn tại.');
    }
    if (session.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa phiên tập này.');
    }
    if (session.status !== SessionStatus.ACTIVE) {
      throw new BadRequestException('Chỉ có thể tạm dừng phiên tập đang hoạt động.');
    }

    return this.prisma.activitySession.update({
      where: { id },
      data: { status: SessionStatus.PAUSED },
    });
  }

  /**
   * Tiếp tục phiên tập
   */
  async resumeSession(userId: string, id: string) {
    const session = await this.prisma.activitySession.findUnique({ where: { id } });
    if (!session) {
      throw new NotFoundException('Phiên tập không tồn tại.');
    }
    if (session.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa phiên tập này.');
    }
    if (session.status !== SessionStatus.PAUSED) {
      throw new BadRequestException('Chỉ có thể tiếp tục phiên tập đang tạm dừng.');
    }

    return this.prisma.activitySession.update({
      where: { id },
      data: { status: SessionStatus.ACTIVE },
    });
  }

  /**
   * Hoàn thành phiên tập luyện
   */
  async finishSession(userId: string, id: string, dto: FinishWorkoutSessionDto) {
    const session = await this.prisma.activitySession.findUnique({ where: { id } });
    if (!session) {
      throw new NotFoundException('Phiên tập không tồn tại.');
    }
    if (session.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa phiên tập này.');
    }
    if (session.status === SessionStatus.COMPLETED) {
      return session; // Idempotent
    }

    const endedAt = dto.endedAt ? new Date(dto.endedAt) : new Date();

    const updated = await this.prisma.activitySession.update({
      where: { id },
      data: {
        status: SessionStatus.COMPLETED,
        endedAt,
        steps: dto.steps,
        durationSeconds: dto.durationSeconds,
        pausedSeconds: dto.pausedSeconds || 0,
        distanceMeters: dto.distanceMeters || 0,
        caloriesKcal: dto.caloriesKcal || 0,
        averagePace: dto.averagePace !== undefined ? dto.averagePace : null,
      },
    });

    // Tự động đồng bộ và cộng dồn vào ActivityDailySummary của ngày hôm đó
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { timezone: true },
      });
      const userTz = user?.timezone || 'Asia/Ho_Chi_Minh';
      const activityDate = dayjs(session.startedAt).tz(userTz).format('YYYY-MM-DD');

      const existingSummary = await this.prisma.activityDailySummary.findUnique({
        where: {
          userId_activityDate: { userId, activityDate },
        },
      });

      const newSteps = (existingSummary?.steps || 0) + (dto.steps || 0);
      const newDistance = (existingSummary ? Number(existingSummary.distanceMeters) : 0) + (dto.distanceMeters || 0);
      const newActiveSeconds = (existingSummary?.activeSeconds || 0) + (dto.durationSeconds || 0);
      const newCalories = Math.round(((existingSummary ? Number(existingSummary.caloriesKcal) : 0) + (dto.caloriesKcal || 0)) * 10) / 10;

      await this.prisma.activityDailySummary.upsert({
        where: {
          userId_activityDate: { userId, activityDate },
        },
        create: {
          userId,
          activityDate,
          steps: newSteps,
          distanceMeters: newDistance,
          activeSeconds: newActiveSeconds,
          caloriesKcal: newCalories,
          dataSource: DataSource.SENSOR,
          timezone: userTz,
          lastSyncedAt: new Date(),
        },
        update: {
          steps: newSteps,
          distanceMeters: newDistance,
          activeSeconds: newActiveSeconds,
          caloriesKcal: newCalories,
          lastSyncedAt: new Date(),
        },
      });
    } catch (e) {
      console.warn('[ActivityService] Lỗi tự động cập nhật ActivityDailySummary sau khi kết thúc phiên:', e);
    }

    return updated;
  }

  /**
   * Lấy danh sách các phiên tập của người dùng
   */
  async getSessions(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [sessions, total] = await Promise.all([
      this.prisma.activitySession.findMany({
        where: { userId },
        orderBy: { startedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.activitySession.count({ where: { userId } }),
    ]);

    return {
      data: sessions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Chi tiết một phiên tập
   */
  async getSessionById(userId: string, id: string) {
    const session = await this.prisma.activitySession.findUnique({ where: { id } });
    if (!session) {
      throw new NotFoundException('Phiên tập không tồn tại.');
    }
    if (session.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xem phiên tập của người khác.');
    }
    return session;
  }

  // =========================================================================
  // 3. LEGACY ACTIVITY LOGS COMPATIBILITY (Không phá vỡ API cũ)
  // =========================================================================

  async create(userId: string, dto: CreateActivityLogDto) {
    const recordedAt = dto.recordedAt ? new Date(dto.recordedAt) : new Date();
    const source = dto.source || DataSource.MANUAL;

    if (source !== DataSource.MANUAL && dto.externalId) {
      const existing = await this.prisma.activityLog.findFirst({
        where: { userId, source, externalId: dto.externalId },
      });

      if (existing) {
        return this.prisma.activityLog.update({
          where: { id: existing.id },
          data: {
            activityType: dto.activityType,
            steps: dto.steps !== undefined ? dto.steps : existing.steps,
            durationMinutes: dto.durationMinutes !== undefined ? dto.durationMinutes : existing.durationMinutes,
            recordedAt,
          },
        });
      }
    }

    const log = await this.prisma.activityLog.create({
      data: {
        userId,
        activityType: dto.activityType,
        steps: dto.steps || null,
        durationMinutes: dto.durationMinutes || null,
        source,
        externalId: dto.externalId || null,
        recordedAt,
      },
    });

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { timezone: true },
      });
      const userTz = user?.timezone || 'Asia/Ho_Chi_Minh';
      const activityDate = dayjs(recordedAt).tz(userTz).format('YYYY-MM-DD');

      const existingSummary = await this.prisma.activityDailySummary.findUnique({
        where: {
          userId_activityDate: { userId, activityDate },
        },
      });

      const addSteps = dto.steps || 0;
      const addSeconds = (dto.durationMinutes || 0) * 60;
      const addCalories = Math.round((dto.durationMinutes || 30) * 7);
      const addDistance = Math.round((addSteps * 0.72) * 100) / 100;

      const newSteps = (existingSummary?.steps || 0) + addSteps;
      const newDistance = (existingSummary ? Number(existingSummary.distanceMeters) : 0) + addDistance;
      const newActiveSeconds = (existingSummary?.activeSeconds || 0) + addSeconds;
      const newCalories = (existingSummary ? Number(existingSummary.caloriesKcal) : 0) + addCalories;

      await this.prisma.activityDailySummary.upsert({
        where: {
          userId_activityDate: { userId, activityDate },
        },
        create: {
          userId,
          activityDate,
          steps: newSteps,
          distanceMeters: newDistance,
          activeSeconds: newActiveSeconds,
          caloriesKcal: newCalories,
          dataSource: source,
          timezone: userTz,
          lastSyncedAt: new Date(),
        },
        update: {
          steps: newSteps,
          distanceMeters: newDistance,
          activeSeconds: newActiveSeconds,
          caloriesKcal: newCalories,
          lastSyncedAt: new Date(),
        },
      });
    } catch (e) {
      console.warn('[ActivityService] Lỗi tự động cập nhật DailySummary khi tạo log:', e);
    }

    return log;
  }

  async getToday(userId: string) {
    return this.getDailySummary(userId);
  }

  async getHistory(userId: string, query: ActivityHistoryQueryDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    const userTz = user?.timezone || 'Asia/Ho_Chi_Minh';

    const endDay = query.endDate ? dayjs(query.endDate).tz(userTz).endOf('day') : dayjs().tz(userTz).endOf('day');
    const startDay = query.startDate
      ? dayjs(query.startDate).tz(userTz).startOf('day')
      : endDay.subtract(6, 'day').startOf('day');

    // Truy vấn song song cả Daily Summaries và Sessions
    const [summaries, sessions] = await Promise.all([
      this.prisma.activityDailySummary.findMany({
        where: {
          userId,
          activityDate: {
            gte: startDay.format('YYYY-MM-DD'),
            lte: endDay.format('YYYY-MM-DD'),
          },
        },
        orderBy: { activityDate: 'asc' },
      }),
      this.prisma.activitySession.findMany({
        where: {
          userId,
          startedAt: {
            gte: startDay.toDate(),
            lte: endDay.toDate(),
          },
          status: SessionStatus.COMPLETED,
        },
        orderBy: { startedAt: 'desc' },
      }),
    ]);

    // Gom theo ngày
    const daysMap = new Map<string, { totalSteps: number; totalMinutes: number; distanceMeters: number; caloriesKcal: number; sessionsCount: number }>();
    let curr = startDay;
    while (curr.isBefore(endDay) || curr.isSame(endDay, 'day')) {
      const dateKey = curr.format('YYYY-MM-DD');
      daysMap.set(dateKey, { totalSteps: 0, totalMinutes: 0, distanceMeters: 0, caloriesKcal: 0, sessionsCount: 0 });
      curr = curr.add(1, 'day');
    }

    for (const s of summaries) {
      if (daysMap.has(s.activityDate)) {
        const item = daysMap.get(s.activityDate)!;
        item.totalSteps = s.steps;
        item.totalMinutes = Math.round(s.activeSeconds / 60);
        item.distanceMeters = Number(s.distanceMeters);
        item.caloriesKcal = Number(s.caloriesKcal);
      }
    }

    for (const sess of sessions) {
      const dateKey = dayjs(sess.startedAt).tz(userTz).format('YYYY-MM-DD');
      if (daysMap.has(dateKey)) {
        daysMap.get(dateKey)!.sessionsCount += 1;
      }
    }

    const history = Array.from(daysMap.entries()).map(([date, data]) => ({
      date,
      totalSteps: data.totalSteps,
      totalMinutes: data.totalMinutes,
      distanceKm: Math.round((data.distanceMeters / 1000) * 100) / 100,
      caloriesKcal: data.caloriesKcal,
      sessionsCount: data.sessionsCount,
    }));

    const totalStepsPeriod = history.reduce((sum, h) => sum + h.totalSteps, 0);
    const totalMinutesPeriod = history.reduce((sum, h) => sum + h.totalMinutes, 0);
    const totalCaloriesPeriod = history.reduce((sum, h) => sum + h.caloriesKcal, 0);

    return {
      startDate: startDay.format('YYYY-MM-DD'),
      endDate: endDay.format('YYYY-MM-DD'),
      summary: {
        totalSteps: totalStepsPeriod,
        totalMinutes: totalMinutesPeriod,
        totalCaloriesBurned: totalCaloriesPeriod,
        daysActive: history.filter(h => h.totalSteps > 0).length,
      },
      history,
      recentSessions: sessions.slice(0, 5),
    };
  }

  async update(userId: string, id: string, dto: UpdateActivityLogDto) {
    const existing = await this.prisma.activityLog.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Bản ghi hoạt động không tồn tại.');
    if (existing.userId !== userId) throw new ForbiddenException('Bạn không có quyền sửa bản ghi của người khác.');

    return this.prisma.activityLog.update({
      where: { id },
      data: {
        ...(dto.activityType && { activityType: dto.activityType }),
        ...(dto.steps !== undefined && { steps: dto.steps }),
        ...(dto.durationMinutes !== undefined && { durationMinutes: dto.durationMinutes }),
        ...(dto.recordedAt && { recordedAt: new Date(dto.recordedAt) }),
      },
    });
  }

  async delete(userId: string, id: string) {
    // 1. Kiểm tra trong ActivityLog
    const existingLog = await this.prisma.activityLog.findUnique({ where: { id } });
    if (existingLog) {
      if (existingLog.userId !== userId) {
        throw new ForbiddenException('Bạn không có quyền xóa bản ghi của người khác.');
      }
      await this.prisma.activityLog.delete({ where: { id } });
      return { message: 'Đã xóa bản ghi hoạt động thành công.' };
    }

    // 2. Nếu không tìm thấy trong ActivityLog, kiểm tra trong ActivitySession (buổi tập thực tế)
    const existingSession = await this.prisma.activitySession.findUnique({ where: { id } });
    if (existingSession) {
      if (existingSession.userId !== userId) {
        throw new ForbiddenException('Bạn không có quyền xóa phiên tập của người khác.');
      }
      await this.prisma.activitySession.delete({ where: { id } });

      // Trừ đi số bước và năng lượng của session bị xóa khỏi DailySummary (nếu có)
      try {
        const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { timezone: true } });
        const userTz = user?.timezone || 'Asia/Ho_Chi_Minh';
        const activityDate = dayjs(existingSession.startedAt).tz(userTz).format('YYYY-MM-DD');
        const summary = await this.prisma.activityDailySummary.findUnique({
          where: { userId_activityDate: { userId, activityDate } },
        });
        if (summary) {
          const updatedSteps = Math.max(0, summary.steps - (existingSession.steps || 0));
          const updatedDistance = Math.max(0, Number(summary.distanceMeters) - (existingSession.distanceMeters ? Number(existingSession.distanceMeters) : 0));
          const updatedActiveSeconds = Math.max(0, summary.activeSeconds - (existingSession.durationSeconds || 0));
          const updatedCalories = Math.max(0, Number(summary.caloriesKcal) - (existingSession.caloriesKcal ? Number(existingSession.caloriesKcal) : 0));
          await this.prisma.activityDailySummary.update({
            where: { id: summary.id },
            data: {
              steps: updatedSteps,
              distanceMeters: updatedDistance,
              activeSeconds: updatedActiveSeconds,
              caloriesKcal: updatedCalories,
              lastSyncedAt: new Date(),
            },
          });
        }
      } catch (e) {
        console.warn('[ActivityService] Lỗi cập nhật DailySummary khi xóa session:', e);
      }

      return { message: 'Đã xóa phiên tập thành công.' };
    }

    throw new NotFoundException('Bản ghi hoạt động không tồn tại.');
  }

  async deleteSession(userId: string, id: string) {
    return this.delete(userId, id);
  }
}
