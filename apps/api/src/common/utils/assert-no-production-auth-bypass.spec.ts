import { assertNoProductionAuthBypass } from './assert-no-production-auth-bypass';

describe('assertNoProductionAuthBypass', () => {
  it('throws when NODE_ENV=production and ADMIN_AUTH_DISABLED=true', () => {
    expect(() =>
      assertNoProductionAuthBypass({
        NODE_ENV: 'production',
        ADMIN_AUTH_DISABLED: 'true',
      }),
    ).toThrow(/Refusing to start/);
  });

  it('does not throw in production with the flag unset', () => {
    expect(() =>
      assertNoProductionAuthBypass({ NODE_ENV: 'production' }),
    ).not.toThrow();
  });

  it('does not throw in development even with the flag set', () => {
    expect(() =>
      assertNoProductionAuthBypass({
        NODE_ENV: 'development',
        ADMIN_AUTH_DISABLED: 'true',
      }),
    ).not.toThrow();
  });
});
