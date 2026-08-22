import { Controller, Get, Param } from '@nestjs/common';
import { PageHeaderService } from './page-header.service';

@Controller('api/v1/page-headers')
export class PageHeaderController {
  constructor(private readonly pageHeaderService: PageHeaderService) {}

  @Get(':pageKey')
  resolve(@Param('pageKey') pageKey: string) {
    return this.pageHeaderService.resolve(pageKey);
  }
}
