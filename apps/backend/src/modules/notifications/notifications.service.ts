import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateNotificationPreferenceDto } from './dto/update-preference.dto';
import { NotificationType } from '@prisma/client';

const DEFAULT_PREFERENCES: Record<NotificationType, { enabled: boolean; reminderTimes: string[] }> = {
  WATER: { enabled: true, reminderTimes: ['08:00', '11:00', '14:00', '17:00', '20:00'] },
  SLEEP: { enabled: true, reminderTimes: ['22:00'] },
  MEDICATION: { enabled: true, reminderTimes: [] },
  ACTIVITY: { enabled: true, reminderTimes: ['07:00', '18:00'] },
};

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy cấu hình thông báo cho tất cả các loại (tự động khởi tạo mặc định nếu chưa có)
   */
  async getPreferences(userId: string) {
    const existing = await this.prisma.notificationPreference.findMany({
      where: { userId },
    });

    const existingMap = new Map(existing.map(p => [p.notificationType, p]));
    const results: any[] = [];

    for (const type of Object.values(NotificationType)) {
      if (existingMap.has(type)) {
        results.push(existingMap.get(type));
      } else {
        // Tự động tạo bản ghi mặc định
        const defaultSetting = DEFAULT_PREFERENCES[type];
        const created = await this.prisma.notificationPreference.create({
          data: {
            userId,
            notificationType: type,
            enabled: defaultSetting.enabled,
            reminderTimes: defaultSetting.reminderTimes,
          },
        });
        results.push(created);
      }
    }

    return results;
  }

  /**
   * Cập nhật cấu hình thông báo cho một loại
   */
  async updatePreference(userId: string, dto: UpdateNotificationPreferenceDto) {
    return this.prisma.notificationPreference.upsert({
      where: {
        userId_notificationType: {
          userId,
          notificationType: dto.notificationType,
        },
      },
      create: {
        userId,
        notificationType: dto.notificationType,
        enabled: dto.enabled,
        reminderTimes: dto.reminderTimes || [],
      },
      update: {
        enabled: dto.enabled,
        reminderTimes: dto.reminderTimes || [],
      },
    });
  }
}
