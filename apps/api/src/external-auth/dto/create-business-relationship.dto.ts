import { IsIn } from 'class-validator';

// Deliberately the only field — companyId/status/approvedBy*/requestedBy* are all server-derived
// (see ExternalBusinessRelationshipService.requestRelationship) and have no place on this DTO.
export class CreateBusinessRelationshipDto {
  @IsIn(['buyer', 'supplier', 'vendor', 'partner'])
  relationshipType!: 'buyer' | 'supplier' | 'vendor' | 'partner';
}
