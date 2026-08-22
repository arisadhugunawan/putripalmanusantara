/**
 * `JwtAuthGuard`'s dev-only bypass (`ADMIN_AUTH_DISABLED=true`) is already gated on
 * `NODE_ENV !== 'production'` in the guard itself, but that's one `if` trusting one env value —
 * a misconfigured deploy that leaves the flag set would otherwise start up silently and grant
 * every request unauthenticated super_admin access. Fail loudly instead: refuse to boot at all
 * rather than trust that check alone.
 */
export function assertNoProductionAuthBypass(
  env: NodeJS.ProcessEnv = process.env,
): void {
  if (env.NODE_ENV === 'production' && env.ADMIN_AUTH_DISABLED === 'true') {
    throw new Error(
      'Refusing to start: ADMIN_AUTH_DISABLED=true while NODE_ENV=production. ' +
        'This flag disables all admin authentication and must never be set in production. ' +
        'Remove ADMIN_AUTH_DISABLED from the production environment and redeploy.',
    );
  }
}
