import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  CurrentExternalAccount,
  type CurrentExternalAccountPayload,
} from './decorators/current-external-account.decorator';
import { AddCompanyMemberDto } from './dto/add-company-member.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { UpdateCompanyMemberDto } from './dto/update-company-member.dto';
import { ExternalCompanyMemberService } from './external-company-member.service';
import { ExternalCompanyService } from './external-company.service';
import { ExternalJwtAuthGuard } from './external-jwt-auth.guard';

@Controller('api/v1/external/companies')
@UseGuards(ExternalJwtAuthGuard)
export class ExternalCompanyController {
  constructor(
    private readonly companyService: ExternalCompanyService,
    private readonly memberService: ExternalCompanyMemberService,
  ) {}

  @Get(':companyId')
  getProfile(
    @Param('companyId') companyId: string,
    @CurrentExternalAccount() account: CurrentExternalAccountPayload,
  ) {
    return this.companyService.getProfile(account, companyId);
  }

  @Patch(':companyId')
  updateProfile(
    @Param('companyId') companyId: string,
    @CurrentExternalAccount() account: CurrentExternalAccountPayload,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.companyService.updateProfile(account, companyId, dto);
  }

  @Get(':companyId/members')
  listMembers(
    @Param('companyId') companyId: string,
    @CurrentExternalAccount() account: CurrentExternalAccountPayload,
  ) {
    return this.memberService.listMembers(account, companyId);
  }

  @Post(':companyId/members')
  @HttpCode(HttpStatus.CREATED)
  addMember(
    @Param('companyId') companyId: string,
    @CurrentExternalAccount() account: CurrentExternalAccountPayload,
    @Body() dto: AddCompanyMemberDto,
  ) {
    return this.memberService.addMember(account, companyId, dto);
  }

  @Patch(':companyId/members/:companyUserId')
  updateMember(
    @Param('companyId') companyId: string,
    @Param('companyUserId') companyUserId: string,
    @CurrentExternalAccount() account: CurrentExternalAccountPayload,
    @Body() dto: UpdateCompanyMemberDto,
  ) {
    return this.memberService.updateMember(
      account,
      companyId,
      companyUserId,
      dto,
    );
  }

  @Delete(':companyId/members/:companyUserId')
  removeMember(
    @Param('companyId') companyId: string,
    @Param('companyUserId') companyUserId: string,
    @CurrentExternalAccount() account: CurrentExternalAccountPayload,
  ) {
    return this.memberService.removeMember(account, companyId, companyUserId);
  }
}
