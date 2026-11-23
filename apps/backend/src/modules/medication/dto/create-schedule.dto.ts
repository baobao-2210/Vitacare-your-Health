import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, Matches, IsOptional, IsArray, IsInt, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { MedicationFrequency } from '@prisma/client';

export class CreateScheduleDto {
  @ApiProperty({
    enum: MedicationFrequency,
    example: MedicationFrequency.DAILY,
    description: 'Tần suất nhắc (DAILY, WEEKLY, INTERVAL, CUSTOM)',
  })
  @IsEnum(MedicationFrequency, { message: 'Tần suất không hợp lệ.' })
  frequency: MedicationFrequency;

  @ApiProperty({
    example: '08:00',
    description: 'Giờ nhắc uống thuốc (HH:mm) - BR-MED-04',
  })
  @IsNotEmpty({ message: 'Giờ nhắc không được để trống (BR-MED-04).' })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Giờ nhắc phải đúng định dạng HH:mm (ví dụ 08:30).',
  })
  reminderTime: string;

  @ApiPropertyOptional({
    example: [1, 2, 3, 4, 5],
    description: 'Các thứ trong tuần (1 = Thứ 2, 7 = Chủ Nhật)',
    type: [Number],
  })
  @IsOptional()
  @IsArray({ message: 'weekdays phải là một mảng số.' })
  @IsInt({ each: true, message: 'Mỗi ngày trong tuần phải là số nguyên.' })
  weekdays?: number[];

  @ApiPropertyOptional({
    example: 2,
    description: 'Khoảng cách ngày nếu chọn INTERVAL (ví dụ cách 2 ngày uống 1 lần)',
  })
  @IsOptional()
  @IsInt({ message: 'intervalDays phải là số nguyên.' })
  @Min(1, { message: 'intervalDays tối thiểu là 1 ngày.' })
  @Type(() => Number)
  intervalDays?: number;

  @ApiPropertyOptional({
    example: '2026-11-17',
    description: 'Ngày bắt đầu uống thuốc (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString({}, { message: 'startDate phải có định dạng YYYY-MM-DD.' })
  startDate?: string;

  @ApiPropertyOptional({
    example: '2026-11-30',
    description: 'Ngày kết thúc đơn thuốc (YYYY-MM-DD) - BR-MED-03: không được trước startDate',
  })
  @IsOptional()
  @IsDateString({}, { message: 'endDate phải có định dạng YYYY-MM-DD.' })
  endDate?: string;
}

