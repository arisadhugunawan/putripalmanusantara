export interface SiteSetting {
  id: string;
  key: string;
  value: string;
  group: string;
}

/** GET /settings/public — subset of SiteSetting exposed to the public site */
export interface PublicSiteSettings {
  company_name: string;
  whatsapp_number: string;
  contact_email: string;
  contact_phone?: string;
  address?: string;
  operating_hours?: string;
  default_meta_title: string;
  default_meta_description: string;
  [key: string]: string | undefined;
}
