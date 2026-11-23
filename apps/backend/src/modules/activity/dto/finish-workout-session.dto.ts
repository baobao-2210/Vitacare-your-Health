import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsISO8601, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class FinishWorkoutSessionDto {
  @ApiPropertyOptional({
    example: '2026-11-20T07:15:00.000Z',
    description: 'Thời điểm kết thúc phiên tập (ISO 8601). Mặc định là hiện tại.',
  })
  @IsOptional()
  @IsISO8601({}, { message: 'endedAt phải là chuỗi ISO 8601.' })
  endedAt?: string;

  @ApiProperty({ example: 2540, description: 'Tổng số bước ghi nhận trong phiên tập' })
  @IsNumber({}, { message: 'steps phải là số.' })
  @Min(0, { message: 'steps không được âm.' })
  @Type(() => Number)
  steps: number;

  @ApiProperty({ example: 2700, description: 'Thời lượng thực tế của phiên tập (giây, không tính thời gian tạm dừng)' })
  @IsNumber({}, { message: 'durationSeconds phải là số.' })
  @Min(0, { message: 'durationSeconds không được âm.' })
  @Type(() => Number)
  durationSeconds: number;

  @ApiPropertyOptional({ example: 120, description: 'Tổng thời gian tạm dừng phiên tập (giây)' })
  @IsOptional()
  @IsNumber({}, { message: 'pausedSeconds phải là số.' })
  @Min(0, { message: 'pausedSeconds không được âm.' })
  @Type(() => Number)
  pausedSeconds?: number;

  @ApiPropertyOptional({ example: 1850.2, description: 'Quãng đường hoàn thành (mét)' })
  @IsOptional()
  @IsNumber({}, { message: 'distanceMeters phải là số.' })
  @Min(0, { message: 'distanceMeters không được âm.' })
  @Type(() => Number)
  distanceMeters?: number;

  @ApiPropertyOptional({ example: 145.8, description: 'Năng lượng tiêu hao ước tính (kcal)' })
  @IsOptional()
  @IsNumber({}, { message: 'caloriesKcal phải là số.' })
  @Min(0, { message: 'caloriesKcal không được âm.' })
  @Type(() => Number)
  caloriesKcal?: number;

  @ApiPropertyOptional({ example: 6.5, description: 'Pace trung bình (phút/km hoặc số đo pace)' })
  @IsOptional()
  @IsNumber({}, { message: 'averagePace phải là số.' })
  @Min(0, { message: 'averagePace không được âm.' })
  @Type(() => Number)
  averagePace?: number;
}

