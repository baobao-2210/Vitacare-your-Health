import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ActivityService } from './activity.service';
import { CreateActivityLogDto } from './dto/create-activity-log.dto';
import { UpdateActivityLogDto } from './dto/update-activity-log.dto';
import { ActivityHistoryQueryDto } from './dto/activity-history-query.dto';
import { SyncDailyActivityDto } from './dto/sync-daily-activity.dto';
import { CreateWorkoutSessionDto } from './dto/create-workout-session.dto';
import { FinishWorkoutSessionDto } from './dto/finish-workout-session.dto';
import { UpdateActivityGoalDto } from './dto/activity-goal.dto';

@ApiTags('Activity Tracking')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  // =========================================================================
  // 1. DAILY ACTIVITY TRACKING & SYNC
  // =========================================================================

  @Post('sync')
  @ApiOperation({ summary: 'Đồng bộ số bước từ Native Sensor (Idempotent theo ngày)' })
  @ApiResponse({ status: 200, description: 'Đồng bộ thành công' })
  syncDaily(
    @CurrentUser('id') userId: string,
    @Body() dto: SyncDailyActivityDto,
  ) {
    return this.activityService.syncDaily(userId, dto);
  }

  @Get('daily')
  @ApiOperation({ summary: 'Lấy tổng kết vận động theo ngày (ActivityDailySummary)' })
  @ApiQuery({ name: 'date', required: false, example: '2026-11-20', description: 'Ngày cần tra cứu (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Tổng kết ngày' })
  getDaily(
    @CurrentUser('id') userId: string,
    @Query('date') date?: string,
  ) {
    return this.activityService.getDailySummary(userId, date);
  }

  @Get('today')
  @ApiOperation({ summary: 'Xem tổng kết hoạt động hôm nay và tiến độ mục tiêu' })
  @ApiResponse({ status: 200, description: 'Tổng kết hoạt động hôm nay' })
  getToday(@CurrentUser('id') userId: string) {
    return this.activityService.getToday(userId);
  }

  @Get('goals')
  @ApiOperation({ summary: 'Lấy mục tiêu số bước chân và thời lượng vận động' })
  @ApiResponse({ status: 200, description: 'Mục tiêu vận động' })
  getGoals(@CurrentUser('id') userId: string) {
    return this.activityService.getGoals(userId);
  }

  @Patch('goals')
  @ApiOperation({ summary: 'Cập nhật mục tiêu số bước chân và thời lượng vận động' })
  @ApiResponse({ status: 200, description: 'Cập nhật mục tiêu thành công' })
  updateGoals(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateActivityGoalDto,
  ) {
    return this.activityService.updateGoals(userId, dto);
  }

  @Get('history')
  @ApiOperation({ summary: 'Xem lịch sử hoạt động theo khoảng thời gian' })
  @ApiResponse({ status: 200, description: 'Lịch sử hoạt động' })
  getHistory(
    @CurrentUser('id') userId: string,
    @Query() query: ActivityHistoryQueryDto,
  ) {
    return this.activityService.getHistory(userId, query);
  }

  // =========================================================================
  // 2. WORKOUT SESSION TRACKING
  // =========================================================================

  @Post('sessions')
  @ApiOperation({ summary: 'Bắt đầu phiên tập luyện độc lập (WALKING, RUNNING)' })
  @ApiResponse({ status: 201, description: 'Bắt đầu phiên tập thành công' })
  createSession(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateWorkoutSessionDto,
  ) {
    return this.activityService.createSession(userId, dto);
  }

  @Patch('sessions/:id/pause')
  @ApiOperation({ summary: 'Tạm dừng phiên tập luyện' })
  @ApiResponse({ status: 200, description: 'Đã tạm dừng phiên tập' })
  pauseSession(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.activityService.pauseSession(userId, id);
  }

  @Patch('sessions/:id/resume')
  @ApiOperation({ summary: 'Tiếp tục phiên tập luyện' })
  @ApiResponse({ status: 200, description: 'Đã tiếp tục phiên tập' })
  resumeSession(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.activityService.resumeSession(userId, id);
  }

  @Patch('sessions/:id/finish')
  @ApiOperation({ summary: 'Kết thúc và chốt kết quả phiên tập luyện' })
  @ApiResponse({ status: 200, description: 'Kết thúc phiên tập thành công' })
  finishSession(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: FinishWorkoutSessionDto,
  ) {
    return this.activityService.finishSession(userId, id, dto);
  }

  @Get('sessions')
  @ApiOperation({ summary: 'Lấy danh sách các phiên tập luyện đã thực hiện' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiResponse({ status: 200, description: 'Danh sách phiên tập' })
  getSessions(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.activityService.getSessions(userId, page ? Number(page) : 1, limit ? Number(limit) : 20);
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Xem chi tiết tóm tắt của 1 phiên tập' })
  @ApiResponse({ status: 200, description: 'Chi tiết phiên tập' })
  getSessionById(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.activityService.getSessionById(userId, id);
  }

  @Delete('sessions/:id')
  @ApiOperation({ summary: 'Xóa phiên tập luyện' })
  @ApiResponse({ status: 200, description: 'Xóa phiên tập thành công' })
  deleteSession(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.activityService.deleteSession(userId, id);
  }

  // =========================================================================
  // 3. LEGACY ENDPOINTS (COMPATIBILITY)
  // =========================================================================

  @Post()
  @ApiOperation({ summary: 'Ghi nhận hoặc đồng bộ bản ghi hoạt động thủ công' })
  @ApiResponse({ status: 201, description: 'Ghi nhận thành công' })
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateActivityLogDto,
  ) {
    return this.activityService.create(userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Chỉnh sửa bản ghi hoạt động' })
  @ApiResponse({ status: 200, description: 'Chỉnh sửa thành công' })
  update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateActivityLogDto,
  ) {
    return this.activityService.update(userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa bản ghi hoạt động' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  delete(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.activityService.delete(userId, id);
  }
}
