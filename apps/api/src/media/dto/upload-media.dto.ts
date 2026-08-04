import { IsNotEmpty, IsString } from 'class-validator';

export class UploadMediaDto {
  /** Required — NFR-SEO-06 / NFR-A11Y-03: alt text is mandatory for every uploaded image. */
  @IsString()
  @IsNotEmpty()
  alt_text!: string;
}
