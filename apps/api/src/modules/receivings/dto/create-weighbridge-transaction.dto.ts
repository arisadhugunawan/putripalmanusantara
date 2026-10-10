import {
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

// `receivingId` comes from the route, `transactionNumber`/`netWeight`/`status`/timestamps are
// server-controlled. `vehicleId` reuses the existing `Vehicle` model (locked decision 11) — no
// new Vehicle model, no new FK. Weighbridge is entirely optional (locked decision 11); this DTO
// captures a full weigh-in/weigh-out ticket in one entry since no multi-step workflow is locked.
export class CreateWeighbridgeTransactionDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  vehicleId?: string;

  @IsOptional()
  @IsISO8601()
  weighInAt?: string;

  @IsOptional()
  @IsISO8601()
  weighOutAt?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  grossWeight?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  tareWeight?: number;

  @IsString()
  @MinLength(1)
  unit!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
