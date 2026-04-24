'use client';

import type { UploadModule } from '@/lib/uploads/shared';

const DEFAULT_MAX_DIMENSION = 1920;
const DEFAULT_TARGET_SIZE_MB = 1;
const DEFAULT_JPEG_QUALITY = 0.9;
const MIN_JPEG_QUALITY = 0.72;

type CompressionResult = {
  file: File;
  compressed: boolean;
  originalBytes: number;
  compressedBytes: number;
};

type UploadImageOptions = {
  module: UploadModule;
  purpose?: string;
  maxDimension?: number;
  targetSizeMB?: number;
  quality?: number;
};

type UploadApiResponse = {
  success: boolean;
  data: {
    url: string;
    public_id: string;
    folder: string;
    format: string;
    bytes: number;
    module: UploadModule;
  };
  error?: string;
  details?: string;
};

function createFileName(originalName: string, mimeType: string) {
  const stem = originalName.replace(/\.[^.]+$/, '') || 'image';
  const extension = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';

  return `${stem}-compressed.${extension}`;
}

function readImageFile(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('File gambar tidak dapat dibaca'));
    };

    image.src = objectUrl;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality?: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, quality);
  });
}

export async function compressImageForUpload(
  file: File,
  {
    maxDimension = DEFAULT_MAX_DIMENSION,
    targetSizeMB = DEFAULT_TARGET_SIZE_MB,
    quality = DEFAULT_JPEG_QUALITY,
  }: Pick<UploadImageOptions, 'maxDimension' | 'targetSizeMB' | 'quality'> = {},
): Promise<CompressionResult> {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return {
      file,
      compressed: false,
      originalBytes: file.size,
      compressedBytes: file.size,
    };
  }

  let image: HTMLImageElement;

  try {
    image = await readImageFile(file);
  } catch {
    return {
      file,
      compressed: false,
      originalBytes: file.size,
      compressedBytes: file.size,
    };
  }

  const longestSide = Math.max(image.width, image.height);
  const scale = longestSide > maxDimension ? maxDimension / longestSide : 1;
  const targetWidth = Math.max(1, Math.round(image.width * scale));
  const targetHeight = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context = canvas.getContext('2d');

  if (!context) {
    return {
      file,
      compressed: false,
      originalBytes: file.size,
      compressedBytes: file.size,
    };
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, 0, 0, targetWidth, targetHeight);

  const targetSizeBytes = targetSizeMB * 1024 * 1024;
  let targetMimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
  let currentQuality = quality;
  let blob = await canvasToBlob(canvas, targetMimeType, targetMimeType === 'image/png' ? undefined : currentQuality);

  if (!blob) {
    return {
      file,
      compressed: false,
      originalBytes: file.size,
      compressedBytes: file.size,
    };
  }

  if (targetMimeType === 'image/jpeg') {
    while (blob.size > targetSizeBytes && currentQuality > MIN_JPEG_QUALITY) {
      currentQuality = Math.max(MIN_JPEG_QUALITY, currentQuality - 0.06);
      const nextBlob = await canvasToBlob(canvas, targetMimeType, currentQuality);

      if (!nextBlob) {
        break;
      }

      blob = nextBlob;
    }
  }

  if (targetMimeType === 'image/png' && blob.size > targetSizeBytes) {
    let webpQuality = 0.92;
    let webpBlob = await canvasToBlob(canvas, 'image/webp', webpQuality);

    while (webpBlob && webpBlob.size > targetSizeBytes && webpQuality > 0.78) {
      webpQuality = Math.max(0.78, webpQuality - 0.06);
      const nextWebpBlob = await canvasToBlob(canvas, 'image/webp', webpQuality);

      if (!nextWebpBlob) {
        break;
      }

      webpBlob = nextWebpBlob;
    }

    if (webpBlob && webpBlob.size < blob.size) {
      blob = webpBlob;
      targetMimeType = 'image/webp';
    }
  }

  const didResize = targetWidth !== image.width || targetHeight !== image.height;

  if (!didResize && blob.size >= file.size) {
    return {
      file,
      compressed: false,
      originalBytes: file.size,
      compressedBytes: file.size,
    };
  }

  const compressedFile = new File([blob], createFileName(file.name, blob.type), {
    type: blob.type,
    lastModified: Date.now(),
  });

  return {
    file: compressedFile,
    compressed: true,
    originalBytes: file.size,
    compressedBytes: compressedFile.size,
  };
}

export async function uploadImageAsset(file: File, options: UploadImageOptions) {
  const compressed = await compressImageForUpload(file, options);
  const formData = new FormData();

  formData.append('file', compressed.file);
  formData.append('modul', options.module);
  formData.append('originalName', file.name);

  if (options.purpose) {
    formData.append('purpose', options.purpose);
  }

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  const payload = (await response.json()) as UploadApiResponse;

  if (!response.ok) {
    throw new Error(payload.details || payload.error || 'Upload gagal');
  }

  return {
    ...payload.data,
    compressed: compressed.compressed,
    originalBytes: compressed.originalBytes,
    compressedBytes: compressed.compressedBytes,
  };
}
