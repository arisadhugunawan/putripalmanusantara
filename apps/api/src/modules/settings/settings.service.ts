import { Injectable } from '@nestjs/common';
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

  async findPublic() {
    const settings = await this.prisma.siteSetting.findMany({
      where: { key: { in: PUBLIC_KEYS } },
    });
    return Object.fromEntries(
      settings.map((setting) => [setting.key, setting.value]),
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
          update: { value: setting.value, group: setting.group },
          create: {
            key: setting.key,
            value: setting.value,
            group: setting.group,
          },
        }),
      ),
    );
    return this.findAllForAdmin();
  }
}
