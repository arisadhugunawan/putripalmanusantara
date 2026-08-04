import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { ReplaceHomepageStatisticsDto } from './dto/homepage-statistic.dto';

@Injectable()
export class HomepageService {
  constructor(private readonly prisma: PrismaService) {}

  findStatistics() {
    return this.prisma.homepageStatistic.findMany({
      orderBy: { order: 'asc' },
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
        })),
      }),
    ]);
    return this.findStatistics();
  }
}
