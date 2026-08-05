import { Injectable } from '@nestjs/common';
import { DEFAULT_LOCALE, type HomepageStatistic } from '@ppn/shared-types';
import { translate } from '../../common/utils/i18n.util';
import { PrismaService } from '../../prisma/prisma.service';
import type { ReplaceHomepageStatisticsDto } from './dto/homepage-statistic.dto';

@Injectable()
export class HomepageService {
  constructor(private readonly prisma: PrismaService) {}

  async findStatistics(
    locale: string = DEFAULT_LOCALE,
  ): Promise<HomepageStatistic[]> {
    const stats = await this.prisma.homepageStatistic.findMany({
      orderBy: { order: 'asc' },
    });
    // Explicit reshape (not a raw pass-through) — omits the raw `translations` blob from
    // the public response, matching the Product/Article/Facility mapper pattern.
    return stats.map((stat) => {
      const t = translate(stat, stat.translations, locale, ['label', 'value']);
      return {
        id: stat.id,
        label: t.label,
        value: t.value,
        icon: stat.icon,
        order: stat.order,
      };
    });
  }

  async replaceStatistics(dto: ReplaceHomepageStatisticsDto) {
    await this.prisma.$transaction([
      this.prisma.homepageStatistic.deleteMany({}),
      this.prisma.homepageStatistic.createMany({
        data: dto.statistics.map((stat, index) => ({
          label: stat.label,
          value: stat.value,
          icon: stat.icon,
          order: stat.order ?? index,
          translations: stat.translations,
        })),
      }),
    ]);
    return this.findStatistics();
  }
}
