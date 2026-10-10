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

export class CreatePurchaseRequestItemDto {
  @IsString()
  @MinLength(1)
  productId!: string;

  @IsNumber()
  @Min(0.01)
  quantity!: number;

  @IsString()
  @MinLength(1)
  unit!: string;

  @IsOptional()
  @IsISO8601()
  requiredDate?: string;

  @IsOptional()
  @IsString()
  specifications?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

// `requestNumber`/`status`/`productNameSnapshot`/timestamps are all server-controlled — none
// of them have a field here at all. `requestedById`/`requestedByName` stay plain, optional,
// client-supplied strings (never a live FK), matching every other internal-actor reference in
// this schema (e.g. `Lead.ownerId`/`ownerName`).
export class CreatePurchaseRequestDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseRequestItemDto)
  items!: CreatePurchaseRequestItemDto[];

  @IsOptional()
  @IsISO8601()
  requiredDate?: string;

  @IsOptional()
  @IsString()
  requestedById?: string;

  @IsOptional()
  @IsString()
  requestedByName?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
