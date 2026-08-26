import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RevalidationService } from '../../revalidation/revalidation.service';
import { AboutCompanyService } from './about-company.service';
import { UpdateAboutCompanySectionDto } from './dto/about-company-section.dto';
import {
  AddFactoryGalleryItemDto,
  CreateFactoryDocumentDto,
  CreateFactoryVideoDto,
  UpdateFactoryDocumentDto,
  UpdateFactoryGalleryItemDto,
  UpdateFactoryProfileDto,
  UpdateFactoryVideoDto,
} from './dto/factory.dto';
import {
  AddFacilityGalleryItemDto,
  UpdateFacilityDto,
  UpdateFacilityGalleryItemDto,
} from './dto/facility.dto';
import { UpdateAboutCompanyFacilitiesSectionDto } from './dto/facilities-section.dto';
import {
  CreateMoqPaymentBusinessTermDto,
  CreateMoqPaymentQuickCardDto,
  UpdateAboutCompanyMoqPaymentSectionDto,
  UpdateMoqPaymentBusinessTermDto,
  UpdateMoqPaymentQuickCardDto,
} from './dto/moq-payment.dto';
import {
  CreateShipmentCommitmentItemDto,
  CreateShipmentContainerTypeDto,
  CreateShipmentDocumentDto,
  CreateShipmentLoadingLocationDto,
  CreateShipmentScheduleStepDto,
  CreateShippingArrangementItemDto,
  UpdateAboutCompanyShipmentTermsSectionDto,
  UpdateShipmentCommitmentItemDto,
  UpdateShipmentContainerTypeDto,
  UpdateShipmentDocumentDto,
  UpdateShipmentLoadingLocationDto,
  UpdateShipmentScheduleStepDto,
  UpdateShippingArrangementItemDto,
} from './dto/shipment-terms.dto';
import {
  CreateFacilitiesFaqItemDto,
  CreateFacilitiesFaqProductTagDto,
  UpdateAboutCompanyFacilitiesFaqSectionDto,
  UpdateFacilitiesFaqItemDto,
  UpdateFacilitiesFaqProductTagDto,
} from './dto/facilities-faq.dto';
import {
  CreateLegalDocumentCategoryDto,
  CreateLegalDocumentDto,
  UpdateAboutCompanyLegalSectionDto,
  UpdateLegalDocumentCategoryDto,
  UpdateLegalDocumentDto,
} from './dto/legal-document.dto';
import {
  AddAboutCompanyGalleryItemDto,
  CreateAboutCompanyFactDto,
  UpdateAboutCompanyFactDto,
  UpdateAboutCompanyGalleryItemDto,
  UpdateAboutCompanyProfileDto,
} from './dto/profile.dto';
import {
  CreateAboutCompanySocialLinkDto,
  SetCompanyProfileCountryVisibilityDto,
  UpdateAboutCompanySocialLinkDto,
} from './dto/social-link.dto';
import { UpdateAboutCompanySettingsDto } from './dto/settings.dto';
import {
  CreateTeamMemberDto,
  UpdateAboutCompanyTeamSectionDto,
  UpdateTeamMemberDto,
} from './dto/team-member.dto';
import {
  CreateWhatWeDoItemDto,
  UpdateWhatWeDoItemDto,
} from './dto/what-we-do.dto';
import { UpdateAboutCompanyWhatWeDoSectionDto } from './dto/what-we-supply-section.dto';
import {
  CreateWhoWeSupplyItemDto,
  UpdateWhoWeSupplyItemDto,
} from './dto/who-we-supply.dto';

@Controller('api/v1/admin/about-company')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminAboutCompanyController {
  constructor(
    private readonly aboutCompanyService: AboutCompanyService,
    private readonly revalidation: RevalidationService,
  ) {}

  // ── Profile + Gallery ────────────────────────────────────────────────────

  @Get('profile')
  findProfile() {
    return this.aboutCompanyService.findProfile();
  }

  @Put('profile')
  updateProfile(@Body() dto: UpdateAboutCompanyProfileDto) {
    return this.aboutCompanyService.updateProfile(dto);
  }

  @Get('profile/translation-status')
  getProfileTranslationStatus() {
    return this.aboutCompanyService.getProfileTranslationStatus();
  }

  @Post('profile/translations/generate')
  generateProfileTranslations() {
    return this.aboutCompanyService.generateProfileTranslations();
  }

  @Post('profile/gallery')
  addGalleryItem(@Body() dto: AddAboutCompanyGalleryItemDto) {
    return this.aboutCompanyService.addGalleryItem(dto);
  }

  @Put('profile/gallery/:id')
  updateGalleryItem(
    @Param('id') id: string,
    @Body() dto: UpdateAboutCompanyGalleryItemDto,
  ) {
    return this.aboutCompanyService.updateGalleryItem(id, dto);
  }

  @Delete('profile/gallery/:id')
  removeGalleryItem(@Param('id') id: string) {
    return this.aboutCompanyService.removeGalleryItem(id);
  }

  // ── Company Facts ────────────────────────────────────────────────────────

  @Get('facts')
  findFacts() {
    return this.aboutCompanyService.findFacts();
  }

  @Post('facts')
  createFact(@Body() dto: CreateAboutCompanyFactDto) {
    return this.aboutCompanyService.createFact(dto);
  }

  @Put('facts/:id')
  updateFact(@Param('id') id: string, @Body() dto: UpdateAboutCompanyFactDto) {
    return this.aboutCompanyService.updateFact(id, dto);
  }

  @Get('facts/:id/translation-status')
  getFactTranslationStatus(@Param('id') id: string) {
    return this.aboutCompanyService.getFactTranslationStatus(id);
  }

  @Post('facts/:id/translations/generate')
  generateFactTranslations(@Param('id') id: string) {
    return this.aboutCompanyService.generateFactTranslations(id);
  }

  @Delete('facts/:id')
  removeFact(@Param('id') id: string) {
    return this.aboutCompanyService.removeFact(id);
  }

  // ── "Connect With PPN" Social Links ─────────────────────────────────────

  @Get('social-links')
  findSocialLinks() {
    return this.aboutCompanyService.findSocialLinks();
  }

  @Post('social-links')
  createSocialLink(@Body() dto: CreateAboutCompanySocialLinkDto) {
    return this.aboutCompanyService.createSocialLink(dto);
  }

  @Put('social-links/:id')
  updateSocialLink(
    @Param('id') id: string,
    @Body() dto: UpdateAboutCompanySocialLinkDto,
  ) {
    return this.aboutCompanyService.updateSocialLink(id, dto);
  }

  @Delete('social-links/:id')
  removeSocialLink(@Param('id') id: string) {
    return this.aboutCompanyService.removeSocialLink(id);
  }

  // ── "Countries We Have Exported To" ─────────────────────────────────────

  @Get('company-profile-countries')
  findCompanyProfileCountries() {
    return this.aboutCompanyService.findCompanyProfileCountries();
  }

  @Put('company-profile-countries/:id')
  setCompanyProfileCountryVisibility(
    @Param('id') id: string,
    @Body() dto: SetCompanyProfileCountryVisibilityDto,
  ) {
    return this.aboutCompanyService.setCompanyProfileCountryVisibility(
      id,
      dto.show_in_company_profile,
    );
  }

  // ── Team ─────────────────────────────────────────────────────────────────

  @Get('team-section')
  findTeamSection() {
    return this.aboutCompanyService.findTeamSection();
  }

  @Put('team-section')
  updateTeamSection(@Body() dto: UpdateAboutCompanyTeamSectionDto) {
    return this.aboutCompanyService.updateTeamSection(dto);
  }

  @Get('team-section/translation-status')
  getTeamSectionTranslationStatus() {
    return this.aboutCompanyService.getTeamSectionTranslationStatus();
  }

  @Post('team-section/translations/generate')
  generateTeamSectionTranslations() {
    return this.aboutCompanyService.generateTeamSectionTranslations();
  }

  @Get('team-members')
  findTeamMembers() {
    return this.aboutCompanyService.findTeamMembers();
  }

  @Post('team-members')
  createTeamMember(@Body() dto: CreateTeamMemberDto) {
    return this.aboutCompanyService.createTeamMember(dto);
  }

  @Put('team-members/:id')
  updateTeamMember(@Param('id') id: string, @Body() dto: UpdateTeamMemberDto) {
    return this.aboutCompanyService.updateTeamMember(id, dto);
  }

  @Get('team-members/:id/translation-status')
  getTeamMemberTranslationStatus(@Param('id') id: string) {
    return this.aboutCompanyService.getTeamMemberTranslationStatus(id);
  }

  @Post('team-members/:id/translations/generate')
  generateTeamMemberTranslations(@Param('id') id: string) {
    return this.aboutCompanyService.generateTeamMemberTranslations(id);
  }

  @Delete('team-members/:id')
  removeTeamMember(@Param('id') id: string) {
    return this.aboutCompanyService.removeTeamMember(id);
  }

  @Post('team-members/:id/duplicate')
  duplicateTeamMember(@Param('id') id: string) {
    return this.aboutCompanyService.duplicateTeamMember(id);
  }

  // ── What We Do ───────────────────────────────────────────────────────────

  @Get('what-we-do-items')
  findWhatWeDoItems() {
    return this.aboutCompanyService.findWhatWeDoItems();
  }

  @Post('what-we-do-items')
  createWhatWeDoItem(@Body() dto: CreateWhatWeDoItemDto) {
    return this.aboutCompanyService.createWhatWeDoItem(dto);
  }

  @Put('what-we-do-items/:id')
  updateWhatWeDoItem(
    @Param('id') id: string,
    @Body() dto: UpdateWhatWeDoItemDto,
  ) {
    return this.aboutCompanyService.updateWhatWeDoItem(id, dto);
  }

  @Get('what-we-do-items/:id/translation-status')
  getWhatWeDoItemTranslationStatus(@Param('id') id: string) {
    return this.aboutCompanyService.getWhatWeDoItemTranslationStatus(id);
  }

  @Post('what-we-do-items/:id/translations/generate')
  generateWhatWeDoItemTranslations(@Param('id') id: string) {
    return this.aboutCompanyService.generateWhatWeDoItemTranslations(id);
  }

  @Delete('what-we-do-items/:id')
  removeWhatWeDoItem(@Param('id') id: string) {
    return this.aboutCompanyService.removeWhatWeDoItem(id);
  }

  @Post('what-we-do-items/:id/duplicate')
  duplicateWhatWeDoItem(@Param('id') id: string) {
    return this.aboutCompanyService.duplicateWhatWeDoItem(id);
  }

  @Get('what-we-do-section')
  findWhatWeDoSection() {
    return this.aboutCompanyService.findWhatWeDoSection();
  }

  @Put('what-we-do-section')
  updateWhatWeDoSection(@Body() dto: UpdateAboutCompanyWhatWeDoSectionDto) {
    return this.aboutCompanyService.updateWhatWeDoSection(dto);
  }

  @Get('what-we-do-section/translation-status')
  getWhatWeDoSectionTranslationStatus() {
    return this.aboutCompanyService.getWhatWeDoSectionTranslationStatus();
  }

  @Post('what-we-do-section/translations/generate')
  generateWhatWeDoSectionTranslations() {
    return this.aboutCompanyService.generateWhatWeDoSectionTranslations();
  }

  @Get('who-we-supply-items')
  findWhoWeSupplyItems() {
    return this.aboutCompanyService.findWhoWeSupplyItems();
  }

  @Post('who-we-supply-items')
  createWhoWeSupplyItem(@Body() dto: CreateWhoWeSupplyItemDto) {
    return this.aboutCompanyService.createWhoWeSupplyItem(dto);
  }

  @Put('who-we-supply-items/:id')
  updateWhoWeSupplyItem(
    @Param('id') id: string,
    @Body() dto: UpdateWhoWeSupplyItemDto,
  ) {
    return this.aboutCompanyService.updateWhoWeSupplyItem(id, dto);
  }

  @Get('who-we-supply-items/:id/translation-status')
  getWhoWeSupplyItemTranslationStatus(@Param('id') id: string) {
    return this.aboutCompanyService.getWhoWeSupplyItemTranslationStatus(id);
  }

  @Post('who-we-supply-items/:id/translations/generate')
  generateWhoWeSupplyItemTranslations(@Param('id') id: string) {
    return this.aboutCompanyService.generateWhoWeSupplyItemTranslations(id);
  }

  @Delete('who-we-supply-items/:id')
  removeWhoWeSupplyItem(@Param('id') id: string) {
    return this.aboutCompanyService.removeWhoWeSupplyItem(id);
  }

  // ── Legal & Certificate ──────────────────────────────────────────────────

  @Get('legal-section')
  findLegalSection() {
    return this.aboutCompanyService.findLegalSection();
  }

  @Put('legal-section')
  updateLegalSection(@Body() dto: UpdateAboutCompanyLegalSectionDto) {
    return this.aboutCompanyService.updateLegalSection(dto);
  }

  @Get('legal-section/translation-status')
  getLegalSectionTranslationStatus() {
    return this.aboutCompanyService.getLegalSectionTranslationStatus();
  }

  @Post('legal-section/translations/generate')
  generateLegalSectionTranslations() {
    return this.aboutCompanyService.generateLegalSectionTranslations();
  }

  @Get('legal-categories')
  findLegalCategories() {
    return this.aboutCompanyService.findLegalCategories();
  }

  @Post('legal-categories')
  createLegalCategory(@Body() dto: CreateLegalDocumentCategoryDto) {
    return this.aboutCompanyService.createLegalCategory(dto);
  }

  @Put('legal-categories/:id')
  updateLegalCategory(
    @Param('id') id: string,
    @Body() dto: UpdateLegalDocumentCategoryDto,
  ) {
    return this.aboutCompanyService.updateLegalCategory(id, dto);
  }

  @Get('legal-categories/:id/translation-status')
  getLegalCategoryTranslationStatus(@Param('id') id: string) {
    return this.aboutCompanyService.getLegalCategoryTranslationStatus(id);
  }

  @Post('legal-categories/:id/translations/generate')
  generateLegalCategoryTranslations(@Param('id') id: string) {
    return this.aboutCompanyService.generateLegalCategoryTranslations(id);
  }

  @Delete('legal-categories/:id')
  removeLegalCategory(@Param('id') id: string) {
    return this.aboutCompanyService.removeLegalCategory(id);
  }

  @Get('legal-documents')
  findLegalDocuments() {
    return this.aboutCompanyService.findLegalDocuments();
  }

  @Post('legal-documents')
  createLegalDocument(@Body() dto: CreateLegalDocumentDto) {
    return this.aboutCompanyService.createLegalDocument(dto);
  }

  @Put('legal-documents/:id')
  updateLegalDocument(
    @Param('id') id: string,
    @Body() dto: UpdateLegalDocumentDto,
  ) {
    return this.aboutCompanyService.updateLegalDocument(id, dto);
  }

  @Get('legal-documents/:id/translation-status')
  getLegalDocumentTranslationStatus(@Param('id') id: string) {
    return this.aboutCompanyService.getLegalDocumentTranslationStatus(id);
  }

  @Post('legal-documents/:id/translations/generate')
  generateLegalDocumentTranslations(@Param('id') id: string) {
    return this.aboutCompanyService.generateLegalDocumentTranslations(id);
  }

  @Delete('legal-documents/:id')
  removeLegalDocument(@Param('id') id: string) {
    return this.aboutCompanyService.removeLegalDocument(id);
  }

  @Post('legal-documents/:id/duplicate')
  duplicateLegalDocument(@Param('id') id: string) {
    return this.aboutCompanyService.duplicateLegalDocument(id);
  }

  // ── Factory (profile + gallery + documents) ──────────────────────────────

  @Get('factory')
  findFactory() {
    return this.aboutCompanyService.findFactory();
  }

  @Put('factory')
  updateFactory(@Body() dto: UpdateFactoryProfileDto) {
    return this.aboutCompanyService.updateFactory(dto);
  }

  @Get('factory/translation-status')
  getFactoryTranslationStatus() {
    return this.aboutCompanyService.getFactoryTranslationStatus();
  }

  @Post('factory/translations/generate')
  generateFactoryTranslations() {
    return this.aboutCompanyService.generateFactoryTranslations();
  }

  @Post('factory/gallery')
  addFactoryGalleryItem(@Body() dto: AddFactoryGalleryItemDto) {
    return this.aboutCompanyService.addFactoryGalleryItem(dto);
  }

  @Put('factory/gallery/:id')
  updateFactoryGalleryItem(
    @Param('id') id: string,
    @Body() dto: UpdateFactoryGalleryItemDto,
  ) {
    return this.aboutCompanyService.updateFactoryGalleryItem(id, dto);
  }

  @Delete('factory/gallery/:id')
  removeFactoryGalleryItem(@Param('id') id: string) {
    return this.aboutCompanyService.removeFactoryGalleryItem(id);
  }

  @Post('factory/documents')
  addFactoryDocument(@Body() dto: CreateFactoryDocumentDto) {
    return this.aboutCompanyService.addFactoryDocument(dto);
  }

  @Put('factory/documents/:id')
  updateFactoryDocument(
    @Param('id') id: string,
    @Body() dto: UpdateFactoryDocumentDto,
  ) {
    return this.aboutCompanyService.updateFactoryDocument(id, dto);
  }

  @Delete('factory/documents/:id')
  removeFactoryDocument(@Param('id') id: string) {
    return this.aboutCompanyService.removeFactoryDocument(id);
  }

  @Post('factory/videos')
  addFactoryVideo(@Body() dto: CreateFactoryVideoDto) {
    return this.aboutCompanyService.addFactoryVideo(dto);
  }

  @Put('factory/videos/:id')
  updateFactoryVideo(
    @Param('id') id: string,
    @Body() dto: UpdateFactoryVideoDto,
  ) {
    return this.aboutCompanyService.updateFactoryVideo(id, dto);
  }

  @Delete('factory/videos/:id')
  removeFactoryVideo(@Param('id') id: string) {
    return this.aboutCompanyService.removeFactoryVideo(id);
  }

  // ── Facilities (facility list + per-facility gallery) ────────────────────

  @Get('facilities-section')
  findFacilitiesSection() {
    return this.aboutCompanyService.findFacilitiesSection();
  }

  @Put('facilities-section')
  updateFacilitiesSection(@Body() dto: UpdateAboutCompanyFacilitiesSectionDto) {
    return this.aboutCompanyService.updateFacilitiesSection(dto);
  }

  @Get('facilities-section/translation-status')
  getFacilitiesSectionTranslationStatus() {
    return this.aboutCompanyService.getFacilitiesSectionTranslationStatus();
  }

  @Post('facilities-section/translations/generate')
  generateFacilitiesSectionTranslations() {
    return this.aboutCompanyService.generateFacilitiesSectionTranslations();
  }

  // Facility rows are a fixed 10-item master list (see README "Facilities master list") —
  // no create/delete/duplicate routes. Admin only manages each facility's photos below, plus
  // `cover_image_id` ("Set Main") via `updateFacility`.
  @Get('facilities')
  findFacilities() {
    return this.aboutCompanyService.findFacilities();
  }

  @Put('facilities/:id')
  updateFacility(@Param('id') id: string, @Body() dto: UpdateFacilityDto) {
    return this.aboutCompanyService.updateFacility(id, dto);
  }

  @Get('facilities/:id/translation-status')
  getFacilityTranslationStatus(@Param('id') id: string) {
    return this.aboutCompanyService.getFacilityTranslationStatus(id);
  }

  @Post('facilities/:id/translations/generate')
  generateFacilityTranslations(@Param('id') id: string) {
    return this.aboutCompanyService.generateFacilityTranslations(id);
  }

  @Post('facilities/:id/gallery')
  addFacilityGalleryItem(
    @Param('id') id: string,
    @Body() dto: AddFacilityGalleryItemDto,
  ) {
    return this.aboutCompanyService.addFacilityGalleryItem(id, dto);
  }

  @Put('facilities/gallery/:id')
  updateFacilityGalleryItem(
    @Param('id') id: string,
    @Body() dto: UpdateFacilityGalleryItemDto,
  ) {
    return this.aboutCompanyService.updateFacilityGalleryItem(id, dto);
  }

  @Delete('facilities/gallery/:id')
  removeFacilityGalleryItem(@Param('id') id: string) {
    return this.aboutCompanyService.removeFacilityGalleryItem(id);
  }

  // ── "Facilities → MOQ & Payment Terms" ────────────────────────────────────

  @Get('moq-payment-section')
  findMoqPaymentSection() {
    return this.aboutCompanyService.findMoqPaymentSection();
  }

  @Put('moq-payment-section')
  updateMoqPaymentSection(@Body() dto: UpdateAboutCompanyMoqPaymentSectionDto) {
    return this.aboutCompanyService.updateMoqPaymentSection(dto);
  }

  @Get('moq-payment-section/translation-status')
  getMoqPaymentSectionTranslationStatus() {
    return this.aboutCompanyService.getMoqPaymentSectionTranslationStatus();
  }

  @Post('moq-payment-section/translations/generate')
  generateMoqPaymentSectionTranslations() {
    return this.aboutCompanyService.generateMoqPaymentSectionTranslations();
  }

  @Get('moq-payment-quick-cards')
  findMoqPaymentQuickCards() {
    return this.aboutCompanyService.findMoqPaymentQuickCards();
  }

  @Post('moq-payment-quick-cards')
  createMoqPaymentQuickCard(@Body() dto: CreateMoqPaymentQuickCardDto) {
    return this.aboutCompanyService.createMoqPaymentQuickCard(dto);
  }

  @Put('moq-payment-quick-cards/:id')
  updateMoqPaymentQuickCard(
    @Param('id') id: string,
    @Body() dto: UpdateMoqPaymentQuickCardDto,
  ) {
    return this.aboutCompanyService.updateMoqPaymentQuickCard(id, dto);
  }

  @Get('moq-payment-quick-cards/:id/translation-status')
  getMoqPaymentQuickCardTranslationStatus(@Param('id') id: string) {
    return this.aboutCompanyService.getMoqPaymentQuickCardTranslationStatus(id);
  }

  @Post('moq-payment-quick-cards/:id/translations/generate')
  generateMoqPaymentQuickCardTranslations(@Param('id') id: string) {
    return this.aboutCompanyService.generateMoqPaymentQuickCardTranslations(id);
  }

  @Delete('moq-payment-quick-cards/:id')
  removeMoqPaymentQuickCard(@Param('id') id: string) {
    return this.aboutCompanyService.removeMoqPaymentQuickCard(id);
  }

  @Get('moq-payment-business-terms')
  findMoqPaymentBusinessTerms() {
    return this.aboutCompanyService.findMoqPaymentBusinessTerms();
  }

  @Post('moq-payment-business-terms')
  createMoqPaymentBusinessTerm(@Body() dto: CreateMoqPaymentBusinessTermDto) {
    return this.aboutCompanyService.createMoqPaymentBusinessTerm(dto);
  }

  @Put('moq-payment-business-terms/:id')
  updateMoqPaymentBusinessTerm(
    @Param('id') id: string,
    @Body() dto: UpdateMoqPaymentBusinessTermDto,
  ) {
    return this.aboutCompanyService.updateMoqPaymentBusinessTerm(id, dto);
  }

  @Get('moq-payment-business-terms/:id/translation-status')
  getMoqPaymentBusinessTermTranslationStatus(@Param('id') id: string) {
    return this.aboutCompanyService.getMoqPaymentBusinessTermTranslationStatus(
      id,
    );
  }

  @Post('moq-payment-business-terms/:id/translations/generate')
  generateMoqPaymentBusinessTermTranslations(@Param('id') id: string) {
    return this.aboutCompanyService.generateMoqPaymentBusinessTermTranslations(
      id,
    );
  }

  @Delete('moq-payment-business-terms/:id')
  removeMoqPaymentBusinessTerm(@Param('id') id: string) {
    return this.aboutCompanyService.removeMoqPaymentBusinessTerm(id);
  }

  // ── "Facilities → Shipment Terms" ───────────────────────────────────────

  @Get('shipment-terms-section')
  findShipmentTermsSection() {
    return this.aboutCompanyService.findShipmentTermsSection();
  }

  @Put('shipment-terms-section')
  updateShipmentTermsSection(
    @Body() dto: UpdateAboutCompanyShipmentTermsSectionDto,
  ) {
    return this.aboutCompanyService.updateShipmentTermsSection(dto);
  }

  @Get('shipment-terms-section/translation-status')
  getShipmentTermsSectionTranslationStatus() {
    return this.aboutCompanyService.getShipmentTermsSectionTranslationStatus();
  }

  @Post('shipment-terms-section/translations/generate')
  generateShipmentTermsSectionTranslations() {
    return this.aboutCompanyService.generateShipmentTermsSectionTranslations();
  }

  @Get('shipping-arrangement-items')
  findShippingArrangementItems() {
    return this.aboutCompanyService.findShippingArrangementItems();
  }

  @Post('shipping-arrangement-items')
  createShippingArrangementItem(@Body() dto: CreateShippingArrangementItemDto) {
    return this.aboutCompanyService.createShippingArrangementItem(dto);
  }

  @Put('shipping-arrangement-items/:id')
  updateShippingArrangementItem(
    @Param('id') id: string,
    @Body() dto: UpdateShippingArrangementItemDto,
  ) {
    return this.aboutCompanyService.updateShippingArrangementItem(id, dto);
  }

  @Get('shipping-arrangement-items/:id/translation-status')
  getShippingArrangementItemTranslationStatus(@Param('id') id: string) {
    return this.aboutCompanyService.getShippingArrangementItemTranslationStatus(
      id,
    );
  }

  @Post('shipping-arrangement-items/:id/translations/generate')
  generateShippingArrangementItemTranslations(@Param('id') id: string) {
    return this.aboutCompanyService.generateShippingArrangementItemTranslations(
      id,
    );
  }

  @Delete('shipping-arrangement-items/:id')
  removeShippingArrangementItem(@Param('id') id: string) {
    return this.aboutCompanyService.removeShippingArrangementItem(id);
  }

  @Get('shipment-loading-locations')
  findShipmentLoadingLocations() {
    return this.aboutCompanyService.findShipmentLoadingLocations();
  }

  @Post('shipment-loading-locations')
  createShipmentLoadingLocation(@Body() dto: CreateShipmentLoadingLocationDto) {
    return this.aboutCompanyService.createShipmentLoadingLocation(dto);
  }

  @Put('shipment-loading-locations/:id')
  updateShipmentLoadingLocation(
    @Param('id') id: string,
    @Body() dto: UpdateShipmentLoadingLocationDto,
  ) {
    return this.aboutCompanyService.updateShipmentLoadingLocation(id, dto);
  }

  @Get('shipment-loading-locations/:id/translation-status')
  getShipmentLoadingLocationTranslationStatus(@Param('id') id: string) {
    return this.aboutCompanyService.getShipmentLoadingLocationTranslationStatus(
      id,
    );
  }

  @Post('shipment-loading-locations/:id/translations/generate')
  generateShipmentLoadingLocationTranslations(@Param('id') id: string) {
    return this.aboutCompanyService.generateShipmentLoadingLocationTranslations(
      id,
    );
  }

  @Delete('shipment-loading-locations/:id')
  removeShipmentLoadingLocation(@Param('id') id: string) {
    return this.aboutCompanyService.removeShipmentLoadingLocation(id);
  }

  @Get('shipment-container-types')
  findShipmentContainerTypes() {
    return this.aboutCompanyService.findShipmentContainerTypes();
  }

  @Post('shipment-container-types')
  createShipmentContainerType(@Body() dto: CreateShipmentContainerTypeDto) {
    return this.aboutCompanyService.createShipmentContainerType(dto);
  }

  @Put('shipment-container-types/:id')
  updateShipmentContainerType(
    @Param('id') id: string,
    @Body() dto: UpdateShipmentContainerTypeDto,
  ) {
    return this.aboutCompanyService.updateShipmentContainerType(id, dto);
  }

  @Get('shipment-container-types/:id/translation-status')
  getShipmentContainerTypeTranslationStatus(@Param('id') id: string) {
    return this.aboutCompanyService.getShipmentContainerTypeTranslationStatus(
      id,
    );
  }

  @Post('shipment-container-types/:id/translations/generate')
  generateShipmentContainerTypeTranslations(@Param('id') id: string) {
    return this.aboutCompanyService.generateShipmentContainerTypeTranslations(
      id,
    );
  }

  @Delete('shipment-container-types/:id')
  removeShipmentContainerType(@Param('id') id: string) {
    return this.aboutCompanyService.removeShipmentContainerType(id);
  }

  @Get('shipment-schedule-steps')
  findShipmentScheduleSteps() {
    return this.aboutCompanyService.findShipmentScheduleSteps();
  }

  @Post('shipment-schedule-steps')
  createShipmentScheduleStep(@Body() dto: CreateShipmentScheduleStepDto) {
    return this.aboutCompanyService.createShipmentScheduleStep(dto);
  }

  @Put('shipment-schedule-steps/:id')
  updateShipmentScheduleStep(
    @Param('id') id: string,
    @Body() dto: UpdateShipmentScheduleStepDto,
  ) {
    return this.aboutCompanyService.updateShipmentScheduleStep(id, dto);
  }

  @Get('shipment-schedule-steps/:id/translation-status')
  getShipmentScheduleStepTranslationStatus(@Param('id') id: string) {
    return this.aboutCompanyService.getShipmentScheduleStepTranslationStatus(
      id,
    );
  }

  @Post('shipment-schedule-steps/:id/translations/generate')
  generateShipmentScheduleStepTranslations(@Param('id') id: string) {
    return this.aboutCompanyService.generateShipmentScheduleStepTranslations(
      id,
    );
  }

  @Delete('shipment-schedule-steps/:id')
  removeShipmentScheduleStep(@Param('id') id: string) {
    return this.aboutCompanyService.removeShipmentScheduleStep(id);
  }

  @Get('shipment-documents')
  findShipmentDocuments() {
    return this.aboutCompanyService.findShipmentDocuments();
  }

  @Post('shipment-documents')
  createShipmentDocument(@Body() dto: CreateShipmentDocumentDto) {
    return this.aboutCompanyService.createShipmentDocument(dto);
  }

  @Put('shipment-documents/:id')
  updateShipmentDocument(
    @Param('id') id: string,
    @Body() dto: UpdateShipmentDocumentDto,
  ) {
    return this.aboutCompanyService.updateShipmentDocument(id, dto);
  }

  @Get('shipment-documents/:id/translation-status')
  getShipmentDocumentTranslationStatus(@Param('id') id: string) {
    return this.aboutCompanyService.getShipmentDocumentTranslationStatus(id);
  }

  @Post('shipment-documents/:id/translations/generate')
  generateShipmentDocumentTranslations(@Param('id') id: string) {
    return this.aboutCompanyService.generateShipmentDocumentTranslations(id);
  }

  @Delete('shipment-documents/:id')
  removeShipmentDocument(@Param('id') id: string) {
    return this.aboutCompanyService.removeShipmentDocument(id);
  }

  @Get('shipment-commitment-items')
  findShipmentCommitmentItems() {
    return this.aboutCompanyService.findShipmentCommitmentItems();
  }

  @Post('shipment-commitment-items')
  createShipmentCommitmentItem(@Body() dto: CreateShipmentCommitmentItemDto) {
    return this.aboutCompanyService.createShipmentCommitmentItem(dto);
  }

  @Put('shipment-commitment-items/:id')
  updateShipmentCommitmentItem(
    @Param('id') id: string,
    @Body() dto: UpdateShipmentCommitmentItemDto,
  ) {
    return this.aboutCompanyService.updateShipmentCommitmentItem(id, dto);
  }

  @Get('shipment-commitment-items/:id/translation-status')
  getShipmentCommitmentItemTranslationStatus(@Param('id') id: string) {
    return this.aboutCompanyService.getShipmentCommitmentItemTranslationStatus(
      id,
    );
  }

  @Post('shipment-commitment-items/:id/translations/generate')
  generateShipmentCommitmentItemTranslations(@Param('id') id: string) {
    return this.aboutCompanyService.generateShipmentCommitmentItemTranslations(
      id,
    );
  }

  @Delete('shipment-commitment-items/:id')
  removeShipmentCommitmentItem(@Param('id') id: string) {
    return this.aboutCompanyService.removeShipmentCommitmentItem(id);
  }

  // ── "Facilities → FAQ" ───────────────────────────────────────────────────

  @Get('facilities-faq-section')
  findFacilitiesFaqSection() {
    return this.aboutCompanyService.findFacilitiesFaqSection();
  }

  @Put('facilities-faq-section')
  updateFacilitiesFaqSection(
    @Body() dto: UpdateAboutCompanyFacilitiesFaqSectionDto,
  ) {
    return this.aboutCompanyService.updateFacilitiesFaqSection(dto);
  }

  @Get('facilities-faq-section/translation-status')
  getFacilitiesFaqSectionTranslationStatus() {
    return this.aboutCompanyService.getFacilitiesFaqSectionTranslationStatus();
  }

  @Post('facilities-faq-section/translations/generate')
  generateFacilitiesFaqSectionTranslations() {
    return this.aboutCompanyService.generateFacilitiesFaqSectionTranslations();
  }

  @Get('facilities-faq-items')
  findFacilitiesFaqItems() {
    return this.aboutCompanyService.findFacilitiesFaqItems();
  }

  @Post('facilities-faq-items')
  createFacilitiesFaqItem(@Body() dto: CreateFacilitiesFaqItemDto) {
    return this.aboutCompanyService.createFacilitiesFaqItem(dto);
  }

  @Put('facilities-faq-items/:id')
  updateFacilitiesFaqItem(
    @Param('id') id: string,
    @Body() dto: UpdateFacilitiesFaqItemDto,
  ) {
    return this.aboutCompanyService.updateFacilitiesFaqItem(id, dto);
  }

  @Get('facilities-faq-items/:id/translation-status')
  getFacilitiesFaqItemTranslationStatus(@Param('id') id: string) {
    return this.aboutCompanyService.getFacilitiesFaqItemTranslationStatus(id);
  }

  @Post('facilities-faq-items/:id/translations/generate')
  generateFacilitiesFaqItemTranslations(@Param('id') id: string) {
    return this.aboutCompanyService.generateFacilitiesFaqItemTranslations(id);
  }

  @Delete('facilities-faq-items/:id')
  removeFacilitiesFaqItem(@Param('id') id: string) {
    return this.aboutCompanyService.removeFacilitiesFaqItem(id);
  }

  @Get('facilities-faq-items/:faqItemId/tags')
  findFacilitiesFaqTags(@Param('faqItemId') faqItemId: string) {
    return this.aboutCompanyService.findFacilitiesFaqTags(faqItemId);
  }

  @Post('facilities-faq-tags')
  createFacilitiesFaqTag(@Body() dto: CreateFacilitiesFaqProductTagDto) {
    return this.aboutCompanyService.createFacilitiesFaqTag(dto);
  }

  @Put('facilities-faq-tags/:id')
  updateFacilitiesFaqTag(
    @Param('id') id: string,
    @Body() dto: UpdateFacilitiesFaqProductTagDto,
  ) {
    return this.aboutCompanyService.updateFacilitiesFaqTag(id, dto);
  }

  @Get('facilities-faq-tags/:id/translation-status')
  getFacilitiesFaqTagTranslationStatus(@Param('id') id: string) {
    return this.aboutCompanyService.getFacilitiesFaqTagTranslationStatus(id);
  }

  @Post('facilities-faq-tags/:id/translations/generate')
  generateFacilitiesFaqTagTranslations(@Param('id') id: string) {
    return this.aboutCompanyService.generateFacilitiesFaqTagTranslations(id);
  }

  @Delete('facilities-faq-tags/:id')
  removeFacilitiesFaqTag(@Param('id') id: string) {
    return this.aboutCompanyService.removeFacilitiesFaqTag(id);
  }

  // ── Settings ──────────────────────────────────────────────────────────────

  @Get('settings')
  findSettings() {
    return this.aboutCompanyService.findSettings();
  }

  @Put('settings')
  updateSettings(@Body() dto: UpdateAboutCompanySettingsDto) {
    return this.aboutCompanyService.updateSettings(dto);
  }

  // ── Section Manager: Draft/Publish ───────────────────────────────────────

  @Get('sections')
  findSections() {
    return this.aboutCompanyService.getSections();
  }

  // Order/visibility changes are draft state — deliberately NOT revalidated here; they only
  // take effect on the public page after an explicit Publish (matches Homepage Manager Rule 1).
  @Put('sections/:key')
  updateSection(
    @Param('key') key: string,
    @Body() dto: UpdateAboutCompanySectionDto,
  ) {
    return this.aboutCompanyService.updateSection(key, dto);
  }

  // Backs the Manager's search box / filter chips / sort selector — read-only, draft tables.
  @Get('search-index')
  getSearchIndex() {
    return this.aboutCompanyService.getSearchIndex();
  }

  @Get('publish-status')
  getPublishStatus() {
    return this.aboutCompanyService.getPublishStatus();
  }

  // Two revalidations, both needed: '/about' + '/facilities' ('page') for those pages' own
  // content — Facilities now reads from this same snapshot instead of a standalone always-live
  // endpoint — and '/' ('layout') because Header/Footer read this same snapshot to decide
  // whether to show the About Company menu at all (see `getPublicAboutCompanyNav`), and that
  // layout wraps every public route (including the Homepage's own Facilities teaser).
  @Post('publish')
  @Roles('super_admin')
  async publish() {
    const snapshot = await this.aboutCompanyService.publishAboutCompany();
    await this.revalidation.revalidate(['/about', '/facilities']);
    await this.revalidation.revalidate(['/'], 'layout');
    return snapshot;
  }

  @Get('snapshots')
  listSnapshots() {
    return this.aboutCompanyService.listSnapshots();
  }

  @Post('snapshots/:id/restore')
  @Roles('super_admin')
  async restoreSnapshot(@Param('id') id: string) {
    const snapshot = await this.aboutCompanyService.restoreSnapshot(id);
    await this.revalidation.revalidate(['/about', '/facilities']);
    await this.revalidation.revalidate(['/'], 'layout');
    return snapshot;
  }
}
