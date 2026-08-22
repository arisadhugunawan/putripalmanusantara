import type { Media } from "./media";

/** Admin view — includes every slot regardless of enabled state, for the Brand & Logo editor. */
export interface SiteBranding {
  id: string;
  header_logo: Media | null;
  header_logo_enabled: boolean;
  header_logo_alt: string;
  footer_logo: Media | null;
  footer_logo_enabled: boolean;
  footer_logo_alt: string;
  mobile_logo: Media | null;
  use_mobile_logo: boolean;
  mobile_logo_alt: string;
  favicon: Media | null;
  product_header_background: Media | null;
  updated_at: string;
}

/** Public view — only the resolved logo each surface should actually render (mobile already
 * falls back to the header logo when no dedicated mobile logo is set/enabled; disabled slots
 * come through as null so the public site can fall back to the text wordmark). */
export interface PublicSiteBranding {
  header_logo: Media | null;
  header_logo_alt: string;
  footer_logo: Media | null;
  footer_logo_alt: string;
  mobile_logo: Media | null;
  mobile_logo_alt: string;
  favicon: Media | null;
  product_header_background: Media | null;
}
