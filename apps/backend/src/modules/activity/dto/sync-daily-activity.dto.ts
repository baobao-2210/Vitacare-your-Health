import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum, Min, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { DataSource } from '@prisma/client';

export class SyncDailyActivityDto {
  @ApiProperty({ example: '2026-11-20', description: 'Ngày hoạt động (YYYY-MM-DD)' })
  @IsString({ message: 'activityDate phải là chuỗi định dạng YYYY-MM-DD.' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'activityDate phải có định dạng YYYY-MM-DD.' })
  activityDate: string;

  @ApiProperty({ example: 6840, description: 'Tổng số bước trong ngày từ cảm biến' })
  @IsNumber({}, { message: 'steps phải là số nguyên.' })
  @Min(0, { message: 'steps không được âm.' })
  @Type(() => Number)
  steps: number;

  @ApiPropertyOptional({ example: 4850.5, description: 'Quãng đường vận động (mét)' })
  @IsOptional()
  @IsNumber({}, { message: 'distanceMeters phải là số.' })
  @Min(0, { message: 'distanceMeters không được âm.' })
  @Type(() => Number)
  distanceMeters?: number;

  @ApiPropertyOptional({ example: 2700, description: 'Thời gian vận động tích cực (giây)' })
  @IsOptional()
  @IsNumber({}, { message: 'activeSeconds phải là số.' })
  @Min(0, { message: 'activeSeconds không được âm.' })
  @Type(() => Number)
  activeSeconds?: number;

  @ApiPropertyOptional({ example: 320.5, description: 'Năng lượng tiêu hao ước tính (kcal)' })
  @IsOptional()
  @IsNumber({}, { message: 'caloriesKcal phải là số.' })
  @Min(0, { message: 'caloriesKcal không được âm.' })
  @Type(() => Number)
  caloriesKcal?: number;

  @ApiPropertyOptional({ example: 'Asia/Ho_Chi_Minh', description: 'Múi giờ của thiết bị' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ enum: DataSource, default: DataSource.SENSOR, description: 'Nguồn dữ liệu' })
  @IsOptional()
  @IsEnum(DataSource, { message: 'dataSource không hợp lệ.' })
  dataSource?: DataSource;
}

