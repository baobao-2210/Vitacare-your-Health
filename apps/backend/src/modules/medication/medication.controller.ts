import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MedicationService } from './medication.service';
import { CreateMedicationDto } from './dto/create-medication.dto';
import { UpdateMedicationDto } from './dto/update-medication.dto';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { ConfirmMedicationLogDto } from './dto/confirm-medication-log.dto';

@ApiTags('Medication Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('medications')
export class MedicationController {
  constructor(private readonly medicationService: MedicationService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo loại thuốc mới kèm lịch nhắc (BR-MED-01 -> 04)' })
  @ApiResponse({ status: 201, description: 'Tạo thuốc thành công' })
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateMedicationDto,
  ) {
    return this.medicationService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách các loại thuốc của người dùng' })
  @ApiResponse({ status: 200, description: 'Danh sách thuốc' })
  findAll(@CurrentUser('id') userId: string) {
    return this.medicationService.findAll(userId);
  }

  @Get('today')
  @ApiOperation({ summary: 'Lấy danh sách lịch uống thuốc cần thực hiện hôm nay' })
  @ApiResponse({ status: 200, description: 'Lịch thuốc hôm nay' })
  getTodaySchedule(@CurrentUser('id') userId: string) {
    return this.medicationService.getTodaySchedule(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết một loại thuốc' })
  @ApiResponse({ status: 200, description: 'Chi tiết thuốc' })
  findOne(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.medicationService.findOne(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Chỉnh sửa thông tin thuốc' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMedicationDto,
  ) {
    return this.medicationService.update(userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa hoặc chuyển trạng thái ngưng sử dụng thuốc (BR-MED-08)' })
  @ApiResponse({ status: 200, description: 'Xóa/ngưng thuốc thành công' })
  delete(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.medicationService.delete(userId, id);
  }

  @Post(':id/schedules')
  @ApiOperation({ summary: 'Thêm lịch nhắc uống cho một loại thuốc' })
  @ApiResponse({ status: 201, description: 'Thêm lịch thành công' })
  addSchedule(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateScheduleDto,
  ) {
    return this.medicationService.addSchedule(userId, id, dto);
  }

  @Post('logs/confirm')
  @ApiOperation({ summary: 'Xác nhận trạng thái uống thuốc hoặc bỏ qua (BR-MED-05, 06, 07)' })
  @ApiResponse({ status: 200, description: 'Ghi nhận trạng thái uống thuốc thành công' })
  confirmLog(
    @CurrentUser('id') userId: string,
    @Body() dto: ConfirmMedicationLogDto,
  ) {
    return this.medicationService.confirmLog(userId, dto);
  }
}
