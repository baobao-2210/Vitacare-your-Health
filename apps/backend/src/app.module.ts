import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProfileModule } from './modules/profile/profile.module';
import { WaterModule } from './modules/water/water.module';
import { SleepModule } from './modules/sleep/sleep.module';
import { ActivityModule } from './modules/activity/activity.module';
import { MedicationModule } from './modules/medication/medication.module';
import { NutritionModule } from './modules/nutrition/nutrition.module';
import { HealthRecordsModule } from './modules/health-records/health-records.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/backend/.env', '.env'],
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProfileModule,
    WaterModule,
    SleepModule,
    ActivityModule,
    MedicationModule,
    NutritionModule,
    HealthRecordsModule,
    DashboardModule,
    NotificationsModule,
  ],
})
export class AppModule {}
