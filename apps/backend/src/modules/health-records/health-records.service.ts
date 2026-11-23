import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateHealthRecordDto } from './dto/create-health-record.dto';
import { UpdateHealthRecordDto } from './dto/update-health-record.dto';
import { HealthRecordQueryDto } from './dto/health-record-query.dto';
import { HealthRecordType } from '@prisma/client';
import dayjs from 'dayjs';

@Injectable()
export class HealthRecordsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tạo bản ghi chỉ số sức khỏe mới (BR-REC-01 -> BR-REC-04)
   */
  async create(userId: string, dto: CreateHealthRecordDto) {
    if (
      dto.recordType === HealthRecordType.BLOOD_PRESSURE &&
      dto.secondaryValue !== undefined &&
      dto.secondaryValue !== null &&
      Number(dto.value) <= Number(dto.secondaryValue)
    ) {
      throw new BadRequestException('Huyết áp tâm thu phải lớn hơn huyết áp tâm trương.');
    }

    const recordedAt = dto.recordedAt ? new Date(dto.recordedAt) : new Date();

    const record = await this.prisma.healthRecord.create({
      data: {
        userId,
        recordType: dto.recordType,
        value: dto.value,
        secondaryValue: dto.secondaryValue || null,
        unit: dto.unit,
        source: dto.source || 'MANUAL',
        recordedAt,
        note: dto.note || null,
        attachments: dto.attachments && dto.attachments.length > 0
          ? {
              create: dto.attachments.map(att => ({
                storagePath: att.storagePath,
                fileName: att.fileName,
                fileType: att.fileType,
                fileSize: att.fileSize ? BigInt(att.fileSize) : null,
              })),
            }
          : undefined,
      },
      include: {
        attachments: true,
      },
    });

    // Đồng bộ cân nặng / chiều cao sang HealthProfile nếu có
    if (dto.recordType === HealthRecordType.WEIGHT) {
      await this.prisma.healthProfile.updateMany({
        where: { userId },
        data: { weightKg: dto.value },
      });
    } else if (dto.recordType === HealthRecordType.HEIGHT) {
      await this.prisma.healthProfile.updateMany({
        where: { userId },
        data: { heightCm: dto.value },
      });
    }

    return {
      ...record,
      attachments: record.attachments.map(a => ({
        ...a,
        fileSize: a.fileSize ? Number(a.fileSize) : null,
      })),
    };
  }

  /**
   * Tra cứu danh sách chỉ số sức khỏe theo bộ lọc
   */
  async findAll(userId: string, query: HealthRecordQueryDto) {
    const records = await this.prisma.healthRecord.findMany({
      where: {
        userId,
        ...(query.recordType && { recordType: query.recordType }),
        ...(query.startDate || query.endDate ? {
          recordedAt: {
            ...(query.startDate && { gte: dayjs(query.startDate).startOf('day').toDate() }),
            ...(query.endDate && { lte: dayjs(query.endDate).endOf('day').toDate() }),
          },
        } : {}),
      },
      include: {
        attachments: true,
      },
      orderBy: { recordedAt: 'desc' },
    });

    return records.map(r => ({
      ...r,
      attachments: r.attachments.map(a => ({
        ...a,
        fileSize: a.fileSize ? Number(a.fileSize) : null,
      })),
    }));
  }

  /**
   * Lấy các chỉ số sức khỏe đo gần nhất cho từng loại
   */
  async findLatestByType(userId: string) {
    const types = Object.values(HealthRecordType);
    const latestRecords: Record<string, any> = {};

    for (const t of types) {
      const rec = await this.prisma.healthRecord.findFirst({
        where: { userId, recordType: t },
        orderBy: { recordedAt: 'desc' },
        include: { attachments: true },
      });

      if (rec) {
        latestRecords[t] = {
          ...rec,
          attachments: rec.attachments.map(a => ({
            ...a,
            fileSize: a.fileSize ? Number(a.fileSize) : null,
          })),
        };
      } else {
        latestRecords[t] = null;
      }
    }

    return latestRecords;
  }

  /**
   * Xem chi tiết 1 bản ghi
   */
  async findOne(userId: string, id: string) {
    const record = await this.prisma.healthRecord.findUnique({
      where: { id },
      include: { attachments: true },
    });

    if (!record) {
      throw new NotFoundException('Bản ghi chỉ số sức khỏe không tồn tại.');
    }

    if (record.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xem bản ghi này (BR-REC-05).');
    }

    return {
      ...record,
      attachments: record.attachments.map(a => ({
        ...a,
        fileSize: a.fileSize ? Number(a.fileSize) : null,
      })),
    };
  }

  /**
   * Cập nhật bản ghi chỉ số sức khỏe
   */
  async update(userId: string, id: string, dto: UpdateHealthRecordDto) {
    const record = await this.prisma.healthRecord.findUnique({ where: { id } });

    if (!record) {
      throw new NotFoundException('Bản ghi chỉ số sức khỏe không tồn tại.');
    }

    if (record.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa bản ghi này.');
    }

    const finalValue = dto.value !== undefined ? Number(dto.value) : Number(record.value);
    const finalSecondary = dto.secondaryValue !== undefined ? Number(dto.secondaryValue) : (record.secondaryValue !== null ? Number(record.secondaryValue) : null);
    if (record.recordType === HealthRecordType.BLOOD_PRESSURE && finalSecondary !== null && finalValue <= finalSecondary) {
      throw new BadRequestException('Huyết áp tâm thu phải lớn hơn huyết áp tâm trương.');
    }

    const recordedAt = dto.recordedAt ? new Date(dto.recordedAt) : undefined;

    const updated = await this.prisma.healthRecord.update({
      where: { id },
      data: {
        ...(dto.value !== undefined && { value: dto.value }),
        ...(dto.secondaryValue !== undefined && { secondaryValue: dto.secondaryValue }),
        ...(dto.unit !== undefined && { unit: dto.unit }),
        ...(recordedAt !== undefined && { recordedAt }),
        ...(dto.note !== undefined && { note: dto.note }),
      },
      include: {
        attachments: true,
      },
    });

    if (record.recordType === HealthRecordType.WEIGHT && dto.value !== undefined) {
      await this.prisma.healthProfile.updateMany({
        where: { userId },
        data: { weightKg: dto.value },
      });
    }

    return {
      ...updated,
      attachments: updated.attachments.map(a => ({
        ...a,
        fileSize: a.fileSize ? Number(a.fileSize) : null,
      })),
    };
  }

  /**
   * Xóa bản ghi
   */
  async delete(userId: string, id: string) {
    const record = await this.prisma.healthRecord.findUnique({ where: { id } });

    if (!record) {
      throw new NotFoundException('Bản ghi chỉ số sức khỏe không tồn tại.');
    }

    if (record.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa bản ghi này (BR-REC-05).');
    }

    await this.prisma.healthRecord.delete({ where: { id } });
    return { message: 'Đã xóa bản ghi chỉ số sức khỏe thành công.' };
  }
}
