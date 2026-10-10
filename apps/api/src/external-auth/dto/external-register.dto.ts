import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class ExternalRegisterDto {
  @IsEmail()
  email!: string;

  // 8 chars is a conventional minimum for a newly-chosen password (login has no such minimum —
  // an existing password is whatever it already is).
  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @MinLength(1)
  fullName!: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
