import 'reflect-metadata';
import fs from 'fs';
import path from 'path';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateFooterSettingsDto } from '../../modules/footer/dto/footer.dto';
import { UpdateTeamMemberDto } from '../../modules/about-company/dto/team-member.dto';
import { UpsertProductPackagingApplicationDto } from '../../modules/products/dto/product-subresources.dto';

/**
 * Phase P0.3-E — full rollout coverage. Every one of the 34 remaining DTO files got the exact
 * same mechanical edit (a `@Transform(({ value }) => normalizeTranslationsInput(value))` ahead
 * of `@IsObject()`) applied uniformly, since the pre-rollout audit confirmed 100% structural
 * uniformity across every `translations?: TranslationsInput` field in the codebase — no file
 * needed a different pattern. This test enforces that exhaustively and automatically: it scans
 * every `.dto.ts` file under `src/modules` at test time (not a hand-maintained list, which
 * would silently go stale) and fails if any file declaring `translations?: TranslationsInput`
 * doesn't also reference `normalizeTranslationsInput` — catching both an accidentally-skipped
 * file today and a future translation DTO added without being wired in.
 */
function findDtoFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findDtoFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.dto.ts')) {
      files.push(full);
    }
  }
  return files;
}

describe('Phase P0.3-E full rollout — exhaustive DTO coverage', () => {
  it('every DTO file declaring a translations field also uses normalizeTranslationsInput()', () => {
    const modulesDir = path.resolve(__dirname, '../../modules');
    const dtoFiles = findDtoFiles(modulesDir);

    const filesWithTranslationsField = dtoFiles.filter((file) =>
      fs
        .readFileSync(file, 'utf8')
        .includes('translations?: TranslationsInput'),
    );

    // Sanity floor — if the scan itself is broken (wrong directory, glob typo), this catches a
    // false-pass where `filesWithTranslationsField` is empty and the "missing" assertion below
    // would trivially succeed for the wrong reason.
    expect(filesWithTranslationsField.length).toBeGreaterThanOrEqual(37);

    const missing = filesWithTranslationsField
      .filter(
        (file) =>
          !fs.readFileSync(file, 'utf8').includes('normalizeTranslationsInput'),
      )
      .map((file) => path.relative(modulesDir, file));

    expect(missing).toEqual([]);
  });
});

/**
 * Representative DTO-pipeline tests for the full rollout — not one per file (the exhaustive
 * coverage check above already proves every file was touched, and the pilot's
 * `translations-pilot-wiring.spec.ts` already proves the mechanism fires through the real
 * `plainToInstance`/`validate()` pipeline for three structurally different module shapes).
 * These three specifically cover the two structural edge cases the rollout touched that the
 * pilot didn't: a file that previously imported nothing at all from `class-transformer`
 * (Footer), and a file that already had an unrelated `@Transform` on a different property
 * before this rollout touched it (TeamMember) — proving no import collision or decorator
 * conflict. The third is simply another pilot-adjacent sub-resource DTO for variety.
 */
describe('Phase P0.3-E full rollout — representative DTO-pipeline tests', () => {
  const MIXED_INPUT = {
    id: { name: 'Valid Indonesian' },
    fr: { name: 'Invalid locale' },
    zh: 'not-an-object',
  };

  it('Footer (previously had no class-transformer import at all): normalizes correctly, zero validation errors', async () => {
    const instance = plainToInstance(
      UpdateFooterSettingsDto,
      { translations: MIXED_INPUT },
      { enableImplicitConversion: true },
    );
    const errors = await validate(instance);
    expect(errors).toHaveLength(0);
    expect(instance.translations).toEqual({ id: { name: 'Valid Indonesian' } });
  });

  it('TeamMember (already had an unrelated @Transform on another field): both transforms coexist without conflict', async () => {
    const instance = plainToInstance(
      UpdateTeamMemberDto,
      { translations: MIXED_INPUT },
      { enableImplicitConversion: true },
    );
    const errors = await validate(instance);
    expect(errors).toHaveLength(0);
    expect(instance.translations).toEqual({ id: { name: 'Valid Indonesian' } });
  });

  it('UpsertProductPackagingApplicationDto (rolled out alongside the pilot Shape/Specification): still normalizes correctly', async () => {
    const instance = plainToInstance(
      UpsertProductPackagingApplicationDto,
      {
        type: 'packaging',
        title: 'Jute Gunny Bags',
        description: 'Standard export packaging.',
        translations: MIXED_INPUT,
      },
      { enableImplicitConversion: true },
    );
    const errors = await validate(instance);
    expect(errors).toHaveLength(0);
    expect(instance.translations).toEqual({ id: { name: 'Valid Indonesian' } });
  });
});
