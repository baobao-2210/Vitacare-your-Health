import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional, IsEnum, IsString, MaxLength } from 'class-validator';
import { SleepQuality } from '@prisma/client';

export class UpdateSleepLogDto {
  @ApiPropertyOptional({
    example: '2026-11-16T23:00:00.000Z',
    description: 'Thời điểm bắt đầu ngủ cập nhật (ISO 8601)',
  })
  @IsOptional()
  @IsISO8601({}, { message: 'Thời điểm bắt đầu ngủ phải có định dạng ISO 8601.' })
  sleepStart?: string;

  @ApiPropertyOptional({
    example: '2026-11-17T07:00:00.000Z',
    description: 'Thời điểm thức dậy cập nhật (ISO 8601)',
  })
  @IsOptional()
  @IsISO8601({}, { message: 'Thời điểm thức dậy phải có định dạng ISO 8601.' })
  sleepEnd?: string;

  @ApiPropertyOptional({
    enum: SleepQuality,
    example: SleepQuality.NORMAL,
    description: 'Đánh giá chất lượng giấc ngủ cập nhật',
  })
  @IsOptional()
  @IsEnum(SleepQuality, { message: 'Chất lượng giấc ngủ không hợp lệ.' })
  quality?: SleepQuality;

  @ApiPropertyOptional({
    example: 'Thức dậy hơi mệt do ngủ muộn',
    description: 'Ghi chú cập nhật',
  })
  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi ký tự.' })
  @MaxLength(500, { message: 'Ghi chú không được vượt quá 500 ký tự.' })
  note?: string;
}

