import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

// Admin inspects every company's relationships — no tenancy restriction here, unlike the
// external side's company-scoped endpoints.
export class AdminBusinessRelationshipQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 25;

  @IsOptional()
  @IsIn(['pending', 'active', 'suspended'])
  status?: 'pending' | 'active' | 'suspended';

  @IsOptional()
  @IsIn(['buyer', 'supplier', 'vendor', 'partner'])
  relationshipType?: 'buyer' | 'supplier' | 'vendor' | 'partner';

  @IsOptional()
  @IsString()
  companyId?: string;
}
