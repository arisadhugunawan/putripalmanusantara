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

export class CreateSupplierQuotationItemDto {
  // Also the key used to match this item against a `SupplierRFQItem` of the source
  // SupplierRFQ — the service never accepts a productId that isn't part of that SupplierRFQ.
  @IsString()
  @MinLength(1)
  productId!: string;

  // Optional: defaults to the matched SupplierRFQItem.quantity when omitted, admin may
  // override.
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  quantity?: number;

  // Optional: defaults to the matched SupplierRFQItem.unit when omitted — unlike the Quotation/
  // RFQItem chain, `SupplierRFQItem.unit` is always present at the schema level, so this can
  // never resolve to "neither provided."
  @IsOptional()
  @IsString()
  @MinLength(1)
  unit?: string;

  // SupplierRFQ carries no price — always from the request, never defaulted.
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

// `supplierRfqId`/`supplierCompanyId` come from the route/SupplierRFQ server-side,
// `supplierQuotationNumber`/`status`/`subtotal`/`total`/`productNameSnapshot`/timestamps are
// all server-controlled — none of them have a field here at all.
export class CreateSupplierQuotationDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSupplierQuotationItemDto)
  items!: CreateSupplierQuotationItemDto[];

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
