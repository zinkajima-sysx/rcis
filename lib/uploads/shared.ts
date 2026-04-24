export const CANONICAL_UPLOAD_MODULES = ['alkes', 'galeri', 'handover'] as const;

export type UploadModule = (typeof CANONICAL_UPLOAD_MODULES)[number];

const UPLOAD_MODULE_ALIASES: Record<string, UploadModule> = {
  alkes: 'alkes',
  akes: 'alkes',
  galeri: 'galeri',
  galery: 'galeri',
  gallery: 'galeri',
  handover: 'handover',
};

export function normalizeUploadModule(value: string | null | undefined): UploadModule | null {
  if (!value) {
    return null;
  }

  return UPLOAD_MODULE_ALIASES[value.trim().toLowerCase()] ?? null;
}

export function slugifyAssetPart(value: string | null | undefined, fallback = 'asset') {
  const normalized = (value ?? '')
    .normalize('NFKD')
    .replace(/[^\x00-\x7F]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

  return normalized || fallback;
}

