import type { BusinessRelationshipModel as BusinessRelationship } from '../../generated/prisma/models';

// Explicit allow-list — mirrors the Admin side's business-relationship mapper (Phase 17C).
// Nothing from ExternalAccount/Company beyond this shape is ever included, so there is no path
// for a passwordHash or any other secret to reach this response.
export interface ExternalBusinessRelationshipSummary {
  id: string;
  companyId: string;
  relationshipType: string;
  status: string;
  requestedById: string | null;
  requestedByName: string | null;
  requestedAt: string | null;
  approvedById: string | null;
  approvedByName: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function toSummary(
  relationship: BusinessRelationship,
): ExternalBusinessRelationshipSummary {
  return {
    id: relationship.id,
    companyId: relationship.companyId,
    relationshipType: relationship.relationshipType,
    status: relationship.status,
    requestedById: relationship.requestedById,
    requestedByName: relationship.requestedByName,
    requestedAt: relationship.requestedAt
      ? relationship.requestedAt.toISOString()
      : null,
    approvedById: relationship.approvedById,
    approvedByName: relationship.approvedByName,
    approvedAt: relationship.approvedAt
      ? relationship.approvedAt.toISOString()
      : null,
    createdAt: relationship.createdAt.toISOString(),
    updatedAt: relationship.updatedAt.toISOString(),
  };
}
