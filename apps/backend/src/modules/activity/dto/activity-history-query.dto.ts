import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ActivityType } from '@prisma/client';

export class ActivityHistoryQueryDto {
  @ApiPropertyOptional({ example: '2026-11-10', description: 'Ngày bắt đầu (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString({}, { message: 'startDate phải có định dạng YYYY-MM-DD.' })
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-11-17', description: 'Ngày kết thúc (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString({}, { message: 'endDate phải có định dạng YYYY-MM-DD.' })
  endDate?: string;

  @ApiPropertyOptional({ enum: ActivityType, description: 'Lọc theo loại hoạt động' })
  @IsOptional()
  @IsEnum(ActivityType, { message: 'Loại hoạt động không hợp lệ.' })
  activityType?: ActivityType;
}

