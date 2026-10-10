import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ActivityLogModule } from '../common/activity-log/activity-log.module';
import { parseDurationMs } from '../common/utils/duration.util';
import { BusinessRelationshipAccessService } from './business-relationship-access.service';
import { CompanyContextService } from './company-context.service';
import { ExternalAuthController } from './external-auth.controller';
import { ExternalAuthService } from './external-auth.service';
import { ExternalBusinessRelationshipController } from './external-business-relationship.controller';
import { ExternalBusinessRelationshipService } from './external-business-relationship.service';
import { ExternalCompanyController } from './external-company.controller';
import { ExternalCompanyMemberService } from './external-company-member.service';
import { ExternalCompanyService } from './external-company.service';
import { ExternalJwtStrategy } from './external-jwt.strategy';

/**
 * Deliberately a standalone module, never merged into the existing (Admin-only) `AuthModule` —
 * a shared module would risk two Passport strategies/JwtModule configurations colliding or
 * being accidentally interchangeable. Registers its own `JwtModule` with its own secret/
 * expiration (`EXTERNAL_JWT_SECRET`/`EXTERNAL_JWT_EXPIRES_IN`), entirely independent of Admin's.
 *
 * Exports `CompanyContextService` and `BusinessRelationshipAccessService` so future
 * domain modules (Sales, Procurement, Documents, etc.) can import this module to reuse the
 * same tenancy/authorization foundation rather than re-implementing it.
 */
@Module({
  imports: [
    PassportModule,
    ActivityLogModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('EXTERNAL_JWT_SECRET'),
        signOptions: {
          expiresIn: Math.floor(
            parseDurationMs(
              config.get<string>('EXTERNAL_JWT_EXPIRES_IN', '8h'),
              8 * 60 * 60 * 1000,
            ) / 1000,
          ),
        },
      }),
    }),
  ],
  controllers: [
    ExternalAuthController,
    ExternalCompanyController,
    ExternalBusinessRelationshipController,
  ],
  providers: [
    ExternalAuthService,
    ExternalJwtStrategy,
    CompanyContextService,
    BusinessRelationshipAccessService,
    ExternalCompanyService,
    ExternalCompanyMemberService,
    ExternalBusinessRelationshipService,
  ],
  exports: [
    ExternalAuthService,
    CompanyContextService,
    BusinessRelationshipAccessService,
  ],
})
export class ExternalAuthModule {}
