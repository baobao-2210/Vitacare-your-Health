import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, Min, Max, IsOptional, IsISO8601, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateWaterLogDto {
  @ApiPropertyOptional({
    example: 300,
    description: 'Lượng nước uống cập nhật (ml)',
    minimum: 1,
    maximum: 5000,
  })
  @IsOptional()
  @IsInt({ message: 'Lượng nước phải là số nguyên (ml).' })
  @Min(1, { message: 'Lượng nước uống phải lớn hơn 0 ml (BR-WATER-01).' })
  @Max(5000, { message: 'Lượng nước uống một lần không vượt quá 5000 ml.' })
  @Type(() => Number)
  amountMl?: number;

  @ApiPropertyOptional({
    example: '2026-11-17T09:00:00.000Z',
    description: 'Thời điểm uống nước cập nhật (ISO 8601).',
  })
  @IsOptional()
  @IsISO8601({}, { message: 'Thời điểm uống nước phải đúng định dạng ISO 8601.' })
  consumedAt?: string;

  @ApiPropertyOptional({
    example: 'Cập nhật sau bữa sáng',
    description: 'Ghi chú thêm',
  })
  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi ký tự.' })
  @MaxLength(500, { message: 'Ghi chú không được vượt quá 500 ký tự.' })
  note?: string;
}
