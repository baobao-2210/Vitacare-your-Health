import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import * as argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Băm SHA-256 chuỗi refresh token trước khi lưu vào database
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Loại bỏ các trường nhạy cảm trước khi trả về client
   */
  private sanitizeUser(user: any) {
    const { passwordHash, deletedAt, ...safeUser } = user;
    return safeUser;
  }

  /**
   * Cấp phát cặp Access Token & Refresh Token (Token Rotation)
   */
  private async generateTokens(
    user: { id: string; email: string },
    deviceInfo?: string,
  ) {
    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    const rawRefreshToken = uuidv4();
    const tokenHash = this.hashToken(rawRefreshToken);

    const refreshExpiresDays = 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshExpiresDays);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        deviceInfo: deviceInfo ?? null,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: this.config.get<string>('JWT_EXPIRES_IN', '15m'),
    };
  }

  /**
   * FR-AUTH-01: Đăng ký tài khoản
   */
  async register(dto: RegisterDto) {
    // BR-AUTH-01: Mỗi email chỉ được đăng ký một tài khoản
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email này đã được sử dụng.');
    }

    // BR-AUTH-04: Mật khẩu băm bằng Argon2id
    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
    });

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        timezone: dto.timezone || 'Asia/Ho_Chi_Minh',
        healthProfile: { create: {} },
      },
      include: {
        healthProfile: true,
      },
    });

    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  /**
   * FR-AUTH-02: Đăng nhập
   */
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        healthProfile: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác.');
    }

    // BR-AUTH-05: Kiểm tra tài khoản đã bị soft-delete
    if (user.deletedAt) {
      throw new UnauthorizedException('Tài khoản này đã bị xóa hoặc vô hiệu hóa.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Tài khoản hiện đang bị khóa.');
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác.');
    }

    const tokens = await this.generateTokens(user, dto.deviceInfo);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  /**
   * FR-AUTH-03: Đăng xuất phiên hiện tại
   */
  async logout(userId: string, refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);

    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return { message: 'Đăng xuất thành công.' };
  }

  /**
   * Đăng xuất khỏi toàn bộ các thiết bị (Revoke All Refresh Tokens)
   */
  async logoutAll(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return { message: 'Đã đăng xuất khỏi tất cả các thiết bị.' };
  }

  /**
   * Refresh Token Rotation
   */
  async refreshTokens(dto: RefreshTokenDto) {
    const tokenHash = this.hashToken(dto.refreshToken);

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Phiên đăng nhập đã hết hạn hoặc không hợp lệ.');
    }

    const user = storedToken.user;
    if (user.deletedAt || !user.isActive) {
      throw new UnauthorizedException('Tài khoản không hợp lệ hoặc đã bị khóa.');
    }

    // Thu hồi token cũ (Token Rotation)
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    // Cấp phát token mới
    return this.generateTokens(user, dto.deviceInfo ?? storedToken.deviceInfo ?? undefined);
  }

  /**
   * Lấy thông tin user hiện tại qua JWT Access Token
   */
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        healthProfile: true,
      },
    });

    if (!user || user.deletedAt || !user.isActive) {
      throw new UnauthorizedException('Người dùng không tồn tại hoặc đã bị khóa.');
    }

    return this.sanitizeUser(user);
  }
}
