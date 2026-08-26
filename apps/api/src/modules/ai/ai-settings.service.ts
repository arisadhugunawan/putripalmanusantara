import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { toAiSettings, toPublicAiSettings } from './ai-settings.mapper';
import type { UpdateAiSettingsDto } from './dto/ai-settings.dto';
import type { AiSettingsModel } from '../../../generated/prisma/models';

@Injectable()
export class AiSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Raw Prisma model — used internally by `AiSyncService`/`AiChatService`, which need the
   * `include_*` toggles and `business_instructions` that never leave the server.
   *
   * P1-6 — `upsert()` on the `singleton` marker (always `true`, `@unique`) closes the
   * findFirst()-then-create() TOCTOU race: two concurrent calls now resolve to the SAME
   * database-enforced row instead of racing to create two. */
  async getOrCreateRaw(): Promise<AiSettingsModel> {
    return this.prisma.aiSettings.upsert({
      where: { singleton: true },
      create: { singleton: true },
      update: {},
    });
  }

  async findForAdmin() {
    return toAiSettings(await this.getOrCreateRaw());
  }

  async findPublic() {
    return toPublicAiSettings(await this.getOrCreateRaw());
  }

  async update(dto: UpdateAiSettingsDto) {
    const existing = await this.getOrCreateRaw();
    const updated = await this.prisma.aiSettings.update({
      where: { id: existing.id },
      data: {
        enabled: dto.enabled,
        assistantName: dto.assistant_name,
        subtitle: dto.subtitle,
        desktopEnabled: dto.desktop_enabled,
        mobileEnabled: dto.mobile_enabled,
        businessInstructions: dto.business_instructions,
        includeHome: dto.include_home,
        includeAboutCompany: dto.include_about_company,
        includeProducts: dto.include_products,
        includeFacilities: dto.include_facilities,
        includeMoqPaymentTerms: dto.include_moq_payment_terms,
        includeShipmentTerms: dto.include_shipment_terms,
        includeFaq: dto.include_faq,
        includeGallery: dto.include_gallery,
        includeNews: dto.include_news,
        includeContact: dto.include_contact,
        includeLegalCertificates: dto.include_legal_certificates,
        whatsappEnabled: dto.whatsapp_enabled,
        whatsappNumber: dto.whatsapp_number,
        whatsappDisplayName: dto.whatsapp_display_name,
        whatsappGeneralMessage: dto.whatsapp_general_message,
        whatsappProductMessage: dto.whatsapp_product_message,
      },
    });
    return toAiSettings(updated);
  }
}
