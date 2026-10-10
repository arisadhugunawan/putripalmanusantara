import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class QcInspectionQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['pending', 'in_progress', 'passed', 'failed', 'released', 'cancelled'])
  status?:
    'pending' | 'in_progress' | 'passed' | 'failed' | 'released' | 'cancelled';

  @IsOptional()
  @IsIn(['incoming', 'release', 'reinspection'])
  inspectionType?: 'incoming' | 'release' | 'reinspection';

  @IsOptional()
  @IsString()
  inventoryLotId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;
}
