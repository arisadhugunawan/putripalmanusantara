import { applyDecorators } from '@nestjs/common';
import {
  IsEmail,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

/**
 * Optional contact-field validators for Admin forms.
 *
 * A cleared input posts `""`, not `undefined` — plain `@IsOptional() @IsUrl()` would reject
 * that and make "remove my LinkedIn link" fail validation. These decorators skip validation
 * for `undefined`, `null` and `""` (all of which mean "no value"), and validate anything else
 * strictly, so a genuinely malformed address is still rejected server-side rather than trusted
 * from the client (brief item 73).
 */
const skipWhenBlank = () =>
  ValidateIf(
    (_, value) => value !== undefined && value !== null && value !== '',
  );

export function IsOptionalUrl() {
  return applyDecorators(
    skipWhenBlank(),
    IsString(),
    MaxLength(500),
    IsUrl(
      { require_protocol: true, protocols: ['http', 'https'] },
      { message: 'Tautan harus berupa URL lengkap (http:// atau https://).' },
    ),
  );
}

export function IsOptionalEmail() {
  return applyDecorators(
    skipWhenBlank(),
    IsString(),
    MaxLength(254),
    IsEmail({}, { message: 'Alamat email tidak valid.' }),
  );
}

/** Deliberately permissive: international numbers legitimately contain spaces, dots, dashes,
 * parentheses and a leading +. Only obviously-not-a-number input is rejected. */
export function IsOptionalPhone() {
  return applyDecorators(
    skipWhenBlank(),
    IsString(),
    MaxLength(32),
    Matches(/^\+?[\d\s().-]{6,}$/, {
      message:
        'Nomor telepon hanya boleh berisi angka, spasi, dan tanda + ( ) - .',
    }),
  );
}
