export type ExternalAccountStatus = "pending" | "active" | "suspended";

export interface ExternalAccountProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  status: ExternalAccountStatus;
  email_verified_at: string | null;
  last_login_at: string | null;
}

export interface ExternalLoginInput {
  email: string;
  password: string;
}

export interface ExternalLoginResult {
  account: ExternalAccountProfile;
}

export interface ExternalRegisterInput {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export interface ExternalRegisterResult {
  account: ExternalAccountProfile;
}
