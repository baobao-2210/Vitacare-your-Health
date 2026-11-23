import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateScheduleDto } from './create-schedule.dto';

export class CreateMedicationDto {
  @ApiProperty({
    example: 'Panadol Extra',
    description: 'Tên thuốc (BR-MED-01: không được để trống)',
  })
  @IsNotEmpty({ message: 'Tên thuốc không được để trống (BR-MED-01).' })
  @IsString({ message: 'Tên thuốc phải là chuỗi ký tự.' })
  @MaxLength(255, { message: 'Tên thuốc không được vượt quá 255 ký tự.' })
  name: string;

  @ApiPropertyOptional({
    example: '500mg, uống 1 viên sau ăn',
    description: 'Nhãn liều dùng do người dùng nhập/xác nhận (BR-MED-02)',
  })
  @IsOptional()
  @IsString({ message: 'Liều dùng phải là chuỗi ký tự.' })
  @MaxLength(255, { message: 'Liều dùng không vượt quá 255 ký tự.' })
  dosageLabel?: string;

  @ApiPropertyOptional({
    example: 'Uống nhiều nước ấm, không dùng khi đói',
    description: 'Ghi chú thêm về thuốc',
  })
  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi ký tự.' })
  note?: string;

  @ApiPropertyOptional({
    type: [CreateScheduleDto],
    description: 'Danh sách lịch nhắc uống thuốc khởi tạo kèm theo',
  })
  @IsOptional()
  @IsArray({ message: 'schedules phải là một danh sách.' })
  @ValidateNested({ each: true })
  @Type(() => CreateScheduleDto)
  schedules?: CreateScheduleDto[];
}

