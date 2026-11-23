import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateActivityGoalDto {
  @ApiProperty({ example: 8000, description: 'Mục tiêu số bước chân mỗi ngày' })
  @IsNumber({}, { message: 'targetSteps phải là số.' })
  @Min(1000, { message: 'Mục tiêu bước chân tối thiểu là 1,000 bước.' })
  @Max(100000, { message: 'Mục tiêu bước chân tối đa là 100,000 bước.' })
  @Type(() => Number)
  targetSteps: number;

  @ApiPropertyOptional({ example: 45, description: 'Mục tiêu thời lượng vận động mỗi ngày (phút)' })
  @IsOptional()
  @IsNumber({}, { message: 'targetMinutes phải là số.' })
  @Min(1, { message: 'Mục tiêu thời lượng tối thiểu là 1 phút.' })
  @Max(720, { message: 'Mục tiêu thời lượng tối đa là 720 phút.' })
  @Type(() => Number)
  targetMinutes?: number;
}

