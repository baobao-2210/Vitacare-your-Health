import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // 1. Bảo mật HTTP Headers & nén dữ liệu
  app.use(helmet());
  app.use(compression());

  // 2. Cấu hình CORS
  const frontendUrl = configService.get<string>('FRONTEND_URL', 'http://localhost:8081');
  app.enableCors({
    origin: [frontendUrl, 'http://localhost:3000', 'http://localhost:8081'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // 3. Global Prefix
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
  app.setGlobalPrefix(apiPrefix);

  // 4. Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // 5. Global Exception Filter & Transform Interceptor
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // 6. Cấu hình Swagger API Documentation
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('VitaCare API')
      .setDescription(
        'VitaCare – Your Health, Your Life API Documentation (Version 1.1)\n\n' +
          'Bao gồm các phân hệ: Authentication, Profile, Water, Sleep, Activity, Medication, Nutrition, Health Records, Dashboard, Notifications.',
      )
      .setVersion('1.1')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'Authorization',
          description: 'Nhập JWT Access Token (không cần tiền tố Bearer)',
          in: 'header',
        },
        'JWT-auth',
      )
      .addTag('Authentication', 'Xác thực tài khoản, phiên đăng nhập, JWT & Token Rotation')
      .addTag('Users', 'Quản lý người dùng')
      .addTag('Profile', 'Hồ sơ sức khỏe cá nhân')
      .addTag('Water Tracking', 'Theo dõi và thống kê lượng nước uống')
      .addTag('Sleep Tracking', 'Theo dõi thời lượng và chất lượng giấc ngủ')
      .addTag('Activity Tracking', 'Ghi nhận hoạt động thể chất và bước chân')
      .addTag('Medication Management', 'Quản lý thuốc, lịch nhắc và tuân thủ uống thuốc')
      .addTag('Nutrition Tracking', 'Nhật ký bữa ăn và snapshot thành phần dinh dưỡng')
      .addTag('Health Records', 'Chỉ số sức khỏe định kỳ và tệp y tế đính kèm')
      .addTag('Dashboard', 'Tổng hợp dữ liệu sức khỏe ngày hiện tại')
      .addTag('Notifications', 'Cài đặt và quản lý thông báo nhắc nhở')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);

  logger.log(`=======================================================`);
  logger.log(`🚀 VitaCare Backend API running on: http://localhost:${port}/${apiPrefix}`);
  logger.log(`📚 Swagger Documentation on: http://localhost:${port}/docs`);
  logger.log(`🌱 Environment: ${nodeEnv}`);
  logger.log(`=======================================================`);
}

bootstrap();
