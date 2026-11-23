import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsISO8601 } from 'class-validator';
import { ActivityType } from '@prisma/client';

export class CreateWorkoutSessionDto {
  @ApiProperty({
    enum: ActivityType,
    example: ActivityType.WALKING,
    description: 'Loại bài tập (WALKING, RUNNING, v.v.)',
  })
  @IsEnum(ActivityType, { message: 'Loại bài tập không hợp lệ.' })
  activityType: ActivityType;

  @ApiPropertyOptional({
    example: '2026-11-20T06:30:00.000Z',
    description: 'Thời điểm bắt đầu phiên tập (ISO 8601). Mặc định là hiện tại.',
  })
  @IsOptional()
  @IsISO8601({}, { message: 'startedAt phải là chuỗi ISO 8601.' })
  startedAt?: string;
}

