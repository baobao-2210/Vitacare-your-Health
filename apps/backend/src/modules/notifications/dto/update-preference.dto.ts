import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsBoolean, IsOptional, IsArray, IsString } from 'class-validator';
import { NotificationType } from '@prisma/client';

export class UpdateNotificationPreferenceDto {
  @ApiProperty({
    enum: NotificationType,
    example: NotificationType.WATER,
    description: 'Loại thông báo nhắc nhở (WATER, SLEEP, MEDICATION, ACTIVITY)',
  })
  @IsEnum(NotificationType, { message: 'Loại thông báo không hợp lệ.' })
  notificationType: NotificationType;

  @ApiProperty({ example: true, description: 'Bật hoặc tắt loại thông báo này' })
  @IsBoolean({ message: 'enabled phải là boolean.' })
  enabled: boolean;

  @ApiPropertyOptional({
    example: ['08:00', '11:30', '15:00', '20:00'],
    description: 'Danh sách các khung giờ nhắc nhở (HH:mm)',
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'reminderTimes phải là một danh sách chuỗi giờ.' })
  @IsString({ each: true, message: 'Mỗi giờ nhắc phải là chuỗi ký tự (HH:mm).' })
  reminderTimes?: string[];
}

