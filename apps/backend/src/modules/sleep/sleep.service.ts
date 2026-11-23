import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSleepLogDto } from './dto/create-sleep-log.dto';
import { UpdateSleepLogDto } from './dto/update-sleep-log.dto';
import { SleepHistoryQueryDto } from './dto/sleep-history-query.dto';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_SLEEP_GOAL_HOURS = 8; // 8 tiếng = 480 phút

@Injectable()
export class SleepService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tính toán và thẩm định thời lượng giấc ngủ theo quy tắc BR-SLEEP-01, 02, 03, 05
   */
  private calculateDurationMinutes(start: Date, end: Date): number {
    const startMs = start.getTime();
    const endMs = end.getTime();

    // BR-SLEEP-01: Thời điểm kết thúc phải sau thời điểm bắt đầu xét theo thời gian thực
    if (endMs <= startMs) {
      throw new BadRequestException('Thời điểm thức dậy phải sau thời điểm bắt đầu ngủ (BR-SLEEP-01).');
    }

    // BR-SLEEP-03: Thời lượng ngủ được tính bằng thời điểm kết thúc trừ thời điểm bắt đầu
    const durationMinutes = Math.round((endMs - startMs) / (60 * 1000));

    // BR-SLEEP-05: Không cho phép bản ghi có thời lượng bằng 0 hoặc âm
    if (durationMinutes <= 0) {
      throw new BadRequestException('Thời lượng giấc ngủ phải lớn hơn 0 phút (BR-SLEEP-05).');
    }

    // Giới hạn an toàn: không quá 24 giờ cho 1 giấc ngủ
    if (durationMinutes > 1440) {
      throw new BadRequestException('Thời lượng một giấc ngủ không được vượt quá 24 giờ (1440 phút).');
    }

    return durationMinutes;
  }

  /**
   * Ghi nhận một giấc ngủ mới
   */
  async create(userId: string, dto: CreateSleepLogDto) {
    const sleepStart = new Date(dto.sleepStart);
    const sleepEnd = new Date(dto.sleepEnd);
    const durationMinutes = this.calculateDurationMinutes(sleepStart, sleepEnd);

    const log = await this.prisma.sleepLog.create({
      data: {
        userId,
        sleepStart,
        sleepEnd,
        durationMinutes,
        quality: dto.quality || null,
        note: dto.note || null,
      },
    });

    return {
      ...log,
      durationHours: Math.round((log.durationMinutes / 60) * 10) / 10,
    };
  }

  /**
   * Lấy giấc ngủ gần nhất và so sánh với mục tiêu
   */
  async getLatest(userId: string) {
    const latestLog = await this.prisma.sleepLog.findFirst({
      where: { userId },
      orderBy: { sleepStart: 'desc' },
    });

    const goal = await this.prisma.healthGoal.findFirst({
      where: {
        userId,
        goalType: 'SLEEP',
        isActive: true,
      },
    });

    const targetHours = goal ? Number(goal.targetValue) : DEFAULT_SLEEP_GOAL_HOURS;
    const targetMinutes = targetHours * 60;

    let percentage = 0;
    let durationHours = 0;

    if (latestLog) {
      durationHours = Math.round((latestLog.durationMinutes / 60) * 10) / 10;
      percentage = Math.round((latestLog.durationMinutes / targetMinutes) * 1000) / 10;
    }

    return {
      latestLog: latestLog ? {
        ...latestLog,
        durationHours,
      } : null,
      targetHours,
      targetMinutes,
      percentage,
      progress: Math.min(percentage, 100),
      isGoalReached: latestLog ? latestLog.durationMinutes >= targetMinutes : false,
    };
  }

  /**
   * Lịch sử và phân tích thống kê giấc ngủ
   */
  async getHistory(userId: string, query: SleepHistoryQueryDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    const userTz = user?.timezone || 'Asia/Ho_Chi_Minh';

    const endDay = query.endDate ? dayjs(query.endDate).tz(userTz).endOf('day') : dayjs().tz(userTz).endOf('day');
    const startDay = query.startDate
      ? dayjs(query.startDate).tz(userTz).startOf('day')
      : endDay.subtract(6, 'day').startOf('day');

    const logs = await this.prisma.sleepLog.findMany({
      where: {
        userId,
        sleepStart: {
          gte: startDay.toDate(),
          lte: endDay.toDate(),
        },
      },
      orderBy: { sleepStart: 'desc' },
    });

    const totalMinutes = logs.reduce((sum, log) => sum + log.durationMinutes, 0);
    const averageMinutes = logs.length > 0 ? Math.round(totalMinutes / logs.length) : 0;

    const formattedLogs = logs.map(log => ({
      ...log,
      durationHours: Math.round((log.durationMinutes / 60) * 10) / 10,
    }));

    return {
      startDate: startDay.format('YYYY-MM-DD'),
      endDate: endDay.format('YYYY-MM-DD'),
      totalLogs: logs.length,
      totalHours: Math.round((totalMinutes / 60) * 10) / 10,
      averageHoursPerSleep: Math.round((averageMinutes / 60) * 10) / 10,
      logs: formattedLogs,
    };
  }

  /**
   * Chỉnh sửa bản ghi giấc ngủ của chính mình
   */
  async update(userId: string, id: string, dto: UpdateSleepLogDto) {
    const existing = await this.prisma.sleepLog.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Bản ghi giấc ngủ không tồn tại.');
    }

    if (existing.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền sửa bản ghi của người khác (BR-SLEEP-04).');
    }

    const sleepStart = dto.sleepStart ? new Date(dto.sleepStart) : existing.sleepStart;
    const sleepEnd = dto.sleepEnd ? new Date(dto.sleepEnd) : existing.sleepEnd;
    const durationMinutes = this.calculateDurationMinutes(sleepStart, sleepEnd);

    const updated = await this.prisma.sleepLog.update({
      where: { id },
      data: {
        sleepStart,
        sleepEnd,
        durationMinutes,
        ...(dto.quality !== undefined && { quality: dto.quality }),
        ...(dto.note !== undefined && { note: dto.note }),
      },
    });

    return {
      ...updated,
      durationHours: Math.round((updated.durationMinutes / 60) * 10) / 10,
    };
  }

  /**
   * Xóa bản ghi giấc ngủ của chính mình
   */
  async delete(userId: string, id: string) {
    const existing = await this.prisma.sleepLog.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Bản ghi giấc ngủ không tồn tại.');
    }

    if (existing.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa bản ghi của người khác (BR-SLEEP-04).');
    }

    await this.prisma.sleepLog.delete({
      where: { id },
    });

    return { message: 'Đã xóa bản ghi giấc ngủ thành công.' };
  }
}
