import { IsIn, IsISO8601, IsOptional, IsString } from 'class-validator';

// `inventoryLotId` comes from the route; `inspectionNumber`/`status` are server-controlled —
// every inspection starts `pending`. `inspectedAt` defaults to now() server-side if omitted.
export class CreateQcInspectionDto {
  @IsIn(['incoming', 'release', 'reinspection'])
  inspectionType!: 'incoming' | 'release' | 'reinspection';

  @IsOptional()
  @IsString()
  inspectorId?: string;

  @IsOptional()
  @IsString()
  inspectorName?: string;

  @IsOptional()
  @IsISO8601()
  inspectedAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
