import type {
  QCInspectionModel as QCInspection,
  QCResultModel as QCResult,
} from '../../../generated/prisma/models';

interface InventoryLotSummaryRelation {
  id: string;
  lotNumber: string;
}

type QcInspectionWithRelations = QCInspection & {
  inventoryLot?: InventoryLotSummaryRelation | null;
  results?: QCResult[];
};

export interface QcResultSummary {
  id: string;
  parameter: string;
  specification: string | null;
  actualValue: string | null;
  unit: string | null;
  result: string;
  notes: string | null;
  createdAt: string;
}

export interface QcInspectionSummary {
  id: string;
  inspectionNumber: string;
  inventoryLotId: string;
  inventoryLot?: InventoryLotSummaryRelation;
  inspectionType: string;
  inspectorId: string | null;
  inspectorName: string | null;
  inspectedAt: string;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  results?: QcResultSummary[];
}

function toQcResult(result: QCResult): QcResultSummary {
  return {
    id: result.id,
    parameter: result.parameter,
    specification: result.specification,
    actualValue: result.actualValue,
    unit: result.unit,
    result: result.result,
    notes: result.notes,
    createdAt: result.createdAt.toISOString(),
  };
}

export function toQcInspection(
  inspection: QcInspectionWithRelations,
): QcInspectionSummary {
  return {
    id: inspection.id,
    inspectionNumber: inspection.inspectionNumber,
    inventoryLotId: inspection.inventoryLotId,
    ...(inspection.inventoryLot && { inventoryLot: inspection.inventoryLot }),
    inspectionType: inspection.inspectionType,
    inspectorId: inspection.inspectorId,
    inspectorName: inspection.inspectorName,
    inspectedAt: inspection.inspectedAt.toISOString(),
    status: inspection.status,
    notes: inspection.notes,
    createdAt: inspection.createdAt.toISOString(),
    updatedAt: inspection.updatedAt.toISOString(),
    ...(inspection.results && { results: inspection.results.map(toQcResult) }),
  };
}
