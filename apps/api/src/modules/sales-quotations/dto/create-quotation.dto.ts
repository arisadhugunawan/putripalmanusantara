import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CreateQuotationItemDto {
  // Also the key used to match this item against an `RFQItem` of the source RFQ — the service
  // never accepts a productId that isn't part of the RFQ (Phase 20 correction §3/§6).
  @IsString()
  @MinLength(1)
  productId!: string;

  // Optional: defaults to the matched RFQItem.quantity when omitted, admin may override
  // (Phase 20 correction §4/§10). RFQItem.quantity is itself always present, so this can never
  // resolve to "neither provided" at runtime.
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  quantity?: number;

  // Optional: defaults to the matched RFQItem.unit when omitted, admin may override. RFQItem.unit
  // may be null, so the service still rejects the request if neither side supplies one — every
  // QuotationItem.unit is required at the schema level (Phase 20 correction §4/§9).
  @IsOptional()
  @IsString()
  @MinLength(1)
  unit?: string;

  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @IsOptional()
  @IsString()
  specifications?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

// `rfqId` comes from the route, `companyId` is derived server-side from the RFQ,
// `quotationNumber`/`status`/`subtotal`/`total`/`productNameSnapshot`/timestamps are all
// server-controlled — none of them have a field here at all.
export class CreateQuotationDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateQuotationItemDto)
  items!: CreateQuotationItemDto[];

  @IsOptional()
  @IsISO8601()
  quotationDate?: string;

  @IsOptional()
  @IsISO8601()
  validUntil?: string;

  @IsString()
  @MinLength(1)
  currency!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  shippingCost?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
