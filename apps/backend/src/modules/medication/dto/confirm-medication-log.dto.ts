import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsISO8601, IsEnum, IsOptional, IsString } from 'class-validator';
import { MedicationLogStatus } from '@prisma/client';

export class ConfirmMedicationLogDto {
  @ApiProperty({
    example: 'd9b2d63d-a233-4f96-b07a-d02f5c71b6e8',
    description: 'ID của lịch nhắc uống thuốc (BR-MED-05)',
  })
  @IsUUID('4', { message: 'scheduleId phải là UUID v4 hợp lệ.' })
  scheduleId: string;

  @ApiProperty({
    example: '2026-11-17T08:00:00.000Z',
    description: 'Thời điểm nhắc theo lịch (ISO 8601)',
  })
  @IsISO8601({}, { message: 'scheduledAt phải đúng định dạng ISO 8601.' })
  scheduledAt: string;

  @ApiProperty({
    enum: MedicationLogStatus,
    example: MedicationLogStatus.TAKEN,
    description: 'Trạng thái xác nhận (TAKEN hoặc SKIPPED) - BR-MED-06',
  })
  @IsEnum(MedicationLogStatus, { message: 'Trạng thái không hợp lệ.' })
  status: MedicationLogStatus;

  @ApiPropertyOptional({
    example: '2026-11-17T08:15:00.000Z',
    description: 'Thời điểm thực tế uống thuốc (nếu chọn TAKEN)',
  })
  @IsOptional()
  @IsISO8601({}, { message: 'takenAt phải đúng định dạng ISO 8601.' })
  takenAt?: string;

  @ApiPropertyOptional({
    example: 'Uống trễ 15 phút',
    description: 'Ghi chú xác nhận',
  })
  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi ký tự.' })
  note?: string;
}

