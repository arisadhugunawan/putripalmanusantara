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
  // Case-insensitive: a human hand-editing an env file is just as likely to type "True" or
  // "TRUE" as "true", and this fail-safe must catch all of them, not just an exact match.
  const authDisabled = env.ADMIN_AUTH_DISABLED?.trim().toLowerCase() === 'true';
  if (env.NODE_ENV === 'production' && authDisabled) {
    throw new Error(
      'Refusing to start: ADMIN_AUTH_DISABLED=true while NODE_ENV=production. ' +
        'This flag disables all admin authentication and must never be set in production. ' +
        'Remove ADMIN_AUTH_DISABLED from the production environment and redeploy.',
    );
  }
}
