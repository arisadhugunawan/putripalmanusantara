import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Guards every /admin/* route (docs/05-api.md §2 — admin endpoints require a valid token). */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
