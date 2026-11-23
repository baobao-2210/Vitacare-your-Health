import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, IsNumber, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFoodItemDto {
  @ApiProperty({ example: 'Salad cá ngừ', description: 'Tên món ăn' })
  @IsNotEmpty({ message: 'Tên món ăn không được để trống.' })
  @IsString({ message: 'Tên món ăn phải là chuỗi ký tự.' })
  @MaxLength(255, { message: 'Tên món ăn không vượt quá 255 ký tự.' })
  name: string;

  @ApiProperty({ example: 120, description: 'Lượng Calo trên 100g (kcal)' })
  @IsNumber({}, { message: 'Calo phải là số.' })
  @Min(0, { message: 'Calo không được âm.' })
  @Type(() => Number)
  caloriesPer100g: number;

  @ApiPropertyOptional({ example: 15.5, description: 'Chất đạm (Protein) trên 100g (g)' })
  @IsOptional()
  @IsNumber({}, { message: 'Protein phải là số.' })
  @Min(0, { message: 'Protein không được âm.' })
  @Type(() => Number)
  proteinPer100g?: number;

  @ApiPropertyOptional({ example: 5.2, description: 'Đường bột (Carbs) trên 100g (g)' })
  @IsOptional()
  @IsNumber({}, { message: 'Carbs phải là số.' })
  @Min(0, { message: 'Carbs không được âm.' })
  @Type(() => Number)
  carbsPer100g?: number;

  @ApiPropertyOptional({ example: 3.8, description: 'Chất béo (Fat) trên 100g (g)' })
  @IsOptional()
  @IsNumber({}, { message: 'Chất béo phải là số.' })
  @Min(0, { message: 'Chất béo không được âm.' })
  @Type(() => Number)
  fatPer100g?: number;
}

