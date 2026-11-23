import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString } from 'class-validator';

export class SleepHistoryQueryDto {
  @ApiPropertyOptional({
    example: '2026-11-10',
    description: 'Ngày bắt đầu tra cứu (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString({}, { message: 'startDate phải có định dạng YYYY-MM-DD.' })
  startDate?: string;

  @ApiPropertyOptional({
    example: '2026-11-17',
    description: 'Ngày kết thúc tra cứu (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString({}, { message: 'endDate phải có định dạng YYYY-MM-DD.' })
  endDate?: string;
}

