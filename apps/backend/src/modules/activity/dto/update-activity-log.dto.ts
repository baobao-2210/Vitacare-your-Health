import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, Min, Max, IsOptional, IsISO8601 } from 'class-validator';
import { Type } from 'class-transformer';
import { ActivityType } from '@prisma/client';

export class UpdateActivityLogDto {
  @ApiPropertyOptional({ enum: ActivityType, example: ActivityType.RUNNING })
  @IsOptional()
  @IsEnum(ActivityType, { message: 'Loại hoạt động không hợp lệ.' })
  activityType?: ActivityType;

  @ApiPropertyOptional({ example: 4500, minimum: 0 })
  @IsOptional()
  @IsInt({ message: 'Số bước chân phải là số nguyên.' })
  @Min(0, { message: 'Số bước chân không được âm (BR-ACT-03).' })
  @Type(() => Number)
  steps?: number;

  @ApiPropertyOptional({ example: 60, minimum: 1, maximum: 1440 })
  @IsOptional()
  @IsInt({ message: 'Thời lượng phải là số nguyên (phút).' })
  @Min(1, { message: 'Thời lượng hoạt động phải lớn hơn 0 phút (BR-ACT-02).' })
  @Max(1440, { message: 'Thời lượng hoạt động không vượt quá 1440 phút.' })
  @Type(() => Number)
  durationMinutes?: number;

  @ApiPropertyOptional({ example: '2026-11-17T08:00:00.000Z' })
  @IsOptional()
  @IsISO8601({}, { message: 'Thời điểm ghi nhận phải đúng định dạng ISO 8601.' })
  recordedAt?: string;
}

