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
import { HealthRecordsService } from './health-records.service';
import { CreateHealthRecordDto } from './dto/create-health-record.dto';
import { UpdateHealthRecordDto } from './dto/update-health-record.dto';
import { HealthRecordQueryDto } from './dto/health-record-query.dto';

@ApiTags('Health Records & Attachments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('health-records')
export class HealthRecordsController {
  constructor(private readonly healthRecordsService: HealthRecordsService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo bản ghi chỉ số sức khỏe mới (BR-REC-01 -> 04)' })
  @ApiResponse({ status: 201, description: 'Tạo bản ghi thành công' })
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateHealthRecordDto,
  ) {
    return this.healthRecordsService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Tra cứu danh sách chỉ số sức khỏe theo bộ lọc' })
  @ApiResponse({ status: 200, description: 'Danh sách chỉ số sức khỏe' })
  findAll(
    @CurrentUser('id') userId: string,
    @Query() query: HealthRecordQueryDto,
  ) {
    return this.healthRecordsService.findAll(userId, query);
  }

  @Get('latest')
  @ApiOperation({ summary: 'Lấy các chỉ số sức khỏe đo gần nhất cho từng loại' })
  @ApiResponse({ status: 200, description: 'Các chỉ số gần nhất' })
  findLatestByType(@CurrentUser('id') userId: string) {
    return this.healthRecordsService.findLatestByType(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết một bản ghi chỉ số sức khỏe' })
  @ApiResponse({ status: 200, description: 'Chi tiết bản ghi' })
  findOne(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.healthRecordsService.findOne(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Chỉnh sửa một bản ghi chỉ số sức khỏe' })
  @ApiResponse({ status: 200, description: 'Cập nhật bản ghi thành công' })
  update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateHealthRecordDto,
  ) {
    return this.healthRecordsService.update(userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa một bản ghi chỉ số sức khỏe (BR-REC-05)' })
  @ApiResponse({ status: 200, description: 'Xóa bản ghi thành công' })
  delete(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.healthRecordsService.delete(userId, id);
  }
}
