import {
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { BusinessActivityLogService } from '../common/activity-log/business-activity-log.service';
import { PrismaService } from '../prisma/prisma.service';
import { ExternalAuthService } from './external-auth.service';

describe('ExternalAuthService', () => {
  let service: ExternalAuthService;
  let prisma: {
    externalAccount: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    companyUser: { findMany: jest.Mock };
  };
  let jwt: { sign: jest.Mock };
  let businessActivityLog: { record: jest.Mock };

  const storedAccount = {
    id: 'external-1',
    email: 'buyer@example.com',
    fullName: 'Buyer Co Contact',
    phone: null as string | null,
    status: 'active',
    passwordHash: bcrypt.hashSync('correct-password', 4),
    emailVerifiedAt: null as Date | null,
    lastLoginAt: null as Date | null,
  };

  beforeEach(async () => {
    prisma = {
      externalAccount: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn().mockResolvedValue(storedAccount),
      },
      companyUser: { findMany: jest.fn().mockResolvedValue([]) },
    };
    jwt = { sign: jest.fn().mockReturnValue('signed.external.jwt') };
    businessActivityLog = { record: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ExternalAuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
        { provide: BusinessActivityLogService, useValue: businessActivityLog },
      ],
    }).compile();

    service = moduleRef.get(ExternalAuthService);
  });

  describe('register', () => {
    it('creates only an ExternalAccount, never a Company or BusinessRelationship', async () => {
      prisma.externalAccount.findUnique.mockResolvedValue(null);
      prisma.externalAccount.create.mockResolvedValue({
        ...storedAccount,
        status: 'pending',
      });

      const result = await service.register({
        email: storedAccount.email,
        password: 'a-new-password',
        fullName: storedAccount.fullName,
      });

      /* eslint-disable @typescript-eslint/no-unsafe-assignment -- expect.* matchers are untyped by Jest's own types. */
      expect(prisma.externalAccount.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({ status: expect.anything() }),
        }),
      );
      /* eslint-enable @typescript-eslint/no-unsafe-assignment */
      expect(result.account.email).toBe(storedAccount.email);
      expect(businessActivityLog.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'register' }),
      );
    });

    it('rejects registration when the email is already in use', async () => {
      prisma.externalAccount.findUnique.mockResolvedValue(storedAccount);

      await expect(
        service.register({
          email: storedAccount.email,
          password: 'whatever123',
          fullName: 'Someone Else',
        }),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(prisma.externalAccount.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('rejects an unknown email without logging any activity', async () => {
      prisma.externalAccount.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'unknown@example.com', password: 'whatever' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(jwt.sign).not.toHaveBeenCalled();
      expect(businessActivityLog.record).not.toHaveBeenCalled();
    });

    it('rejects an invalid password with the identical generic message', async () => {
      prisma.externalAccount.findUnique.mockResolvedValue(storedAccount);

      await expect(
        service.login({
          email: storedAccount.email,
          password: 'wrong-password',
        }),
      ).rejects.toMatchObject({
        message: 'Invalid email or password.',
      });

      expect(jwt.sign).not.toHaveBeenCalled();
      expect(businessActivityLog.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'login_failed' }),
      );
    });

    it('rejects a correct password for a pending account', async () => {
      prisma.externalAccount.findUnique.mockResolvedValue({
        ...storedAccount,
        status: 'pending',
      });

      await expect(
        service.login({
          email: storedAccount.email,
          password: 'correct-password',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(jwt.sign).not.toHaveBeenCalled();
    });

    it('rejects a correct password for a suspended account', async () => {
      prisma.externalAccount.findUnique.mockResolvedValue({
        ...storedAccount,
        status: 'suspended',
      });

      await expect(
        service.login({
          email: storedAccount.email,
          password: 'correct-password',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(jwt.sign).not.toHaveBeenCalled();
    });

    it('issues a signed JWT and updates lastLoginAt for a valid, active login', async () => {
      prisma.externalAccount.findUnique.mockResolvedValue(storedAccount);

      const result = await service.login({
        email: storedAccount.email,
        password: 'correct-password',
      });

      expect(prisma.externalAccount.update).toHaveBeenCalledWith({
        where: { id: storedAccount.id },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- expect.any() is untyped by Jest's own types.
        data: { lastLoginAt: expect.any(Date) },
      });
      expect(jwt.sign).toHaveBeenCalledWith({
        sub: storedAccount.id,
        email: storedAccount.email,
      });
      expect(result.token).toBe('signed.external.jwt');
      expect(businessActivityLog.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'login_success' }),
      );
    });
  });

  describe('listMemberships', () => {
    it('maps each CompanyUser row to a membership summary', async () => {
      prisma.companyUser.findMany.mockResolvedValue([
        {
          companyId: 'company-1',
          role: 'owner',
          status: 'active',
          company: { name: 'Buyer Co' },
        },
      ]);

      const result = await service.listMemberships(storedAccount.id);

      expect(prisma.companyUser.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { externalAccountId: storedAccount.id },
        }),
      );
      expect(result).toEqual([
        {
          companyId: 'company-1',
          companyName: 'Buyer Co',
          role: 'owner',
          status: 'active',
        },
      ]);
    });
  });
});
