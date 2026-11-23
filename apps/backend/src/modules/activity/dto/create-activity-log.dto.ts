import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, Min, Max, IsOptional, IsString, IsISO8601, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ActivityType, DataSource } from '@prisma/client';

export class CreateActivityLogDto {
  @ApiProperty({
    enum: ActivityType,
    example: ActivityType.WALKING,
    description: 'Loại hoạt động (BR-ACT-01)',
  })
  @IsEnum(ActivityType, { message: 'Loại hoạt động không hợp lệ.' })
  activityType: ActivityType;

  @ApiPropertyOptional({
    example: 3500,
    description: 'Số bước chân (BR-ACT-03: không được âm)',
    minimum: 0,
  })
  @IsOptional()
  @IsInt({ message: 'Số bước chân phải là số nguyên.' })
  @Min(0, { message: 'Số bước chân không được âm (BR-ACT-03).' })
  @Type(() => Number)
  steps?: number;

  @ApiPropertyOptional({
    example: 45,
    description: 'Thời lượng hoạt động tính theo phút (BR-ACT-02: phải > 0)',
    minimum: 1,
    maximum: 1440,
  })
  @IsOptional()
  @IsInt({ message: 'Thời lượng phải là số nguyên (phút).' })
  @Min(1, { message: 'Thời lượng hoạt động phải lớn hơn 0 phút (BR-ACT-02).' })
  @Max(1440, { message: 'Thời lượng hoạt động không được vượt quá 1440 phút (24 giờ).' })
  @Type(() => Number)
  durationMinutes?: number;

  @ApiPropertyOptional({
    enum: DataSource,
    example: DataSource.MANUAL,
    description: 'Nguồn dữ liệu (BR-ACT-04)',
    default: DataSource.MANUAL,
  })
  @IsOptional()
  @IsEnum(DataSource, { message: 'Nguồn dữ liệu không hợp lệ.' })
  source?: DataSource;

  @ApiPropertyOptional({
    example: 'apple-health-123456',
    description: 'ID định danh từ hệ thống ngoài để chống trùng lặp (BR-ACT-05)',
  })
  @IsOptional()
  @IsString({ message: 'externalId phải là chuỗi ký tự.' })
  @MaxLength(255, { message: 'externalId không vượt quá 255 ký tự.' })
  externalId?: string;

  @ApiPropertyOptional({
    example: '2026-11-17T07:30:00.000Z',
    description: 'Thời điểm ghi nhận hoạt động (ISO 8601). Mặc định là hiện tại.',
  })
  @IsOptional()
  @IsISO8601({}, { message: 'Thời điểm ghi nhận phải đúng định dạng ISO 8601.' })
  recordedAt?: string;
}

