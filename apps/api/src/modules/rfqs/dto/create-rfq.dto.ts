import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CreateRfqItemDto {
  @IsString()
  @MinLength(1)
  productId!: string;

  @IsNumber()
  @IsPositive()
  quantity!: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsISO8601()
  requestedDeliveryDate?: string;

  @IsOptional()
  @IsString()
  specifications?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

// One shape for both creation paths. `companyId` is required only for the standalone route
// (checked in RfqsService.createStandalone, not here — DTO-level requiredness can't vary by
// route) and is always ignored on the from-opportunity route, where the company is derived
// server-side from the Opportunity and a client-supplied value here can never override it.
// `id`/`rfqNumber`/`status`/`opportunityId`/`createdAt`/`updatedAt`/`productNameSnapshot` are
// all server-controlled and have no field here at all.
export class CreateRfqDto {
  @IsOptional()
  @IsString()
  companyId?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateRfqItemDto)
  items!: CreateRfqItemDto[];

  @IsOptional()
  @IsISO8601()
  requestedAt?: string;

  @IsOptional()
  @IsISO8601()
  validUntil?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
