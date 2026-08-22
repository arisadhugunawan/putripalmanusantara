import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { MEDIA_POLICY_CONTEXTS } from '@ppn/shared-types';

export class UploadMediaDto {
  /** Required — NFR-SEO-06 / NFR-A11Y-03: alt text is mandatory for every uploaded image. */
  @IsString()
  @IsNotEmpty()
  alt_text!: string;

  /** Which `MEDIA_POLICY` entry governs this upload's dimension cap (Post-Launch Phase 3) —
   * optional so existing callers that don't yet pass it keep working, falling back to the
   * generic "general" policy in that case (see `getMediaPolicy()`). */
  @IsOptional()
  @IsIn(MEDIA_POLICY_CONTEXTS)
  context?: string;
}
