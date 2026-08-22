import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateSupplyNetworkConnectionDto {
  @IsString()
  @MinLength(1)
  from_node_id!: string;

  @IsString()
  @MinLength(1)
  to_node_id!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;
}

export class UpdateSupplyNetworkConnectionDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;
}
