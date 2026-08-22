import { Module } from '@nestjs/common';
import { AdminContactPageController } from './admin-contact-page.controller';
import { ContactPageController } from './contact-page.controller';
import { ContactPageService } from './contact-page.service';

@Module({
  controllers: [ContactPageController, AdminContactPageController],
  providers: [ContactPageService],
  exports: [ContactPageService],
})
export class ContactPageModule {}
