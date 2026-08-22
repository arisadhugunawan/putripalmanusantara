import { deriveAction, deriveModule } from './activity-log.interceptor';

describe('deriveModule', () => {
  it('extracts the segment right after /api/v1/admin/', () => {
    expect(deriveModule('/api/v1/admin/products/abc123')).toBe('products');
    expect(deriveModule('/api/v1/admin/ai/settings')).toBe('ai');
  });

  it('falls back to "unknown" for a path with no recognizable admin segment', () => {
    expect(deriveModule('/api/v1/contact')).toBe('unknown');
  });
});

describe('deriveAction', () => {
  it('recognizes publish/unpublish/restore/logout suffixes regardless of module', () => {
    expect(
      deriveAction('PUT', '/api/v1/admin/products/1/publish', 'products'),
    ).toBe('PUBLISH');
    expect(
      deriveAction('PUT', '/api/v1/admin/homepage/unpublish', 'homepage'),
    ).toBe('UNPUBLISH');
    expect(
      deriveAction('POST', '/api/v1/admin/homepage/restore/5', 'homepage'),
    ).toBe('RESTORE');
    expect(deriveAction('POST', '/api/v1/admin/auth/logout', 'auth')).toBe(
      'LOGOUT',
    );
  });

  it('labels AI settings updates and syncs distinctly from generic CRUD', () => {
    expect(deriveAction('PUT', '/api/v1/admin/ai/settings', 'ai')).toBe(
      'AI_SETTINGS_UPDATE',
    );
    expect(deriveAction('POST', '/api/v1/admin/ai/sync', 'ai')).toBe('AI_SYNC');
  });

  it('labels media upload and delete distinctly from generic CRUD', () => {
    expect(deriveAction('POST', '/api/v1/admin/media', 'media')).toBe('UPLOAD');
    expect(deriveAction('DELETE', '/api/v1/admin/media/xyz', 'media')).toBe(
      'MEDIA_DELETE',
    );
  });

  it('labels a /status endpoint as STATUS_UPDATE', () => {
    expect(
      deriveAction(
        'PUT',
        '/api/v1/admin/quotation-requests/1/status',
        'quotation-requests',
      ),
    ).toBe('STATUS_UPDATE');
  });

  it('falls back to generic CREATE/UPDATE/DELETE by HTTP method', () => {
    expect(deriveAction('POST', '/api/v1/admin/products', 'products')).toBe(
      'CREATE',
    );
    expect(deriveAction('PUT', '/api/v1/admin/products/1', 'products')).toBe(
      'UPDATE',
    );
    expect(deriveAction('PATCH', '/api/v1/admin/products/1', 'products')).toBe(
      'UPDATE',
    );
    expect(deriveAction('DELETE', '/api/v1/admin/products/1', 'products')).toBe(
      'DELETE',
    );
  });
});
