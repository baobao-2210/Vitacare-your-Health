import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SetGoalDto } from './dto/set-goal.dto';
import dayjs from 'dayjs';

export interface BmiAnalysis {
  bmi: number;
  category: 'UNDERWEIGHT' | 'NORMAL' | 'OVERWEIGHT' | 'OBESE_1' | 'OBESE_2';
  categoryText: string;
  idealWeightMinKg: number;
  idealWeightMaxKg: number;
}

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tính toán chỉ số BMI và phân loại theo tiêu chuẩn WHO Châu Á - Thái Bình Dương
   */
  private calculateBmi(heightCm?: number | null, weightKg?: number | null): BmiAnalysis | null {
    if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) {
      return null;
    }

    const heightM = heightCm / 100;
    const bmiRaw = weightKg / (heightM * heightM);
    const bmi = Math.round(bmiRaw * 10) / 10;

    let category: BmiAnalysis['category'];
    let categoryText: string;

    if (bmi < 18.5) {
      category = 'UNDERWEIGHT';
      categoryText = 'Gầy / Thiếu cân';
    } else if (bmi < 23.0) {
      category = 'NORMAL';
      categoryText = 'Bình thường / Thể trạng tốt';
    } else if (bmi < 25.0) {
      category = 'OVERWEIGHT';
      categoryText = 'Thừa cân / Tiền béo phì';
    } else if (bmi < 30.0) {
      category = 'OBESE_1';
      categoryText = 'Béo phì độ 1';
    } else {
      category = 'OBESE_2';
      categoryText = 'Béo phì độ 2 (Nguy hiểm)';
    }

    // Phạm vi cân nặng lý tưởng (BMI 18.5 - 22.9)
    const idealWeightMinKg = Math.round(18.5 * heightM * heightM * 10) / 10;
    const idealWeightMaxKg = Math.round(22.9 * heightM * heightM * 10) / 10;

    return {
      bmi,
      category,
      categoryText,
      idealWeightMinKg,
      idealWeightMaxKg,
    };
  }

  /**
   * Lấy thông tin tài khoản, hồ sơ thể chất và chỉ số BMI
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        timezone: true,
        createdAt: true,
        healthProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại.');
    }

    const height = user.healthProfile?.heightCm ? Number(user.healthProfile.heightCm) : null;
    const weight = user.healthProfile?.weightKg ? Number(user.healthProfile.weightKg) : null;

    // Tính tuổi nếu có ngày sinh
    let age: number | null = null;
    if (user.healthProfile?.dateOfBirth) {
      age = dayjs().diff(dayjs(user.healthProfile.dateOfBirth), 'year');
    }

    const bmiAnalysis = this.calculateBmi(height, weight);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        timezone: user.timezone,
        createdAt: user.createdAt,
      },
      healthProfile: user.healthProfile ? {
        id: user.healthProfile.id,
        dateOfBirth: user.healthProfile.dateOfBirth,
        age,
        heightCm: height,
        weightKg: weight,
        gender: user.healthProfile.gender,
        avatarUrl: user.healthProfile.avatarUrl,
        updatedAt: user.healthProfile.updatedAt,
      } : null,
      bmiAnalysis,
    };
  }

  /**
   * Cập nhật hồ sơ thể chất và thông tin cá nhân
   */
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    // 1. Cập nhật thông tin User nếu có
    if (dto.fullName || dto.timezone) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(dto.fullName && { fullName: dto.fullName }),
          ...(dto.timezone && { timezone: dto.timezone }),
        },
      });
    }

    // 2. Cập nhật hồ sơ thể chất HealthProfile (Upsert)
    const profile = await this.prisma.healthProfile.upsert({
      where: { userId },
      create: {
        userId,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
        heightCm: dto.heightCm !== undefined ? dto.heightCm : null,
        weightKg: dto.weightKg !== undefined ? dto.weightKg : null,
        gender: dto.gender || null,
        avatarUrl: dto.avatarUrl || null,
      },
      update: {
        ...(dto.dateOfBirth !== undefined && {
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
        }),
        ...(dto.heightCm !== undefined && { heightCm: dto.heightCm }),
        ...(dto.weightKg !== undefined && { weightKg: dto.weightKg }),
        ...(dto.gender !== undefined && { gender: dto.gender }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
      },
    });

    return this.getProfile(userId);
  }

  /**
   * Lấy danh sách các mục tiêu sức khỏe đang hoạt động
   */
  async getGoals(userId: string) {
    return this.prisma.healthGoal.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Thiết lập / Cập nhật mục tiêu sức khỏe (BR-WATER-07, BR-ACT-01...)
   */
  async setGoal(userId: string, dto: SetGoalDto) {
    const startDate = dto.startDate ? new Date(dto.startDate) : new Date();
    const endDate = dto.endDate ? new Date(dto.endDate) : null;

    // Sử dụng transaction: vô hiệu hóa mục tiêu cũ cùng loại, tạo mục tiêu mới
    return this.prisma.$transaction(async (tx) => {
      await tx.healthGoal.updateMany({
        where: {
          userId,
          goalType: dto.goalType,
          isActive: true,
        },
        data: { isActive: false },
      });

      const newGoal = await tx.healthGoal.create({
        data: {
          userId,
          goalType: dto.goalType,
          targetValue: dto.targetValue,
          unit: dto.unit,
          startDate,
          endDate,
          isActive: true,
        },
      });

      return newGoal;
    });
  }

  /**
   * Hủy kích hoạt một mục tiêu
   */
  async deactivateGoal(userId: string, goalId: string) {
    const goal = await this.prisma.healthGoal.findUnique({
      where: { id: goalId },
    });

    if (!goal) {
      throw new NotFoundException('Mục tiêu không tồn tại.');
    }

    if (goal.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền sửa mục tiêu của người khác.');
    }

    return this.prisma.healthGoal.update({
      where: { id: goalId },
      data: { isActive: false },
    });
  }
}
