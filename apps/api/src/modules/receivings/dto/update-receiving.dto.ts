import { IsIn, IsOptional, IsString } from 'class-validator';

// `warehouseId`/`purchaseOrderId`/`supplierCompanyId`/`items` are absent — fixed at creation.
// `receivedAt` is absent too — server-set automatically the moment status becomes `received`
// (locked decision 6), never client-supplied. `status` excludes `draft` (nothing transitions
// back into it).
export class UpdateReceivingDto {
  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsIn(['received', 'inspecting', 'completed', 'cancelled'])
  status?: 'received' | 'inspecting' | 'completed' | 'cancelled';
}
