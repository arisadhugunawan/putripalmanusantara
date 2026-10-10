import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  CurrentExternalAccount,
  type CurrentExternalAccountPayload,
} from './decorators/current-external-account.decorator';
import { CreateBusinessRelationshipDto } from './dto/create-business-relationship.dto';
import { ExternalBusinessRelationshipService } from './external-business-relationship.service';
import { ExternalJwtAuthGuard } from './external-jwt-auth.guard';

@Controller('api/v1/external/companies')
@UseGuards(ExternalJwtAuthGuard)
export class ExternalBusinessRelationshipController {
  constructor(private readonly service: ExternalBusinessRelationshipService) {}

  @Get(':companyId/business-relationships')
  listRelationships(
    @Param('companyId') companyId: string,
    @CurrentExternalAccount() account: CurrentExternalAccountPayload,
  ) {
    return this.service.listRelationships(account, companyId);
  }

  @Post(':companyId/business-relationships')
  @HttpCode(HttpStatus.CREATED)
  requestRelationship(
    @Param('companyId') companyId: string,
    @CurrentExternalAccount() account: CurrentExternalAccountPayload,
    @Body() dto: CreateBusinessRelationshipDto,
  ) {
    return this.service.requestRelationship(account, companyId, dto);
  }
}
