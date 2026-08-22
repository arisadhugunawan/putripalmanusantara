import { Injectable } from '@nestjs/common';
import { ProductsService } from '../products/products.service';
import { AiSettingsService } from './ai-settings.service';

function normalizeWhatsAppNumber(raw: string): string {
  const digits = raw.replace(/[^\d]/g, '');
  return digits.startsWith('62')
    ? `+${digits}`
    : digits.startsWith('0')
      ? `+62${digits.slice(1)}`
      : `+${digits}`;
}

function buildWaLink(number: string, message: string): string {
  const digits = number.replace(/[^\d]/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/**
 * Context-aware WhatsApp link generation (brief §I/§AY) — shared by the floating WhatsApp
 * button and Product Quick Actions. `productSlug` present → the product-specific template with
 * `{product}` substituted; absent → the general template. Both templates are Admin-editable
 * (Settings → AI Assistant → WhatsApp), never hardcoded.
 */
@Injectable()
export class AiWhatsappService {
  constructor(
    private readonly settingsService: AiSettingsService,
    private readonly productsService: ProductsService,
  ) {}

  async generate(params: { productSlug?: string | null; language?: string }) {
    const settings = await this.settingsService.getOrCreateRaw();
    const number = normalizeWhatsAppNumber(settings.whatsappNumber);

    let message = settings.whatsappGeneralMessage;
    if (params.productSlug) {
      const product = await this.productsService
        .findPublishedBySlug(params.productSlug, params.language)
        .catch(() => null);
      if (product) {
        message = settings.whatsappProductMessage.replace(
          /\{product\}/g,
          product.name,
        );
      }
    }

    return {
      whatsapp_number: number,
      display_name: settings.whatsappDisplayName,
      message,
      url: buildWaLink(number, message),
      enabled: settings.whatsappEnabled,
    };
  }
}
