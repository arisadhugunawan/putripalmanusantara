export type AdminRole = "super_admin" | "editor";

export interface AdminProfile {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  last_login_at: string | null;
}

export interface AdminLoginInput {
  email: string;
  password: string;
}

export interface AdminLoginResult {
  admin: AdminProfile;
}
