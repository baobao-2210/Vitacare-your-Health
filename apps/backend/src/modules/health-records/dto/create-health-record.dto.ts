import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  IsISO8601,
  IsArray,
  ValidateNested,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';
import { HealthRecordType, DataSource } from '@prisma/client';

export class CreateAttachmentDto {
  @ApiProperty({ example: 'attachments/lab_result_1.png', description: 'Đường dẫn lưu trữ tệp' })
  @IsString({ message: 'storagePath phải là chuỗi ký tự.' })
  @MaxLength(500, { message: 'storagePath không vượt quá 500 ký tự.' })
  storagePath: string;

  @ApiProperty({ example: 'ket_qua_xet_nghiem.png', description: 'Tên tệp gốc' })
  @IsString({ message: 'fileName phải là chuỗi ký tự.' })
  @MaxLength(255, { message: 'fileName không vượt quá 255 ký tự.' })
  fileName: string;

  @ApiProperty({ example: 'image/png', description: 'Loại MIME của tệp' })
  @IsString({ message: 'fileType phải là chuỗi ký tự.' })
  @MaxLength(100, { message: 'fileType không vượt quá 100 ký tự.' })
  fileType: string;

  @ApiPropertyOptional({ example: 2048500, description: 'Dung lượng tệp (bytes)' })
  @IsOptional()
  @IsNumber({}, { message: 'fileSize phải là số.' })
  @Type(() => Number)
  fileSize?: number;
}

export class CreateHealthRecordDto {
  @ApiProperty({
    enum: HealthRecordType,
    example: HealthRecordType.BLOOD_PRESSURE,
    description: 'Loại chỉ số sức khỏe (BR-REC-01)',
  })
  @IsEnum(HealthRecordType, { message: 'Loại chỉ số không hợp lệ.' })
  recordType: HealthRecordType;

  @ApiProperty({
    example: 120,
    description: 'Giá trị chính (ví dụ: huyết áp tâm thu, cân nặng kg, đường huyết)',
  })
  @IsNumber({}, { message: 'Giá trị chỉ số phải là số.' })
  @IsPositive({ message: 'Giá trị chỉ số phải lớn hơn 0.' })
  @Type(() => Number)
  value: number;

  @ApiPropertyOptional({
    example: 80,
    description: 'Giá trị phụ (ví dụ: huyết áp tâm trương mmHg)',
  })
  @IsOptional()
  @IsNumber({}, { message: 'Giá trị phụ phải là số.' })
  @IsPositive({ message: 'Giá trị phụ phải lớn hơn 0.' })
  @Type(() => Number)
  secondaryValue?: number;

  @ApiProperty({
    example: 'mmHg',
    description: 'Đơn vị đo lường (mmHg, bpm, kg, cm, mmol/L, ...)',
  })
  @IsString({ message: 'Đơn vị đo phải là chuỗi ký tự.' })
  @MaxLength(30, { message: 'Đơn vị đo không vượt quá 30 ký tự.' })
  unit: string;

  @ApiPropertyOptional({
    enum: DataSource,
    example: DataSource.MANUAL,
    description: 'Nguồn dữ liệu',
    default: DataSource.MANUAL,
  })
  @IsOptional()
  @IsEnum(DataSource, { message: 'Nguồn dữ liệu không hợp lệ.' })
  source?: DataSource;

  @ApiPropertyOptional({
    example: '2026-11-17T09:00:00.000Z',
    description: 'Thời điểm đo (ISO 8601). Mặc định là hiện tại.',
  })
  @IsOptional()
  @IsISO8601({}, { message: 'Thời điểm đo phải đúng định dạng ISO 8601.' })
  recordedAt?: string;

  @ApiPropertyOptional({
    example: 'Đo sau khi nghỉ ngơi 15 phút',
    description: 'Ghi chú thêm',
  })
  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi ký tự.' })
  note?: string;

  @ApiPropertyOptional({
    type: [CreateAttachmentDto],
    description: 'Danh sách tệp tin / hình ảnh đính kèm (BR-REC-04)',
  })
  @IsOptional()
  @IsArray({ message: 'attachments phải là một mảng.' })
  @ValidateNested({ each: true })
  @Type(() => CreateAttachmentDto)
  attachments?: CreateAttachmentDto[];
}

