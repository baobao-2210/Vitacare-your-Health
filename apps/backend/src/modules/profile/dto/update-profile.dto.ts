import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsNumber, Min, Max, IsEnum, IsUrl, IsString, MinLength, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { Gender } from '@prisma/client';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Nguyễn Văn A', description: 'Họ và tên' })
  @IsOptional()
  @IsString({ message: 'Họ và tên phải là chuỗi ký tự.' })
  @MinLength(2, { message: 'Họ và tên phải có ít nhất 2 ký tự.' })
  @MaxLength(150, { message: 'Họ và tên không vượt quá 150 ký tự.' })
  fullName?: string;

  @ApiPropertyOptional({ example: 'Asia/Ho_Chi_Minh', description: 'Múi giờ' })
  @IsOptional()
  @IsString({ message: 'Múi giờ phải là chuỗi ký tự.' })
  @MaxLength(100, { message: 'Múi giờ không được vượt quá 100 ký tự.' })
  timezone?: string;

  @ApiPropertyOptional({ example: '1995-05-15', description: 'Ngày sinh (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString({}, { message: 'Ngày sinh phải có định dạng YYYY-MM-DD.' })
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 172.5, description: 'Chiều cao (cm)', minimum: 30, maximum: 250 })
  @IsOptional()
  @IsNumber({}, { message: 'Chiều cao phải là số.' })
  @Min(30, { message: 'Chiều cao tối thiểu là 30 cm.' })
  @Max(250, { message: 'Chiều cao tối đa là 250 cm.' })
  @Type(() => Number)
  heightCm?: number;

  @ApiPropertyOptional({ example: 68.0, description: 'Cân nặng (kg)', minimum: 2, maximum: 300 })
  @IsOptional()
  @IsNumber({}, { message: 'Cân nặng phải là số.' })
  @Min(2, { message: 'Cân nặng tối thiểu là 2 kg.' })
  @Max(300, { message: 'Cân nặng tối đa là 300 kg.' })
  @Type(() => Number)
  weightKg?: number;

  @ApiPropertyOptional({ enum: Gender, example: Gender.MALE, description: 'Giới tính' })
  @IsOptional()
  @IsEnum(Gender, { message: 'Giới tính không hợp lệ.' })
  gender?: Gender;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg', description: 'URL ảnh đại diện' })
  @IsOptional()
  @IsUrl({}, { message: 'URL ảnh đại diện không hợp lệ.' })
  @MaxLength(500, { message: 'URL ảnh đại diện không vượt quá 500 ký tự.' })
  avatarUrl?: string;
}

