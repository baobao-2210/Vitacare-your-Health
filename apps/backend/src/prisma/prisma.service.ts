import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Kết nối PostgreSQL Database thành công qua Prisma Client.');
    } catch (error: any) {
      this.logger.warn(
        `⚠️ Chưa thể kết nối PostgreSQL Database (${error?.message ?? 'connection refused'}). Vui lòng kiểm tra DATABASE_URL khi khởi động production database.`,
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('🔌 Đã ngắt kết nối PostgreSQL Database.');
  }
}
