import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    example: 'd9b2d63d-a233-4f9e-bf33-9118c7bc705a',
    description: 'Chuỗi Refresh Token để cấp lại Access Token mới',
  })
  @IsString({ message: 'Refresh token phải là chuỗi ký tự.' })
  @IsNotEmpty({ message: 'Refresh token không được để trống.' })
  refreshToken: string;

  @ApiPropertyOptional({
    example: 'iPhone 15 Pro, iOS 18',
    description: 'Thông tin thiết bị',
  })
  @IsOptional()
  @IsString()
  deviceInfo?: string;
}

