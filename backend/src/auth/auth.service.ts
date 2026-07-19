import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto, ForgotPasswordDto } from './dto/auth.dto';
import { ApiResponse } from '../common/interfaces/api-response.interface';

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<ApiResponse> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException(
        'Email sudah terdaftar. Gunakan email lain atau login.',
      );
    }

    // Heuristic #5: Error Prevention — password hashing, never plain text
    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        role: dto.role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    await this.prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'REGISTER',
        entity: 'User',
        entityId: user.id,
      },
    });

    return {
      success: true,
      data: user,
      message: 'Registrasi berhasil. Silakan login.',
    };
  }

  async login(dto: LoginDto): Promise<ApiResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Email atau password salah.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email atau password salah.');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const accessToken = this.jwtService.sign(payload);

    await this.prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entity: 'User',
        entityId: user.id,
      },
    });

    return {
      success: true,
      data: {
        accessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      message: 'Login berhasil.',
    };
  }

  // Heuristic #2: Match Between System and the Real World — simple institutional email flow
  async forgotPassword(dto: ForgotPasswordDto): Promise<ApiResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      return {
        success: true,
        data: null,
        message:
          'Jika email terdaftar, instruksi reset password akan dikirim ke email institusi Anda.',
      };
    }

    // In production: queue email via BullMQ
    return {
      success: true,
      data: null,
      message:
        'Instruksi reset password telah dikirim ke email institusi Anda. Periksa inbox Anda.',
    };
  }

  async getProfile(userId: string): Promise<ApiResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        storageQuotaUsed: true,
        storageQuotaLimit: true,
        createdAt: true,
      },
    });

    return {
      success: true,
      data: user
        ? {
            ...user,
            storageQuotaUsed: user.storageQuotaUsed.toString(),
            storageQuotaLimit: user.storageQuotaLimit.toString(),
          }
        : null,
      message: 'Profil berhasil diambil.',
    };
  }
}
