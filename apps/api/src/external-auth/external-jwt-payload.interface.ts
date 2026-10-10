/** Deliberately a separate shape from Admin's `JwtPayload` — never reused across the two
 * identity types (see `src/auth/jwt-payload.interface.ts` for the Admin equivalent). */
export interface ExternalJwtPayload {
  sub: string;
  email: string;
}
