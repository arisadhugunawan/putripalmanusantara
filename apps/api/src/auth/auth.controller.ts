import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import type { AdminLoginResult } from '@ppn/shared-types';
import { ActivityLogService } from '../common/activity-log/activity-log.service';
import { CurrentAdmin } from '../common/decorators/current-admin.decorator';
import type { CurrentAdminPayload } from '../common/decorators/current-admin.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { parseDurationMs } from '../common/utils/duration.util';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('api/v1/admin/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
    private readonly activityLog: ActivityLogService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 15 * 60 * 1000 } })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AdminLoginResult> {
    const { token, admin } = await this.authService.login(dto);

    const cookieName = this.config.get<string>(
      'JWT_COOKIE_NAME',
      'ppn_admin_token',
    );
    const maxAge = parseDurationMs(
      this.config.get<string>('JWT_EXPIRES_IN', '8h'),
      8 * 60 * 60 * 1000,
    );

    res.cookie(cookieName, token, {
      httpOnly: true,
      secure: this.config.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax',
      maxAge,
      path: '/',
    });

    this.activityLog.record({
      actorId: admin.id,
      actorName: admin.name,
      actorRole: admin.role,
      action: 'LOGIN',
      module: 'auth',
      method: 'POST',
      path: '/api/v1/admin/auth/login',
      statusCode: HttpStatus.OK,
    });

    return { admin };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  logout(@Res({ passthrough: true }) res: Response) {
    const cookieName = this.config.get<string>(
      'JWT_COOKIE_NAME',
      'ppn_admin_token',
    );
    res.clearCookie(cookieName, { path: '/' });
    return { loggedOut: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentAdmin() admin: CurrentAdminPayload) {
    return { admin };
  }
}
