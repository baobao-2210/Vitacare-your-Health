import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('today')
  @ApiOperation({ summary: 'Lấy dữ liệu tổng hợp sức khỏe toàn diện hôm nay cho trang chủ' })
  @ApiResponse({ status: 200, description: 'Tổng hợp chỉ số sức khỏe hôm nay' })
  getTodaySummary(@CurrentUser('id') userId: string) {
    return this.dashboardService.getTodaySummary(userId);
  }
}
