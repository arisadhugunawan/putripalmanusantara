import type {
  AiSettings as SharedAiSettings,
  PublicAiSettings,
} from '@ppn/shared-types';
import type { AiSettingsModel as AiSettings } from '../../../generated/prisma/models';

export function toAiSettings(entry: AiSettings): SharedAiSettings {
  return {
    id: entry.id,
    enabled: entry.enabled,
    assistant_name: entry.assistantName,
    subtitle: entry.subtitle,
    desktop_enabled: entry.desktopEnabled,
    mobile_enabled: entry.mobileEnabled,
    business_instructions: entry.businessInstructions,
    include_home: entry.includeHome,
    include_about_company: entry.includeAboutCompany,
    include_products: entry.includeProducts,
    include_facilities: entry.includeFacilities,
    include_moq_payment_terms: entry.includeMoqPaymentTerms,
    include_shipment_terms: entry.includeShipmentTerms,
    include_faq: entry.includeFaq,
    include_gallery: entry.includeGallery,
    include_news: entry.includeNews,
    include_contact: entry.includeContact,
    include_legal_certificates: entry.includeLegalCertificates,
    whatsapp_enabled: entry.whatsappEnabled,
    whatsapp_number: entry.whatsappNumber,
    whatsapp_display_name: entry.whatsappDisplayName,
    whatsapp_general_message: entry.whatsappGeneralMessage,
    whatsapp_product_message: entry.whatsappProductMessage,
    updated_at: entry.updatedAt.toISOString(),
  };
}

export function toPublicAiSettings(entry: AiSettings): PublicAiSettings {
  return {
    enabled: entry.enabled,
    assistant_name: entry.assistantName,
    subtitle: entry.subtitle,
    desktop_enabled: entry.desktopEnabled,
    mobile_enabled: entry.mobileEnabled,
    whatsapp_enabled: entry.whatsappEnabled,
    whatsapp_number: entry.whatsappNumber,
    whatsapp_display_name: entry.whatsappDisplayName,
    whatsapp_general_message: entry.whatsappGeneralMessage,
    whatsapp_product_message: entry.whatsappProductMessage,
  };
}
