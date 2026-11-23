import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWaterLogDto } from './dto/create-water-log.dto';
import { UpdateWaterLogDto } from './dto/update-water-log.dto';
import { WaterHistoryQueryDto } from './dto/water-history-query.dto';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_WATER_GOAL_ML = 2000;

@Injectable()
export class WaterService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * BR-WATER-01: Ghi nhận lượng nước uống (> 0 ml)
   */
  async create(userId: string, dto: CreateWaterLogDto) {
    const consumedAt = dto.consumedAt ? new Date(dto.consumedAt) : new Date();

    const waterLog = await this.prisma.waterLog.create({
      data: {
        userId,
        amountMl: dto.amountMl,
        consumedAt,
        note: dto.note,
      },
    });

    return waterLog;
  }

  /**
   * BR-WATER-03, BR-WATER-04, BR-WATER-05: Lấy thống kê nước uống trong ngày hiện tại
   */
  async getToday(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    const userTz = user?.timezone || 'Asia/Ho_Chi_Minh';

    // Xác định ranh giới ngày hôm nay theo timezone của user
    const nowInUserTz = dayjs().tz(userTz);
    const startOfDay = nowInUserTz.startOf('day').toDate();
    const endOfDay = nowInUserTz.endOf('day').toDate();

    // Lấy mục tiêu nước uống đang hoạt động
    const goal = await this.prisma.healthGoal.findFirst({
      where: {
        userId,
        goalType: 'WATER',
        isActive: true,
      },
    });
    const targetMl = goal ? Number(goal.targetValue) : DEFAULT_WATER_GOAL_ML;

    // Lấy tất cả bản ghi hôm nay
    const logs = await this.prisma.waterLog.findMany({
      where: {
        userId,
        consumedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { consumedAt: 'desc' },
    });

    const totalAmountMl = logs.reduce((sum, log) => sum + log.amountMl, 0);
    const rawPercentage = targetMl > 0 ? (totalAmountMl / targetMl) * 100 : 0;
    const percentage = Math.round(rawPercentage * 10) / 10;
    const progress = Math.min(percentage, 100);

    return {
      date: nowInUserTz.format('YYYY-MM-DD'),
      timezone: userTz,
      totalAmountMl,
      targetMl,
      percentage,
      progress,
      remainingMl: Math.max(0, targetMl - totalAmountMl),
      isGoalReached: totalAmountMl >= targetMl,
      logsCount: logs.length,
      logs,
    };
  }

  /**
   * Lấy lịch sử nước uống theo khoảng ngày (mặc định 7 ngày gần nhất)
   */
  async getHistory(userId: string, query: WaterHistoryQueryDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    const userTz = user?.timezone || 'Asia/Ho_Chi_Minh';

    const endDay = query.endDate ? dayjs(query.endDate).tz(userTz).endOf('day') : dayjs().tz(userTz).endOf('day');
    const startDay = query.startDate
      ? dayjs(query.startDate).tz(userTz).startOf('day')
      : endDay.subtract(6, 'day').startOf('day');

    const logs = await this.prisma.waterLog.findMany({
      where: {
        userId,
        consumedAt: {
          gte: startDay.toDate(),
          lte: endDay.toDate(),
        },
      },
      orderBy: { consumedAt: 'asc' },
    });

    // Gom nhóm theo từng ngày
    const goal = await this.prisma.healthGoal.findFirst({
      where: {
        userId,
        goalType: 'WATER',
        isActive: true,
      },
    });
    const targetMl = goal ? Number(goal.targetValue) : DEFAULT_WATER_GOAL_ML;

    const daysMap = new Map<string, { totalAmountMl: number; count: number; logs: typeof logs }>();

    // Khởi tạo các ngày trong khoảng
    let curr = startDay;
    while (curr.isBefore(endDay) || curr.isSame(endDay, 'day')) {
      const dateKey = curr.format('YYYY-MM-DD');
      daysMap.set(dateKey, { totalAmountMl: 0, count: 0, logs: [] });
      curr = curr.add(1, 'day');
    }

    // Điền dữ liệu vào các ngày
    for (const log of logs) {
      const dateKey = dayjs(log.consumedAt).tz(userTz).format('YYYY-MM-DD');
      if (daysMap.has(dateKey)) {
        const item = daysMap.get(dateKey)!;
        item.totalAmountMl += log.amountMl;
        item.count += 1;
        item.logs.push(log);
      }
    }

    const history = Array.from(daysMap.entries()).map(([date, data]) => {
      const percentage = Math.round((targetMl > 0 ? (data.totalAmountMl / targetMl) * 100 : 0) * 10) / 10;
      return {
        date,
        totalAmountMl: data.totalAmountMl,
        targetMl,
        percentage,
        progress: Math.min(percentage, 100),
        isGoalReached: data.totalAmountMl >= targetMl,
        logsCount: data.count,
        logs: data.logs,
      };
    });

    return {
      startDate: startDay.format('YYYY-MM-DD'),
      endDate: endDay.format('YYYY-MM-DD'),
      targetMl,
      history,
    };
  }

  /**
   * BR-WATER-06: Sửa bản ghi của chính mình
   */
  async update(userId: string, id: string, dto: UpdateWaterLogDto) {
    const existing = await this.prisma.waterLog.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Bản ghi nước uống không tồn tại.');
    }

    if (existing.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền sửa bản ghi của người khác (BR-WATER-06).');
    }

    return this.prisma.waterLog.update({
      where: { id },
      data: {
        ...(dto.amountMl !== undefined && { amountMl: dto.amountMl }),
        ...(dto.consumedAt !== undefined && { consumedAt: new Date(dto.consumedAt) }),
        ...(dto.note !== undefined && { note: dto.note }),
      },
    });
  }

  /**
   * BR-WATER-06: Xóa bản ghi của chính mình
   */
  async delete(userId: string, id: string) {
    const existing = await this.prisma.waterLog.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Bản ghi nước uống không tồn tại.');
    }

    if (existing.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa bản ghi của người khác (BR-WATER-06).');
    }

    await this.prisma.waterLog.delete({
      where: { id },
    });

    return { message: 'Đã xóa bản ghi nước uống thành công.' };
  }
}
