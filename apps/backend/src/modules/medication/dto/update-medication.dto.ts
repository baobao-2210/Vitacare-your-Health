import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, IsBoolean } from 'class-validator';

export class UpdateMedicationDto {
  @ApiPropertyOptional({ example: 'Panadol Extra Đỏ' })
  @IsOptional()
  @IsString({ message: 'Tên thuốc phải là chuỗi ký tự.' })
  @MaxLength(255, { message: 'Tên thuốc không vượt quá 255 ký tự.' })
  name?: string;

  @ApiPropertyOptional({ example: '1 viên sau ăn trưa' })
  @IsOptional()
  @IsString({ message: 'Liều dùng phải là chuỗi ký tự.' })
  @MaxLength(255, { message: 'Liều dùng không vượt quá 255 ký tự.' })
  dosageLabel?: string;

  @ApiPropertyOptional({ example: 'Uống thêm nước cam' })
  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi ký tự.' })
  note?: string;

  @ApiPropertyOptional({ example: true, description: 'Trạng thái thuốc đang sử dụng hay đã ngưng' })
  @IsOptional()
  @IsBoolean({ message: 'isActive phải là boolean.' })
  isActive?: boolean;
}

