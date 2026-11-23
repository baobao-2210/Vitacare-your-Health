import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsISO8601, IsString, IsArray, ArrayMinSize, ValidateNested, IsUUID, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { MealType } from '@prisma/client';

export class CreateMealItemDto {
  @ApiPropertyOptional({
    example: 'd9b2d63d-a233-4f96-b07a-d02f5c71b6e8',
    description: 'ID món ăn trong cơ sở dữ liệu nếu chọn từ danh mục',
  })
  @IsOptional()
  @IsUUID('4', { message: 'foodItemId phải là UUID hợp lệ.' })
  foodItemId?: string;

  @ApiPropertyOptional({
    example: 'Cơm trắng',
    description: 'Tên món ăn (nếu không chọn từ danh mục có sẵn)',
  })
  @IsOptional()
  @IsString({ message: 'Tên món ăn phải là chuỗi ký tự.' })
  foodName?: string;

  @ApiProperty({
    example: 150,
    description: 'Khối lượng món ăn theo gam (BR-NUT-03: phải > 0g)',
    minimum: 1,
  })
  @IsNumber({}, { message: 'Khối lượng món ăn phải là số.' })
  @Min(1, { message: 'Khối lượng món ăn phải lớn hơn 0g (BR-NUT-03).' })
  @Type(() => Number)
  quantityG: number;
}

export class CreateMealLogDto {
  @ApiProperty({
    enum: MealType,
    example: MealType.LUNCH,
    description: 'Loại bữa ăn (BR-NUT-01)',
  })
  @IsEnum(MealType, { message: 'Loại bữa ăn không hợp lệ (BR-NUT-01).' })
  mealType: MealType;

  @ApiPropertyOptional({
    example: '2026-11-17T12:30:00.000Z',
    description: 'Thời điểm ăn (ISO 8601)',
  })
  @IsOptional()
  @IsISO8601({}, { message: 'Thời điểm ăn phải có định dạng ISO 8601.' })
  consumedAt?: string;

  @ApiPropertyOptional({
    example: 'Bữa trưa công ty',
    description: 'Ghi chú bữa ăn',
  })
  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi ký tự.' })
  note?: string;

  @ApiProperty({
    type: [CreateMealItemDto],
    description: 'Danh sách món ăn trong bữa (BR-NUT-02: tối thiểu 1 món)',
  })
  @IsArray({ message: 'Danh sách món ăn phải là mảng.' })
  @ArrayMinSize(1, { message: 'Bữa ăn phải có ít nhất 1 món ăn (BR-NUT-02).' })
  @ValidateNested({ each: true })
  @Type(() => CreateMealItemDto)
  items: CreateMealItemDto[];
}

