import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import type { ExternalAccountProfile } from '@ppn/shared-types';
import { BusinessActivityLogService } from '../common/activity-log/business-activity-log.service';
import { PrismaService } from '../prisma/prisma.service';
import type { ExternalLoginDto } from './dto/external-login.dto';
import type { ExternalRegisterDto } from './dto/external-register.dto';
import type { ExternalJwtPayload } from './external-jwt-payload.interface';

// Matches the existing project convention (prisma/seed.ts: `bcrypt.hash(password, 12)`) — never
// invented fresh here.
const BCRYPT_SALT_ROUNDS = 12;

export interface ExternalAccountMembershipSummary {
  companyId: string;
  companyName: string;
  role: string;
  status: string;
}

function toProfile(account: {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  status: string;
  emailVerifiedAt: Date | null;
  lastLoginAt: Date | null;
}): ExternalAccountProfile {
  return {
    id: account.id,
    email: account.email,
    full_name: account.fullName,
    phone: account.phone,
    status: account.status as ExternalAccountProfile['status'],
    email_verified_at: account.emailVerifiedAt
      ? account.emailVerifiedAt.toISOString()
      : null,
    last_login_at: account.lastLoginAt
      ? account.lastLoginAt.toISOString()
      : null,
  };
}

@Injectable()
export class ExternalAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly businessActivityLog: BusinessActivityLogService,
  ) {}

  async register(
    dto: ExternalRegisterDto,
  ): Promise<{ account: ExternalAccountProfile }> {
    const existing = await this.prisma.externalAccount.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('An account with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

    // Deliberately creates ONLY the ExternalAccount — no Company, no BusinessRelationship.
    // Those are separate, explicit steps a future onboarding flow builds on top of this.
    const account = await this.prisma.externalAccount.create({
      data: {
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        phone: dto.phone ?? null,
        // status defaults to `pending` at the schema level — not set explicitly here, so a
        // future change to that default is honored automatically rather than silently
        // overridden by this service.
      },
    });

    this.businessActivityLog.record({
      actorId: account.id,
      actorName: account.fullName,
      action: 'register',
      entityType: 'ExternalAccount',
      entityId: account.id,
    });

    return { account: toProfile(account) };
  }

  async login(
    dto: ExternalLoginDto,
  ): Promise<{ token: string; account: ExternalAccountProfile }> {
    const account = await this.prisma.externalAccount.findUnique({
      where: { email: dto.email },
    });
    if (!account) {
      // Unknown email: no actorId exists to log against — per the established convention
      // (AdminActivityLog never invents a fake actor either), this attempt is not logged.
      throw new UnauthorizedException('Invalid email or password.');
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      account.passwordHash,
    );
    if (!passwordMatches) {
      this.businessActivityLog.record({
        actorId: account.id,
        actorName: account.fullName,
        action: 'login_failed',
        entityType: 'ExternalAccount',
        entityId: account.id,
      });
      // Identical message/status to the unknown-email case above — a wrong password must never
      // be distinguishable from an unknown email, so an attacker gains no account-existence
      // signal before proving they already know valid credentials.
      throw new UnauthorizedException('Invalid email or password.');
    }

    // The password is now proven correct, so a status-specific message here is no longer an
    // account-enumeration risk (the caller already demonstrated they own these credentials) —
    // unlike the two branches above, which must stay indistinguishable.
    if (account.status !== 'active') {
      this.businessActivityLog.record({
        actorId: account.id,
        actorName: account.fullName,
        action: 'login_failed',
        entityType: 'ExternalAccount',
        entityId: account.id,
      });
      throw new ForbiddenException(
        account.status === 'pending'
          ? 'Your account is pending approval.'
          : 'Your account has been suspended.',
      );
    }

    const updated = await this.prisma.externalAccount.update({
      where: { id: account.id },
      data: { lastLoginAt: new Date() },
    });

    const payload: ExternalJwtPayload = {
      sub: account.id,
      email: account.email,
    };
    const token = this.jwt.sign(payload);

    this.businessActivityLog.record({
      actorId: account.id,
      actorName: account.fullName,
      action: 'login_success',
      entityType: 'ExternalAccount',
      entityId: account.id,
    });

    return { token, account: toProfile(updated) };
  }

  /** Phase 17B's "external self/profile extension" — `/me` grows a `memberships` list covering
   * every company this account belongs to, across any status, so the portal can show pending
   * invitations too. Each row is a direct, per-request query — nothing here is cached or
   * trusted from the JWT. */
  async listMemberships(
    externalAccountId: string,
  ): Promise<ExternalAccountMembershipSummary[]> {
    const memberships = await this.prisma.companyUser.findMany({
      where: { externalAccountId },
      include: { company: { select: { name: true } } },
      orderBy: { createdAt: 'asc' },
    });

    return memberships.map((membership) => ({
      companyId: membership.companyId,
      companyName: membership.company.name,
      role: membership.role,
      status: membership.status,
    }));
  }
}
