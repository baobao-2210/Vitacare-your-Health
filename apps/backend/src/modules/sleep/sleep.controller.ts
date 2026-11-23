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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SleepService } from './sleep.service';
import { CreateSleepLogDto } from './dto/create-sleep-log.dto';
import { UpdateSleepLogDto } from './dto/update-sleep-log.dto';
import { SleepHistoryQueryDto } from './dto/sleep-history-query.dto';

@ApiTags('Sleep Tracking')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sleep')
export class SleepController {
  constructor(private readonly sleepService: SleepService) {}

  @Post()
  @ApiOperation({ summary: 'Ghi nhận bản ghi giấc ngủ (BR-SLEEP-01, 02, 03, 05)' })
  @ApiResponse({ status: 201, description: 'Ghi nhận giấc ngủ thành công' })
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateSleepLogDto,
  ) {
    return this.sleepService.create(userId, dto);
  }

  @Get('latest')
  @ApiOperation({ summary: 'Lấy thông tin giấc ngủ gần nhất và tiến độ mục tiêu' })
  @ApiResponse({ status: 200, description: 'Giấc ngủ gần nhất' })
  getLatest(@CurrentUser('id') userId: string) {
    return this.sleepService.getLatest(userId);
  }

  @Get('history')
  @ApiOperation({ summary: 'Lấy lịch sử và thống kê giấc ngủ' })
  @ApiResponse({ status: 200, description: 'Lịch sử giấc ngủ' })
  getHistory(
    @CurrentUser('id') userId: string,
    @Query() query: SleepHistoryQueryDto,
  ) {
    return this.sleepService.getHistory(userId, query);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Chỉnh sửa bản ghi giấc ngủ của mình (BR-SLEEP-04)' })
  @ApiResponse({ status: 200, description: 'Chỉnh sửa thành công' })
  update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSleepLogDto,
  ) {
    return this.sleepService.update(userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa bản ghi giấc ngủ của mình (BR-SLEEP-04)' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  delete(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.sleepService.delete(userId, id);
  }
}
