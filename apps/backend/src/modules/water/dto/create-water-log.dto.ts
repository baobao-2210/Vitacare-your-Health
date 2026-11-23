import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, Min, Max, IsOptional, IsISO8601, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateWaterLogDto {
  @ApiProperty({
    example: 250,
    description: 'Lượng nước uống (ml)',
    minimum: 1,
    maximum: 5000,
  })
  @IsInt({ message: 'Lượng nước phải là số nguyên (ml).' })
  @Min(1, { message: 'Lượng nước uống phải lớn hơn 0 ml (BR-WATER-01).' })
  @Max(5000, { message: 'Lượng nước uống một lần không vượt quá 5000 ml.' })
  @Type(() => Number)
  amountMl: number;

  @ApiPropertyOptional({
    example: '2026-11-17T08:30:00.000Z',
    description: 'Thời điểm uống nước (ISO 8601). Mặc định là thời điểm hiện tại.',
  })
  @IsOptional()
  @IsISO8601({}, { message: 'Thời điểm uống nước phải đúng định dạng ISO 8601.' })
  consumedAt?: string;

  @ApiPropertyOptional({
    example: 'Uống sau khi thức dậy',
    description: 'Ghi chú thêm',
  })
  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi ký tự.' })
  @MaxLength(500, { message: 'Ghi chú không được vượt quá 500 ký tự.' })
  note?: string;
}
