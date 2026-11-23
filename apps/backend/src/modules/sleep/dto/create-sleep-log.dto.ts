import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional, IsEnum, IsString, MaxLength } from 'class-validator';
import { SleepQuality } from '@prisma/client';

export class CreateSleepLogDto {
  @ApiProperty({
    example: '2026-11-16T22:30:00.000Z',
    description: 'Thời điểm bắt đầu ngủ (ISO 8601)',
  })
  @IsISO8601({}, { message: 'Thời điểm bắt đầu ngủ phải có định dạng ISO 8601.' })
  sleepStart: string;

  @ApiProperty({
    example: '2026-11-17T06:30:00.000Z',
    description: 'Thời điểm thức dậy (ISO 8601)',
  })
  @IsISO8601({}, { message: 'Thời điểm thức dậy phải có định dạng ISO 8601.' })
  sleepEnd: string;

  @ApiPropertyOptional({
    enum: SleepQuality,
    example: SleepQuality.GOOD,
    description: 'Đánh giá chất lượng giấc ngủ chủ quan (BR-SLEEP-06)',
  })
  @IsOptional()
  @IsEnum(SleepQuality, { message: 'Chất lượng giấc ngủ không hợp lệ.' })
  quality?: SleepQuality;

  @ApiPropertyOptional({
    example: 'Ngủ sâu giấc, không thức giấc giữa đêm',
    description: 'Ghi chú về giấc ngủ',
  })
  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi ký tự.' })
  @MaxLength(500, { message: 'Ghi chú không được vượt quá 500 ký tự.' })
  note?: string;
}

