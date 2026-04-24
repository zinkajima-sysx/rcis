import { randomUUID } from 'crypto';

import { normalizeUploadModule, slugifyAssetPart, type UploadModule } from '@/lib/uploads/shared';

const DEFAULT_ROOT_FOLDER = 'rcis';

function getRootFolder() {
  return (process.env.CLOUDINARY_FOLDER ?? DEFAULT_ROOT_FOLDER).replace(/^\/+|\/+$/g, '') || DEFAULT_ROOT_FOLDER;
}

function getRuntimeFolder() {
  return process.env.NODE_ENV === 'production' ? 'production' : 'development';
}

function getBaseFileName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, '');
}

export function resolveUploadFolder(rawModule: string | null | undefined) {
  const targetModule = normalizeUploadModule(rawModule);

  if (!targetModule) {
    throw new Error('Modul upload tidak valid');
  }

  return {
    moduleName: targetModule,
    folderPath: `${getRootFolder()}/${getRuntimeFolder()}/${targetModule}`,
  };
}

export function buildUploadPublicId({
  module,
  purpose,
  originalName,
}: {
  module: UploadModule;
  purpose?: string | null;
  originalName: string;
}) {
  const timestamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
  const uniqueSuffix = randomUUID().replace(/-/g, '').slice(0, 8);
  const safePurpose = slugifyAssetPart(purpose, 'image');
  const safeName = slugifyAssetPart(getBaseFileName(originalName), 'file');

  return [module, safePurpose, timestamp, uniqueSuffix, safeName].join('-').slice(0, 120);
}
