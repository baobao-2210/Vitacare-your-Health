import {
  Controller,
  Get,
  Post,
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
import { NutritionService } from './nutrition.service';
import { CreateFoodItemDto } from './dto/create-food-item.dto';
import { CreateMealLogDto } from './dto/create-meal-log.dto';
import { MealHistoryQueryDto } from './dto/meal-history-query.dto';

@ApiTags('Nutrition Tracking')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('nutrition')
export class NutritionController {
  constructor(private readonly nutritionService: NutritionService) {}

  @Get('foods')
  @ApiOperation({ summary: 'Tìm kiếm thực phẩm trong danh mục hệ thống và của cá nhân' })
  @ApiQuery({ name: 'search', required: false, description: 'Từ khóa tìm kiếm tên món ăn' })
  @ApiResponse({ status: 200, description: 'Danh sách thực phẩm tìm thấy' })
  searchFoods(
    @CurrentUser('id') userId: string,
    @Query('search') search?: string,
  ) {
    return this.nutritionService.searchFoods(userId, search);
  }

  @Post('foods')
  @ApiOperation({ summary: 'Người dùng tạo món ăn mới cho riêng mình (BR-NUT-06)' })
  @ApiResponse({ status: 201, description: 'Tạo thực phẩm thành công' })
  createFoodItem(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateFoodItemDto,
  ) {
    return this.nutritionService.createFoodItem(userId, dto);
  }

  @Post('meals')
  @ApiOperation({ summary: 'Ghi nhận bữa ăn mới kèm tính toán calo và macro snapshot (BR-NUT-01 -> 05)' })
  @ApiResponse({ status: 201, description: 'Ghi nhận bữa ăn thành công' })
  createMeal(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateMealLogDto,
  ) {
    return this.nutritionService.createMeal(userId, dto);
  }

  @Get('meals/today')
  @ApiOperation({ summary: 'Xem thống kê dinh dưỡng và danh sách bữa ăn hôm nay' })
  @ApiResponse({ status: 200, description: 'Thống kê dinh dưỡng hôm nay' })
  getToday(@CurrentUser('id') userId: string) {
    return this.nutritionService.getToday(userId);
  }

  @Get('meals/history')
  @ApiOperation({ summary: 'Xem lịch sử bữa ăn theo khoảng thời gian' })
  @ApiResponse({ status: 200, description: 'Lịch sử bữa ăn' })
  getHistory(
    @CurrentUser('id') userId: string,
    @Query() query: MealHistoryQueryDto,
  ) {
    return this.nutritionService.getHistory(userId, query);
  }

  @Get('meals/:id')
  @ApiOperation({ summary: 'Xem chi tiết một bữa ăn' })
  @ApiResponse({ status: 200, description: 'Chi tiết bữa ăn' })
  getMeal(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.nutritionService.getMeal(userId, id);
  }

  @Delete('meals/:id')
  @ApiOperation({ summary: 'Xóa một bữa ăn (BR-NUT-07)' })
  @ApiResponse({ status: 200, description: 'Xóa bữa ăn thành công' })
  deleteMeal(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.nutritionService.deleteMeal(userId, id);
  }
}
