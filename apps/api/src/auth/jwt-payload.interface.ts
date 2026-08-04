export interface JwtPayload {
  sub: string;
  email: string;
  role: 'super_admin' | 'editor';
}
