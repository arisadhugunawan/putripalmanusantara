import { IsOptional, IsString, MinLength } from 'class-validator';

// Deliberately excludes `country` and `status` — country stays owner-immutable per Phase 17B's
// locked rules, and `status` is PPN's own lifecycle field, never owner-writable.
export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  legalName?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  website?: string;
}
