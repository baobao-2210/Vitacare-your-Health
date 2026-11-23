import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SetGoalDto } from './dto/set-goal.dto';

@ApiTags('Profile & Goals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy thông tin tài khoản, hồ sơ thể chất và phân tích BMI' })
  @ApiResponse({ status: 200, description: 'Hồ sơ người dùng kèm chỉ số BMI' })
  getProfile(@CurrentUser('id') userId: string) {
    return this.profileService.getProfile(userId);
  }

  @Patch()
  @ApiOperation({ summary: 'Cập nhật thông tin tài khoản và thể chất' })
  @ApiResponse({ status: 200, description: 'Hồ sơ sau khi cập nhật' })
  updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profileService.updateProfile(userId, dto);
  }

  @Get('goals')
  @ApiOperation({ summary: 'Lấy danh sách các mục tiêu sức khỏe đang hoạt động' })
  @ApiResponse({ status: 200, description: 'Danh sách mục tiêu' })
  getGoals(@CurrentUser('id') userId: string) {
    return this.profileService.getGoals(userId);
  }

  @Post('goals')
  @ApiOperation({ summary: 'Thiết lập hoặc cập nhật mục tiêu sức khỏe' })
  @ApiResponse({ status: 201, description: 'Mục tiêu mới được thiết lập' })
  setGoal(
    @CurrentUser('id') userId: string,
    @Body() dto: SetGoalDto,
  ) {
    return this.profileService.setGoal(userId, dto);
  }

  @Delete('goals/:id')
  @ApiOperation({ summary: 'Hủy kích hoạt một mục tiêu sức khỏe' })
  @ApiResponse({ status: 200, description: 'Hủy mục tiêu thành công' })
  deactivateGoal(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.profileService.deactivateGoal(userId, id);
  }
}
