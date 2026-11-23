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
import { WaterService } from './water.service';
import { CreateWaterLogDto } from './dto/create-water-log.dto';
import { UpdateWaterLogDto } from './dto/update-water-log.dto';
import { WaterHistoryQueryDto } from './dto/water-history-query.dto';

@ApiTags('Water Tracking')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('water')
export class WaterController {
  constructor(private readonly waterService: WaterService) {}

  @Post()
  @ApiOperation({ summary: 'Ghi nhận lượng nước uống (BR-WATER-01)' })
  @ApiResponse({ status: 201, description: 'Ghi nhận thành công' })
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateWaterLogDto,
  ) {
    return this.waterService.create(userId, dto);
  }

  @Get('today')
  @ApiOperation({ summary: 'Lấy tiến độ và danh sách nước uống hôm nay (BR-WATER-03, BR-WATER-04, BR-WATER-05)' })
  @ApiResponse({ status: 200, description: 'Thống kê lượng nước hôm nay' })
  getToday(@CurrentUser('id') userId: string) {
    return this.waterService.getToday(userId);
  }

  @Get('history')
  @ApiOperation({ summary: 'Lấy lịch sử uống nước theo khoảng thời gian' })
  @ApiResponse({ status: 200, description: 'Danh sách lịch sử theo ngày' })
  getHistory(
    @CurrentUser('id') userId: string,
    @Query() query: WaterHistoryQueryDto,
  ) {
    return this.waterService.getHistory(userId, query);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Chỉnh sửa bản ghi nước uống của mình (BR-WATER-06)' })
  @ApiResponse({ status: 200, description: 'Chỉnh sửa thành công' })
  update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWaterLogDto,
  ) {
    return this.waterService.update(userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa bản ghi nước uống của mình (BR-WATER-06)' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  delete(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.waterService.delete(userId, id);
  }
}
