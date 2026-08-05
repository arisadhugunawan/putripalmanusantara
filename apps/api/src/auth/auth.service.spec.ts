import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: { admin: { findUnique: jest.Mock; update: jest.Mock } };
  let jwt: { sign: jest.Mock };

  const storedAdmin = {
    id: 'admin-1',
    name: 'Admin PPN',
    email: 'admin@ppn.example',
    role: 'admin',
    passwordHash: bcrypt.hashSync('correct-password', 4),
    lastLoginAt: null as Date | null,
  };

  beforeEach(async () => {
    prisma = {
      admin: {
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue(storedAdmin),
      },
    };
    jwt = { sign: jest.fn().mockReturnValue('signed.jwt.token') };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  // FR-CMS-01 — no public registration, only a fixed admin can authenticate.
  it('rejects a login attempt for an email that does not exist', async () => {
    prisma.admin.findUnique.mockResolvedValue(null);

    await expect(
      service.login({ email: 'unknown@ppn.example', password: 'whatever' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(jwt.sign).not.toHaveBeenCalled();
  });

  it('rejects a login attempt with the wrong password', async () => {
    prisma.admin.findUnique.mockResolvedValue(storedAdmin);

    await expect(
      service.login({ email: storedAdmin.email, password: 'wrong-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(jwt.sign).not.toHaveBeenCalled();
  });

  it('issues a signed JWT and updates lastLoginAt on valid credentials', async () => {
    prisma.admin.findUnique.mockResolvedValue(storedAdmin);

    const result = await service.login({
      email: storedAdmin.email,
      password: 'correct-password',
    });

    expect(prisma.admin.update).toHaveBeenCalledWith({
      where: { id: storedAdmin.id },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- expect.any() is untyped by Jest's own types.
      data: { lastLoginAt: expect.any(Date) },
    });
    expect(jwt.sign).toHaveBeenCalledWith({
      sub: storedAdmin.id,
      email: storedAdmin.email,
      role: storedAdmin.role,
    });
    expect(result.token).toBe('signed.jwt.token');
    expect(result.admin).toEqual(
      expect.objectContaining({ id: storedAdmin.id, email: storedAdmin.email }),
    );
  });
});
