import { toTeamMember } from './team-member.mapper';

function stubTeamMemberRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'member-1',
    name: 'Jane Doe',
    position: 'Chief Executive Officer',
    biography: 'Bio.',
    responsibilities: 'Responsibilities.',
    department: 'Management',
    photo: null,
    linkedinUrl: null,
    email: null,
    phone: null,
    order: 0,
    active: true,
    featured: false,
    translations: null,
    ...overrides,
  };
}

// Phase P0.3-B1 — `department` was captured and persisted correctly (write path + admin UI
// already worked, per the P0.3-A merge-safety fix) but `toTeamMember()` never passed it through
// `translate()`, so a saved department translation was silently unreachable on every public
// read. Fix: add `'department'` to the `translate()` field list and read `t.department` instead
// of the raw `entry.department`. These tests prove the read-time behavior, not the storage —
// storage/merge-safety is already covered by `about-company.service.spec.ts`.
describe('toTeamMember — department translation (Phase P0.3-B1)', () => {
  const translations = {
    id: { department: 'Manajemen' },
    zh: { department: '管理层' },
    th: { department: 'ฝ่ายบริหาร' },
    hi: { department: 'प्रबंधन' },
    vi: { department: 'Quản lý' },
  };

  it('returns the base (English) department for the default "en" locale', () => {
    const row = stubTeamMemberRow({ translations });
    const result = toTeamMember(row as never, 'en');
    expect(result.department).toBe('Management');
  });

  it('returns the Indonesian department translation for "id"', () => {
    const row = stubTeamMemberRow({ translations });
    const result = toTeamMember(row as never, 'id');
    expect(result.department).toBe('Manajemen');
  });

  it('returns the Chinese department translation for "zh"', () => {
    const row = stubTeamMemberRow({ translations });
    const result = toTeamMember(row as never, 'zh');
    expect(result.department).toBe('管理层');
  });

  it('returns the Thai department translation for "th"', () => {
    const row = stubTeamMemberRow({ translations });
    const result = toTeamMember(row as never, 'th');
    expect(result.department).toBe('ฝ่ายบริหาร');
  });

  it('returns the Hindi department translation for "hi"', () => {
    const row = stubTeamMemberRow({ translations });
    const result = toTeamMember(row as never, 'hi');
    expect(result.department).toBe('प्रबंधन');
  });

  it('returns the Vietnamese department translation for "vi"', () => {
    const row = stubTeamMemberRow({ translations });
    const result = toTeamMember(row as never, 'vi');
    expect(result.department).toBe('Quản lý');
  });

  it('falls back to the base department when the requested locale has no override', () => {
    const row = stubTeamMemberRow({
      translations: { id: { department: 'Manajemen' } }, // no "zh" block at all
    });
    const result = toTeamMember(row as never, 'zh');
    expect(result.department).toBe('Management');
  });

  it('falls back to the base department when the locale block exists but department is empty', () => {
    const row = stubTeamMemberRow({
      translations: { id: { department: '' } },
    });
    const result = toTeamMember(row as never, 'id');
    expect(result.department).toBe('Management');
  });

  it('falls back to null when the base department is null and no translation exists', () => {
    const row = stubTeamMemberRow({ department: null, translations: null });
    const result = toTeamMember(row as never, 'id');
    expect(result.department).toBeNull();
  });

  it('does not affect name/position/biography/responsibilities resolution', () => {
    const row = stubTeamMemberRow({
      translations: {
        id: {
          name: 'Nama Indonesia',
          position: 'Posisi Indonesia',
          biography: 'Biografi Indonesia',
          responsibilities: 'Tanggung Jawab Indonesia',
          department: 'Manajemen',
        },
      },
    });
    const result = toTeamMember(row as never, 'id');
    expect(result.name).toBe('Nama Indonesia');
    expect(result.position).toBe('Posisi Indonesia');
    expect(result.biography).toBe('Biografi Indonesia');
    expect(result.responsibilities).toBe('Tanggung Jawab Indonesia');
    expect(result.department).toBe('Manajemen');
  });

  it('leaves non-translated fields (photo, contact info, order, active, featured) unaffected', () => {
    const row = stubTeamMemberRow({
      linkedinUrl: 'https://linkedin.com/in/jane',
      email: 'jane@example.com',
      phone: '+62-812-0000',
      order: 3,
      active: true,
      featured: true,
      translations,
    });
    const result = toTeamMember(row as never, 'zh');
    expect(result.linkedin_url).toBe('https://linkedin.com/in/jane');
    expect(result.email).toBe('jane@example.com');
    expect(result.phone).toBe('+62-812-0000');
    expect(result.order).toBe(3);
    expect(result.active).toBe(true);
    expect(result.featured).toBe(true);
    expect(result.photo).toBeNull();
  });

  it('surfaces the raw translations object unchanged, for the admin editor to read directly', () => {
    const row = stubTeamMemberRow({ translations });
    const result = toTeamMember(row as never, 'en');
    expect(result.translations).toEqual(translations);
  });
});
