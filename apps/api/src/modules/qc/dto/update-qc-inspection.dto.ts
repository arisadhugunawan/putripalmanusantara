import { IsIn } from 'class-validator';

// The only client-PATCHable transition in v1 is explicit cancellation of a `failed`
// inspection (locked decision 16/18). `in_progress`/`passed`/`failed` are never directly
// client-settable — they are either auto-set on the first result (`in_progress`) or computed
// from the accumulated results (`passed`/`failed`). `released` is only ever set by
// `InventoryLotsService.release()`, never through this route.
export class UpdateQcInspectionDto {
  @IsIn(['cancelled'])
  status!: 'cancelled';
}
