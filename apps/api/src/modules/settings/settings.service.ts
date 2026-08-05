import { Injectable } from '@nestjs/common';
import { DEFAULT_LOCALE } from '@ppn/shared-types';
import { translate } from '../../common/utils/i18n.util';
import { PrismaService } from '../../prisma/prisma.service';
import type { UpdateSettingsDto } from './dto/settings.dto';

/** docs/06-architecture.md §7 — subset of SiteSetting safe to expose publicly. */
const PUBLIC_KEYS = [
  'company_name',
  'whatsapp_number',
  'contact_email',
  'contact_phone',
  'address',
  'operating_hours',
  'default_meta_title',
  'default_meta_description',
];

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findPublic(locale: string = DEFAULT_LOCALE) {
    const settings = await this.prisma.siteSetting.findMany({
      where: { key: { in: PUBLIC_KEYS } },
    });
    return Object.fromEntries(
      settings.map((setting) => {
        const t = translate(setting, setting.translations, locale, ['value']);
        return [setting.key, t.value];
      }),
    );
  }

  findAllForAdmin() {
    return this.prisma.siteSetting.findMany({ orderBy: { group: 'asc' } });
  }

  async replace(dto: UpdateSettingsDto) {
    await this.prisma.$transaction(
      dto.settings.map((setting) =>
        this.prisma.siteSetting.upsert({
          where: { key: setting.key },
          update: {
            value: setting.value,
            group: setting.group,
            translations: setting.translations,
          },
          create: {
            key: setting.key,
            value: setting.value,
            group: setting.group,
            translations: setting.translations,
          },
        }),
      ),
    );
    return this.findAllForAdmin();
  }
}
