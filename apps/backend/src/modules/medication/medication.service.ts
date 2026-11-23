import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMedicationDto } from './dto/create-medication.dto';
import { UpdateMedicationDto } from './dto/update-medication.dto';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { ConfirmMedicationLogDto } from './dto/confirm-medication-log.dto';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class MedicationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper chuyển chuỗi "HH:mm" thành Date object cho kiểu @db.Time
   */
  private parseTimeStringToTimeDate(timeStr: string): Date {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date(Date.UTC(1970, 0, 1, hours, minutes, 0));
    return date;
  }

  /**
   * BR-MED-01, 02, 03, 04: Tạo thuốc mới kèm lịch uống ban đầu nếu có
   */
  async create(userId: string, dto: CreateMedicationDto) {
    if (dto.schedules && dto.schedules.length > 0) {
      for (const s of dto.schedules) {
        if (s.startDate && s.endDate) {
          const start = new Date(s.startDate);
          const end = new Date(s.endDate);
          if (end < start) {
            throw new BadRequestException('Thời gian kết thúc không được trước thời gian bắt đầu (BR-MED-03).');
          }
        }
      }
    }

    return this.prisma.medication.create({
      data: {
        userId,
        name: dto.name,
        dosageLabel: dto.dosageLabel || null,
        note: dto.note || null,
        schedules: dto.schedules && dto.schedules.length > 0
          ? {
              create: dto.schedules.map(s => ({
                frequency: s.frequency,
                reminderTime: this.parseTimeStringToTimeDate(s.reminderTime),
                weekdays: s.weekdays || [],
                intervalDays: s.intervalDays || null,
                startDate: s.startDate ? new Date(s.startDate) : new Date(),
                endDate: s.endDate ? new Date(s.endDate) : null,
              })),
            }
          : undefined,
      },
      include: {
        schedules: true,
      },
    });
  }

  /**
   * Lấy danh sách thuốc của người dùng
   */
  async findAll(userId: string) {
    return this.prisma.medication.findMany({
      where: { userId },
      include: {
        schedules: {
          where: { isEnabled: true },
          orderBy: { reminderTime: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Xem chi tiết một loại thuốc
   */
  async findOne(userId: string, id: string) {
    const med = await this.prisma.medication.findUnique({
      where: { id },
      include: {
        schedules: {
          include: {
            logs: {
              take: 10,
              orderBy: { scheduledAt: 'desc' },
            },
          },
        },
      },
    });

    if (!med) {
      throw new NotFoundException('Thuốc không tồn tại.');
    }

    if (med.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền truy cập thuốc này.');
    }

    return med;
  }

  /**
   * Cập nhật thông tin thuốc
   */
  async update(userId: string, id: string, dto: UpdateMedicationDto) {
    const existing = await this.prisma.medication.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Thuốc không tồn tại.');
    }

    if (existing.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền sửa thuốc này.');
    }

    return this.prisma.medication.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.dosageLabel !== undefined && { dosageLabel: dto.dosageLabel }),
        ...(dto.note !== undefined && { note: dto.note }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  /**
   * BR-MED-08: Xóa thuốc hoặc vô hiệu hóa để bảo tồn lịch sử đã uống
   */
  async delete(userId: string, id: string) {
    const existing = await this.prisma.medication.findUnique({
      where: { id },
      include: {
        schedules: {
          include: {
            _count: { select: { logs: true } },
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Thuốc không tồn tại.');
    }

    if (existing.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa thuốc này.');
    }

    const totalLogs = existing.schedules.reduce((sum, s) => sum + s._count.logs, 0);

    if (totalLogs > 0) {
      // Bảo tồn lịch sử: chuyển isActive = false và vô hiệu hóa các schedule
      await this.prisma.$transaction([
        this.prisma.medication.update({
          where: { id },
          data: { isActive: false },
        }),
        this.prisma.medicationSchedule.updateMany({
          where: { medicationId: id },
          data: { isEnabled: false },
        }),
      ]);
      return { message: 'Thuốc đã có lịch sử uống nên đã được chuyển sang trạng thái ngưng sử dụng (BR-MED-08).' };
    } else {
      // Chưa có lịch sử: xóa sạch các schedule rỗng và thuốc
      await this.prisma.medicationSchedule.deleteMany({ where: { medicationId: id } });
      await this.prisma.medication.delete({ where: { id } });
      return { message: 'Đã xóa thuốc thành công.' };
    }
  }

  /**
   * Thêm lịch uống cho một loại thuốc
   */
  async addSchedule(userId: string, medicationId: string, dto: CreateScheduleDto) {
    const med = await this.prisma.medication.findUnique({ where: { id: medicationId } });

    if (!med) {
      throw new NotFoundException('Thuốc không tồn tại.');
    }

    if (med.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền thêm lịch cho thuốc này.');
    }

    if (dto.startDate && dto.endDate) {
      const start = new Date(dto.startDate);
      const end = new Date(dto.endDate);
      if (end < start) {
        throw new BadRequestException('Thời gian kết thúc không được trước thời gian bắt đầu (BR-MED-03).');
      }
    }

    return this.prisma.medicationSchedule.create({
      data: {
        medicationId,
        frequency: dto.frequency,
        reminderTime: this.parseTimeStringToTimeDate(dto.reminderTime),
        weekdays: dto.weekdays || [],
        intervalDays: dto.intervalDays || null,
        startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      },
    });
  }

  /**
   * BR-MED-05, BR-MED-06, BR-MED-07: Xác nhận uống thuốc hoặc bỏ qua
   */
  async confirmLog(userId: string, dto: ConfirmMedicationLogDto) {
    const schedule = await this.prisma.medicationSchedule.findUnique({
      where: { id: dto.scheduleId },
      include: { medication: true },
    });

    if (!schedule) {
      throw new NotFoundException('Lịch nhắc uống thuốc không tồn tại (BR-MED-05).');
    }

    if (schedule.medication.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền ghi nhận lịch thuốc của người khác.');
    }

    const scheduledAt = new Date(dto.scheduledAt);
    const takenAt = dto.status === 'TAKEN' ? (dto.takenAt ? new Date(dto.takenAt) : new Date()) : null;

    // Upsert trên cặp duy nhất [scheduleId, scheduledAt]
    return this.prisma.medicationLog.upsert({
      where: {
        scheduleId_scheduledAt: {
          scheduleId: dto.scheduleId,
          scheduledAt,
        },
      },
      create: {
        scheduleId: dto.scheduleId,
        scheduledAt,
        takenAt,
        status: dto.status,
        note: dto.note || null,
      },
      update: {
        takenAt,
        status: dto.status,
        note: dto.note || null,
      },
    });
  }

  /**
   * Lấy danh sách lịch thuốc trong ngày hôm nay kèm trạng thái
   */
  async getTodaySchedule(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    const userTz = user?.timezone || 'Asia/Ho_Chi_Minh';
    const nowInUserTz = dayjs().tz(userTz);
    const todayDate = nowInUserTz.toDate();
    const dayOfWeek = nowInUserTz.day() === 0 ? 7 : nowInUserTz.day(); // 1 = Mon ... 7 = Sun

    const startOfDay = nowInUserTz.startOf('day').toDate();
    const endOfDay = nowInUserTz.endOf('day').toDate();

    const medications = await this.prisma.medication.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        schedules: {
          where: {
            isEnabled: true,
            startDate: { lte: todayDate },
            OR: [
              { endDate: null },
              { endDate: { gte: todayDate } },
            ],
          },
          include: {
            logs: {
              where: {
                scheduledAt: {
                  gte: startOfDay,
                  lte: endOfDay,
                },
              },
            },
          },
        },
      },
    });

    const reminders: any[] = [];

    for (const med of medications) {
      for (const schedule of med.schedules) {
        // Kiểm tra xem hôm nay có cần nhắc không theo tần suất
        let appliesToday = false;
        if (schedule.frequency === 'DAILY') {
          appliesToday = true;
        } else if (schedule.frequency === 'WEEKLY') {
          appliesToday = schedule.weekdays.includes(dayOfWeek);
        } else {
          appliesToday = true;
        }

        if (appliesToday) {
          const log = schedule.logs.length > 0 ? schedule.logs[0] : null;
          const reminderTime = dayjs(schedule.reminderTime).utc().format('HH:mm');

          reminders.push({
            medicationId: med.id,
            medicationName: med.name,
            dosageLabel: med.dosageLabel,
            scheduleId: schedule.id,
            reminderTime,
            status: log ? log.status : 'PENDING',
            takenAt: log ? log.takenAt : null,
            logId: log ? log.id : null,
          });
        }
      }
    }

    // Sắp xếp theo giờ nhắc
    reminders.sort((a, b) => a.reminderTime.localeCompare(b.reminderTime));

    const totalCount = reminders.length;
    const takenCount = reminders.filter(r => r.status === 'TAKEN').length;

    return {
      date: nowInUserTz.format('YYYY-MM-DD'),
      totalCount,
      takenCount,
      remainingCount: totalCount - takenCount,
      reminders,
    };
  }
}
