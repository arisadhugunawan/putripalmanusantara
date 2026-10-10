import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

// `qcInspectionId` comes from the route. `result` is the one client input that drives the
// server-computed roll-up (locked decision 19/20) — the inspection's own `passed`/`failed`
// status is never accepted directly from the client, only derived from the accumulated set of
// these result rows.
export class CreateQcResultDto {
  @IsString()
  @MinLength(1)
  parameter!: string;

  @IsOptional()
  @IsString()
  specification?: string;

  @IsOptional()
  @IsString()
  actualValue?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsIn(['pass', 'fail', 'na'])
  result!: 'pass' | 'fail' | 'na';

  @IsOptional()
  @IsString()
  notes?: string;
}
