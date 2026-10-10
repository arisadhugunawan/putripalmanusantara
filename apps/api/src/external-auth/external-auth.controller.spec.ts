import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { BusinessActivityLogService } from '../common/activity-log/business-activity-log.service';
import type { CurrentExternalAccountPayload } from './decorators/current-external-account.decorator';
import { ExternalAuthController } from './external-auth.controller';
import { ExternalAuthService } from './external-auth.service';

describe('ExternalAuthController', () => {
  let controller: ExternalAuthController;
  let externalAuthService: { listMemberships: jest.Mock };
  let businessActivityLog: { record: jest.Mock };
  let res: { cookie: jest.Mock; clearCookie: jest.Mock };

  const account: CurrentExternalAccountPayload = {
    id: 'external-1',
    email: 'buyer@example.com',
    fullName: 'Buyer Co Contact',
    phone: null,
    status: 'active',
    emailVerifiedAt: null,
    lastLoginAt: null,
  };

  beforeEach(async () => {
    businessActivityLog = { record: jest.fn() };
    res = { cookie: jest.fn(), clearCookie: jest.fn() };
    externalAuthService = { listMemberships: jest.fn().mockResolvedValue([]) };

    const moduleRef = await Test.createTestingModule({
      controllers: [ExternalAuthController],
      providers: [
        { provide: ExternalAuthService, useValue: externalAuthService },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('ppn_external_token') },
        },
        { provide: BusinessActivityLogService, useValue: businessActivityLog },
      ],
    }).compile();

    controller = moduleRef.get(ExternalAuthController);
  });

  it('me returns the currently authenticated external account and its memberships', async () => {
    const memberships = [
      {
        companyId: 'company-1',
        companyName: 'Buyer Co',
        role: 'owner',
        status: 'active',
      },
    ];
    externalAuthService.listMemberships.mockResolvedValue(memberships);

    const result = await controller.me(account);

    expect(externalAuthService.listMemberships).toHaveBeenCalledWith(
      account.id,
    );
    expect(result).toEqual({ account, memberships });
  });

  it('logout clears only the external cookie, never the admin cookie, and logs the event', () => {
    controller.logout(
      account,
      res as unknown as Parameters<typeof controller.logout>[1],
    );

    expect(res.clearCookie).toHaveBeenCalledWith('ppn_external_token', {
      path: '/',
    });
    expect(res.clearCookie).not.toHaveBeenCalledWith(
      'ppn_admin_token',
      expect.anything(),
    );
    expect(businessActivityLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: account.id, action: 'logout' }),
    );
  });
});
