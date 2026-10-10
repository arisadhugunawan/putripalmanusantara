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
import type {
  ExternalLoginResult,
  ExternalRegisterResult,
} from '@ppn/shared-types';
import { BusinessActivityLogService } from '../common/activity-log/business-activity-log.service';
import { parseDurationMs } from '../common/utils/duration.util';
import {
  CurrentExternalAccount,
  type CurrentExternalAccountPayload,
} from './decorators/current-external-account.decorator';
import { ExternalLoginDto } from './dto/external-login.dto';
import { ExternalRegisterDto } from './dto/external-register.dto';
import { ExternalAuthService } from './external-auth.service';
import { ExternalJwtAuthGuard } from './external-jwt-auth.guard';

@Controller('api/v1/external/auth')
export class ExternalAuthController {
  constructor(
    private readonly externalAuthService: ExternalAuthService,
    private readonly config: ConfigService,
    private readonly businessActivityLog: BusinessActivityLogService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  // Same shape as Admin login's throttle (5 attempts / 15 minutes) — registration abuse is the
  // same class of risk as login brute-forcing.
  @Throttle({ default: { limit: 5, ttl: 15 * 60 * 1000 } })
  async register(
    @Body() dto: ExternalRegisterDto,
  ): Promise<ExternalRegisterResult> {
    return this.externalAuthService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 15 * 60 * 1000 } })
  async login(
    @Body() dto: ExternalLoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ExternalLoginResult> {
    const { token, account } = await this.externalAuthService.login(dto);

    const cookieName = this.config.get<string>(
      'EXTERNAL_JWT_COOKIE_NAME',
      'ppn_external_token',
    );
    const maxAge = parseDurationMs(
      this.config.get<string>('EXTERNAL_JWT_EXPIRES_IN', '8h'),
      8 * 60 * 60 * 1000,
    );

    res.cookie(cookieName, token, {
      httpOnly: true,
      secure: this.config.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax',
      maxAge,
      path: '/',
    });

    return { account };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ExternalJwtAuthGuard)
  logout(
    @CurrentExternalAccount() account: CurrentExternalAccountPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookieName = this.config.get<string>(
      'EXTERNAL_JWT_COOKIE_NAME',
      'ppn_external_token',
    );
    res.clearCookie(cookieName, { path: '/' });

    this.businessActivityLog.record({
      actorId: account.id,
      actorName: account.fullName,
      action: 'logout',
      entityType: 'ExternalAccount',
      entityId: account.id,
    });

    return { loggedOut: true };
  }

  @Get('me')
  @UseGuards(ExternalJwtAuthGuard)
  async me(@CurrentExternalAccount() account: CurrentExternalAccountPayload) {
    const memberships = await this.externalAuthService.listMemberships(
      account.id,
    );
    return { account, memberships };
  }
}
