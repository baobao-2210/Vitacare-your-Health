import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsEnum } from 'class-validator';
import { HealthRecordType } from '@prisma/client';

export class HealthRecordQueryDto {
  @ApiPropertyOptional({ enum: HealthRecordType, description: 'Lọc theo loại chỉ số' })
  @IsOptional()
  @IsEnum(HealthRecordType, { message: 'Loại chỉ số không hợp lệ.' })
  recordType?: HealthRecordType;

  @ApiPropertyOptional({ example: '2026-11-01', description: 'Ngày bắt đầu (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString({}, { message: 'startDate phải có định dạng YYYY-MM-DD.' })
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-11-17', description: 'Ngày kết thúc (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString({}, { message: 'endDate phải có định dạng YYYY-MM-DD.' })
  endDate?: string;
}

