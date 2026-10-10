import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ExternalJwtStrategy } from './external-jwt.strategy';

describe('ExternalJwtStrategy', () => {
  let strategy: ExternalJwtStrategy;
  let prisma: { externalAccount: { findUnique: jest.Mock } };

  const activeAccount = {
    id: 'external-1',
    email: 'buyer@example.com',
    fullName: 'Buyer Co Contact',
    phone: null as string | null,
    status: 'active',
    emailVerifiedAt: null as Date | null,
    lastLoginAt: null as Date | null,
  };

  beforeEach(async () => {
    prisma = { externalAccount: { findUnique: jest.fn() } };
    const config = {
      get: jest.fn().mockReturnValue('ppn_external_token'),
      getOrThrow: jest.fn().mockReturnValue('test-external-secret'),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ExternalJwtStrategy,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    strategy = moduleRef.get(ExternalJwtStrategy);
  });

  it('returns the current account payload when the account exists and is active', async () => {
    prisma.externalAccount.findUnique.mockResolvedValue(activeAccount);

    const result = await strategy.validate({
      sub: activeAccount.id,
      email: activeAccount.email,
    });

    expect(prisma.externalAccount.findUnique).toHaveBeenCalledWith({
      where: { id: activeAccount.id },
    });
    expect(result).toEqual(
      expect.objectContaining({ id: activeAccount.id, status: 'active' }),
    );
  });

  it('rejects when the account no longer exists', async () => {
    prisma.externalAccount.findUnique.mockResolvedValue(null);

    await expect(
      strategy.validate({ sub: 'gone', email: 'gone@example.com' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a suspended account', async () => {
    prisma.externalAccount.findUnique.mockResolvedValue({
      ...activeAccount,
      status: 'suspended',
    });

    await expect(
      strategy.validate({ sub: activeAccount.id, email: activeAccount.email }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a pending account', async () => {
    prisma.externalAccount.findUnique.mockResolvedValue({
      ...activeAccount,
      status: 'pending',
    });

    await expect(
      strategy.validate({ sub: activeAccount.id, email: activeAccount.email }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
