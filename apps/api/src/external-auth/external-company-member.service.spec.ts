import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { BusinessActivityLogService } from '../common/activity-log/business-activity-log.service';
import { PrismaService } from '../prisma/prisma.service';
import { CompanyContextService } from './company-context.service';
import type { CurrentExternalAccountPayload } from './decorators/current-external-account.decorator';
import { ExternalCompanyMemberService } from './external-company-member.service';

describe('ExternalCompanyMemberService', () => {
  let service: ExternalCompanyMemberService;
  let prisma: {
    companyUser: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      count: jest.Mock;
    };
    externalAccount: { findUnique: jest.Mock };
  };
  let companyContext: {
    resolveActiveMembership: jest.Mock;
    resolveOwnerMembership: jest.Mock;
  };
  let businessActivityLog: { record: jest.Mock };

  const owner: CurrentExternalAccountPayload = {
    id: 'external-owner',
    email: 'owner@example.com',
    fullName: 'Owner Contact',
    phone: null,
    status: 'active',
    emailVerifiedAt: null,
    lastLoginAt: null,
  };
  const companyId = 'company-1';
  const companyUserId = 'company-user-1';

  beforeEach(async () => {
    prisma = {
      companyUser: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn().mockResolvedValue(1),
      },
      externalAccount: { findUnique: jest.fn() },
    };
    companyContext = {
      resolveActiveMembership: jest.fn().mockResolvedValue({}),
      resolveOwnerMembership: jest.fn().mockResolvedValue({}),
    };
    businessActivityLog = { record: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ExternalCompanyMemberService,
        { provide: PrismaService, useValue: prisma },
        { provide: CompanyContextService, useValue: companyContext },
        { provide: BusinessActivityLogService, useValue: businessActivityLog },
      ],
    }).compile();

    service = moduleRef.get(ExternalCompanyMemberService);
  });

  describe('listMembers', () => {
    it('lists members scoped to the validated company for any active member', async () => {
      await service.listMembers(owner, companyId);

      expect(companyContext.resolveActiveMembership).toHaveBeenCalledWith(
        owner.id,
        companyId,
      );
      expect(prisma.companyUser.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { companyId } }),
      );
    });
  });

  describe('addMember', () => {
    it('is owner-only', async () => {
      companyContext.resolveOwnerMembership.mockRejectedValue(
        new ForbiddenException('Only a company owner may perform this action.'),
      );

      await expect(
        service.addMember(owner, companyId, { email: 'new@example.com' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.companyUser.create).not.toHaveBeenCalled();
    });

    it('creates a pending member with role=member for an existing account', async () => {
      prisma.externalAccount.findUnique.mockResolvedValue({
        id: 'external-new',
      });
      prisma.companyUser.findUnique.mockResolvedValue(null);
      prisma.companyUser.create.mockResolvedValue({ id: 'new-member-1' });

      const result = await service.addMember(owner, companyId, {
        email: 'new@example.com',
      });

      expect(prisma.companyUser.create).toHaveBeenCalledWith({
        data: {
          externalAccountId: 'external-new',
          companyId,
          role: 'member',
          status: 'pending',
        },
      });
      expect(businessActivityLog.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'member_invited' }),
      );
      expect(result).toEqual({ status: 'invited' });
    });

    it('returns the same generic response for an unknown email, without creating anything', async () => {
      prisma.externalAccount.findUnique.mockResolvedValue(null);

      const result = await service.addMember(owner, companyId, {
        email: 'unknown@example.com',
      });

      expect(prisma.companyUser.create).not.toHaveBeenCalled();
      expect(businessActivityLog.record).not.toHaveBeenCalled();
      expect(result).toEqual({ status: 'invited' });
    });

    it('returns the same generic response for an already-existing membership, without a crash or distinct error', async () => {
      prisma.externalAccount.findUnique.mockResolvedValue({
        id: 'external-existing',
      });
      prisma.companyUser.findUnique.mockResolvedValue({
        id: 'existing-membership',
      });

      const result = await service.addMember(owner, companyId, {
        email: 'already-member@example.com',
      });

      expect(prisma.companyUser.create).not.toHaveBeenCalled();
      expect(result).toEqual({ status: 'invited' });
    });
  });

  describe('updateMember', () => {
    it('requires at least one of status or role', async () => {
      await expect(
        service.updateMember(owner, companyId, companyUserId, {}),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(companyContext.resolveOwnerMembership).not.toHaveBeenCalled();
    });

    it('rejects a non-owner caller', async () => {
      companyContext.resolveOwnerMembership.mockRejectedValue(
        new ForbiddenException('Only a company owner may perform this action.'),
      );

      await expect(
        service.updateMember(owner, companyId, companyUserId, {
          status: 'active',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects a target that does not belong to the validated company', async () => {
      prisma.companyUser.findFirst.mockResolvedValue(null);

      await expect(
        service.updateMember(owner, companyId, companyUserId, {
          status: 'active',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.companyUser.findFirst).toHaveBeenCalledWith({
        where: { id: companyUserId, companyId },
      });
    });

    it('approves a pending member (pending -> active)', async () => {
      prisma.companyUser.findFirst.mockResolvedValue({
        id: companyUserId,
        role: 'member',
        status: 'pending',
      });
      prisma.companyUser.update.mockResolvedValue({
        id: companyUserId,
        externalAccountId: 'external-new',
        role: 'member',
        status: 'active',
      });

      await service.updateMember(owner, companyId, companyUserId, {
        status: 'active',
      });

      expect(prisma.companyUser.update).toHaveBeenCalledWith({
        where: { id: companyUserId },
        data: { status: 'active' },
      });
      expect(businessActivityLog.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'member_approved' }),
      );
    });

    it('rejects an active -> active no-op transition explicitly', async () => {
      prisma.companyUser.findFirst.mockResolvedValue({
        id: companyUserId,
        role: 'member',
        status: 'active',
      });

      await expect(
        service.updateMember(owner, companyId, companyUserId, {
          status: 'active',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.companyUser.update).not.toHaveBeenCalled();
    });

    it('rejects a suspended -> active transition explicitly', async () => {
      prisma.companyUser.findFirst.mockResolvedValue({
        id: companyUserId,
        role: 'member',
        status: 'suspended',
      });

      await expect(
        service.updateMember(owner, companyId, companyUserId, {
          status: 'active',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.companyUser.update).not.toHaveBeenCalled();
    });

    it('suspends an active member (active -> suspended)', async () => {
      prisma.companyUser.findFirst.mockResolvedValue({
        id: companyUserId,
        role: 'member',
        status: 'active',
      });
      prisma.companyUser.update.mockResolvedValue({
        id: companyUserId,
        externalAccountId: 'external-new',
        role: 'member',
        status: 'suspended',
      });

      await service.updateMember(owner, companyId, companyUserId, {
        status: 'suspended',
      });

      expect(businessActivityLog.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'member_suspended' }),
      );
    });

    it('refuses to suspend the last active owner', async () => {
      prisma.companyUser.findFirst.mockResolvedValue({
        id: companyUserId,
        role: 'owner',
        status: 'active',
      });
      prisma.companyUser.count.mockResolvedValue(0);

      await expect(
        service.updateMember(owner, companyId, companyUserId, {
          status: 'suspended',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.companyUser.update).not.toHaveBeenCalled();
    });

    it('changes a member role from member to owner', async () => {
      prisma.companyUser.findFirst.mockResolvedValue({
        id: companyUserId,
        role: 'member',
        status: 'active',
      });
      prisma.companyUser.update.mockResolvedValue({
        id: companyUserId,
        externalAccountId: 'external-new',
        role: 'owner',
        status: 'active',
      });

      await service.updateMember(owner, companyId, companyUserId, {
        role: 'owner',
      });

      expect(prisma.companyUser.update).toHaveBeenCalledWith({
        where: { id: companyUserId },
        data: { role: 'owner' },
      });
      expect(businessActivityLog.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'member_role_changed' }),
      );
    });

    it('refuses to demote the last active owner to member', async () => {
      prisma.companyUser.findFirst.mockResolvedValue({
        id: companyUserId,
        role: 'owner',
        status: 'active',
      });
      prisma.companyUser.count.mockResolvedValue(0);

      await expect(
        service.updateMember(owner, companyId, companyUserId, {
          role: 'member',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.companyUser.update).not.toHaveBeenCalled();
    });

    it('rejects setting the same role the member already has', async () => {
      prisma.companyUser.findFirst.mockResolvedValue({
        id: companyUserId,
        role: 'member',
        status: 'active',
      });

      await expect(
        service.updateMember(owner, companyId, companyUserId, {
          role: 'member',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.companyUser.update).not.toHaveBeenCalled();
    });
  });

  describe('removeMember', () => {
    it('removes a non-owner member (hard delete)', async () => {
      prisma.companyUser.findFirst.mockResolvedValue({
        id: companyUserId,
        role: 'member',
        status: 'active',
      });

      const result = await service.removeMember(
        owner,
        companyId,
        companyUserId,
      );

      expect(prisma.companyUser.delete).toHaveBeenCalledWith({
        where: { id: companyUserId },
      });
      expect(businessActivityLog.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'member_removed' }),
      );
      expect(result).toEqual({ removed: true });
    });

    it('refuses to remove the last active owner', async () => {
      prisma.companyUser.findFirst.mockResolvedValue({
        id: companyUserId,
        role: 'owner',
        status: 'active',
      });
      prisma.companyUser.count.mockResolvedValue(0);

      await expect(
        service.removeMember(owner, companyId, companyUserId),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.companyUser.delete).not.toHaveBeenCalled();
    });

    it('rejects a target from a different company', async () => {
      prisma.companyUser.findFirst.mockResolvedValue(null);

      await expect(
        service.removeMember(owner, companyId, 'someone-elses-company-user'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.companyUser.findFirst).toHaveBeenCalledWith({
        where: { id: 'someone-elses-company-user', companyId },
      });
      expect(prisma.companyUser.delete).not.toHaveBeenCalled();
    });
  });
});
