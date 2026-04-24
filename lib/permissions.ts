export const MODULES = [
  'Dashboard',
  'Galeri',
  'Alkes',
  'Handover',
  'JadwalRC',
  'ManajemenUser',
  'DaopDivre',
  'Entitas',
  'KategoriAlkes',
  'SettingCRUD',
] as const;

export type ModuleKey = (typeof MODULES)[number];
export type PermissionKey = 'c' | 'r' | 'u' | 'd';
export type PermissionSet = { c: boolean; r: boolean; u: boolean; d: boolean };
export type HakAkses = Record<ModuleKey, PermissionSet>;

export const defaultHakAkses: HakAkses = {
  Dashboard: { c: false, r: true, u: false, d: false },
  Galeri: { c: false, r: true, u: false, d: false },
  Alkes: { c: false, r: true, u: false, d: false },
  Handover: { c: false, r: true, u: false, d: false },
  JadwalRC: { c: false, r: true, u: false, d: false },
  ManajemenUser: { c: false, r: false, u: false, d: false },
  DaopDivre: { c: false, r: false, u: false, d: false },
  Entitas: { c: false, r: false, u: false, d: false },
  KategoriAlkes: { c: false, r: false, u: false, d: false },
  SettingCRUD: { c: false, r: false, u: false, d: false },
};

export const fullHakAkses: HakAkses = {
  Dashboard: { c: true, r: true, u: true, d: true },
  Galeri: { c: true, r: true, u: true, d: true },
  Alkes: { c: true, r: true, u: true, d: true },
  Handover: { c: true, r: true, u: true, d: true },
  JadwalRC: { c: true, r: true, u: true, d: true },
  ManajemenUser: { c: true, r: true, u: true, d: true },
  DaopDivre: { c: true, r: true, u: true, d: true },
  Entitas: { c: true, r: true, u: true, d: true },
  KategoriAlkes: { c: true, r: true, u: true, d: true },
  SettingCRUD: { c: true, r: true, u: true, d: true },
};

function clonePreset(preset: HakAkses): HakAkses {
  return JSON.parse(JSON.stringify(preset));
}

export function buildEntitasHakAkses(entitasName: string): HakAkses {
  const normalizedName = entitasName.trim().toLowerCase();

  if (normalizedName === 'superadmin') {
    return clonePreset(fullHakAkses);
  }

  return clonePreset(defaultHakAkses);
}

export function normalizeHakAkses(value: unknown): HakAkses {
  const source = typeof value === 'object' && value !== null ? (value as Partial<Record<ModuleKey, Partial<PermissionSet>>>) : {};
  const base = clonePreset(defaultHakAkses);
  const legacyDataMaster = (source as Partial<Record<'DataMaster', Partial<PermissionSet>>>).DataMaster;

  for (const moduleName of MODULES) {
    const moduleSource = source[moduleName];

    const inheritedDataMasterModules: ModuleKey[] = ['ManajemenUser', 'DaopDivre', 'Entitas', 'KategoriAlkes', 'SettingCRUD'];
    const effectiveSource = moduleSource ?? (inheritedDataMasterModules.includes(moduleName) ? legacyDataMaster : undefined);

    if (!effectiveSource) {
      continue;
    }

    base[moduleName] = {
      c: Boolean(effectiveSource.c),
      r: Boolean(effectiveSource.r),
      u: Boolean(effectiveSource.u),
      d: Boolean(effectiveSource.d),
    };
  }

  return base;
}
