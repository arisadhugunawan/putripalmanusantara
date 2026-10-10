import type { BusinessRelationshipModel as BusinessRelationship } from '../../../generated/prisma/models';

type WithCompany = BusinessRelationship & {
  company: { id: string; name: string };
};

export interface AdminBusinessRelationshipSummary {
  id: string;
  companyId: string;
  company: { id: string; name: string };
  relationshipType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminBusinessRelationshipDetail extends AdminBusinessRelationshipSummary {
  requestedById: string | null;
  requestedByName: string | null;
  requestedAt: string | null;
  approvedById: string | null;
  approvedByName: string | null;
  approvedAt: string | null;
}

export function toSummary(
  relationship: WithCompany,
): AdminBusinessRelationshipSummary {
  return {
    id: relationship.id,
    companyId: relationship.companyId,
    company: relationship.company,
    relationshipType: relationship.relationshipType,
    status: relationship.status,
    createdAt: relationship.createdAt.toISOString(),
    updatedAt: relationship.updatedAt.toISOString(),
  };
}

export function toDetail(
  relationship: WithCompany,
): AdminBusinessRelationshipDetail {
  return {
    ...toSummary(relationship),
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
  };
}
