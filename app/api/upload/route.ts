import { NextResponse } from 'next/server';
import { assertModuleAccess } from '@/lib/auth';
import cloudinary from '@/lib/cloudinary';
import { buildUploadPublicId, resolveUploadFolder } from '@/lib/uploads/server';
import type { ModuleKey } from '@/lib/permissions';

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const UPLOAD_MODULE_PERMISSIONS: Record<string, ModuleKey> = {
  alkes: 'Alkes',
  galeri: 'Galeri',
  handover: 'Handover',
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const fileEntry = formData.get('file');
    const requestedModule = formData.get('modul') as string | null;
    const purpose = formData.get('purpose') as string | null;
    const originalName = (formData.get('originalName') as string | null) ?? undefined;

    if (!(fileEntry instanceof File)) {
      return NextResponse.json({ error: 'Tidak ada file yang diunggah' }, { status: 400 });
    }

    const { moduleName, folderPath } = resolveUploadFolder(requestedModule);
    const requiredModule = UPLOAD_MODULE_PERMISSIONS[moduleName];

    await assertModuleAccess(requiredModule, 'c');

    if (!ALLOWED_IMAGE_TYPES.has(fileEntry.type)) {
      return NextResponse.json({ error: 'Format file harus JPG, PNG, atau WEBP.' }, { status: 400 });
    }

    if (fileEntry.size <= 0 || fileEntry.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'Ukuran file harus antara 1 byte sampai 5 MB.' }, { status: 413 });
    }

    const publicId = buildUploadPublicId({
      module: moduleName,
      purpose,
      originalName: originalName || fileEntry.name,
    });

    // Ubah stream file menjadi buffer
    const bytes = await fileEntry.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Ubah menjadi format base64 string untuk di-upload Cloudinary
    const fileBase64 = `data:${fileEntry.type};base64,${buffer.toString('base64')}`;

    // Proses upload ke Cloudinary
    const uploadResult = await cloudinary.uploader.upload(fileBase64, {
      folder: folderPath,
      public_id: publicId,
      resource_type: 'image',
      overwrite: false,
      unique_filename: false,
      use_filename: false,
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Upload ke Cloudinary Berhasil!',
      data: {
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
        folder: uploadResult.folder,
        format: uploadResult.format,
        bytes: uploadResult.bytes,
        module: moduleName,
      }
    });

  } catch (error: any) {
    console.error("Cloudinary Upload Error:", error);
    const isForbidden = error instanceof Error && error.message === 'Anda tidak memiliki hak akses untuk aksi ini.';

    return NextResponse.json({
      error: isForbidden ? error.message : 'Gagal mengunggah file ke Cloudinary',
    }, { status: isForbidden ? 403 : 500 });
  }
}
