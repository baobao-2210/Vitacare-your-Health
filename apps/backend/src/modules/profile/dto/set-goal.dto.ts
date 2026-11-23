import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, Min, IsString, MaxLength, IsOptional, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { GoalType } from '@prisma/client';

export class SetGoalDto {
  @ApiProperty({ enum: GoalType, example: GoalType.WATER, description: 'Loại mục tiêu sức khỏe' })
  @IsEnum(GoalType, { message: 'Loại mục tiêu không hợp lệ.' })
  goalType: GoalType;

  @ApiProperty({ example: 2000, description: 'Giá trị mục tiêu', minimum: 0.1 })
  @IsNumber({}, { message: 'Giá trị mục tiêu phải là số.' })
  @Min(0.1, { message: 'Giá trị mục tiêu phải lớn hơn 0.' })
  @Type(() => Number)
  targetValue: number;

  @ApiProperty({ example: 'ml', description: 'Đơn vị đo lường (ml, hours, steps, kcal...)' })
  @IsString({ message: 'Đơn vị đo lường phải là chuỗi ký tự.' })
  @MaxLength(30, { message: 'Đơn vị đo không vượt quá 30 ký tự.' })
  unit: string;

  @ApiPropertyOptional({ example: '2026-11-17', description: 'Ngày bắt đầu áp dụng (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString({}, { message: 'startDate phải có định dạng YYYY-MM-DD.' })
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-12-31', description: 'Ngày kết thúc mục tiêu (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString({}, { message: 'endDate phải có định dạng YYYY-MM-DD.' })
  endDate?: string;
}

