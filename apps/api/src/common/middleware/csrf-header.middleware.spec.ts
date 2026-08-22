import type { NextFunction, Request, Response } from 'express';
import { csrfHeaderMiddleware } from './csrf-header.middleware';

function buildRequest(
  method: string,
  path: string,
  headers: Record<string, string> = {},
): Request {
  return {
    method,
    path,
    header: (name: string) => headers[name.toLowerCase()],
  } as unknown as Request;
}

interface FakeResponse {
  statusCode?: number;
  body?: unknown;
  status: (code: number) => FakeResponse;
  json: (body: unknown) => FakeResponse;
}

function buildResponse(): Response & FakeResponse {
  const res = {} as FakeResponse;
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (body: unknown) => {
    res.body = body;
    return res;
  };
  return res as unknown as Response & FakeResponse;
}

describe('csrfHeaderMiddleware', () => {
  it('lets a GET request through even without the header', () => {
    const next = jest.fn() as NextFunction;
    const res = buildResponse();
    csrfHeaderMiddleware(
      buildRequest('GET', '/api/v1/admin/products'),
      res,
      next,
    );
    expect(next).toHaveBeenCalled();
    expect(res.statusCode).toBeUndefined();
  });

  it('lets a non-admin route through even without the header', () => {
    const next = jest.fn() as NextFunction;
    const res = buildResponse();
    csrfHeaderMiddleware(buildRequest('POST', '/api/v1/contact'), res, next);
    expect(next).toHaveBeenCalled();
  });

  // The concrete scenario this exists for: a cross-site <form> POST can never set a custom
  // header, so it must be rejected before it reaches the route handler.
  it('rejects a mutating admin request with no X-Requested-With header', () => {
    const next = jest.fn() as NextFunction;
    const res = buildResponse();
    csrfHeaderMiddleware(
      buildRequest('POST', '/api/v1/admin/products'),
      res,
      next,
    );
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
    expect(res.body).toMatchObject({
      success: false,
      error: { code: 'CSRF_HEADER_MISSING' },
    });
  });

  it('allows a mutating admin request that carries the header', () => {
    const next = jest.fn() as NextFunction;
    const res = buildResponse();
    csrfHeaderMiddleware(
      buildRequest('DELETE', '/api/v1/admin/media/abc', {
        'x-requested-with': 'XMLHttpRequest',
      }),
      res,
      next,
    );
    expect(next).toHaveBeenCalled();
    expect(res.statusCode).toBeUndefined();
  });
});
