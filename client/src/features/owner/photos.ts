// Хранилища файлов у нас нет, объявления живут в памяти сервера. Поэтому фото
// уменьшаем прямо в браузере и отправляем строкой data:image. Без уменьшения
// снимок с телефона весит мегабайты и запрос отвергается по размеру тела.

export const MAX_PHOTOS = 8;
const MAX_SIDE = 900;
const QUALITY = 0.72;

export async function fileToPhoto(
  file: File,
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error(
      `${file.name}: это не изображение`,
    );
  }

  const bitmap =
    await createImageBitmap(file);

  const scale = Math.min(
    1,
    MAX_SIDE / Math.max(bitmap.width, bitmap.height),
  );

  const width = Math.round(
    bitmap.width * scale,
  );
  const height = Math.round(
    bitmap.height * scale,
  );

  const canvas = document.createElement(
    "canvas",
  );
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    bitmap.close();

    throw new Error(
      "Браузер не дал обработать изображение",
    );
  }

  context.drawImage(
    bitmap,
    0,
    0,
    width,
    height,
  );
  bitmap.close();

  return canvas.toDataURL(
    "image/jpeg",
    QUALITY,
  );
}

export async function filesToPhotos(
  files: FileList | File[],
  existing: number,
): Promise<{
  photos: string[];
  errors: string[];
}> {
  const list = Array.from(files).slice(
    0,
    Math.max(0, MAX_PHOTOS - existing),
  );

  const photos: string[] = [];
  const errors: string[] = [];

  for (const file of list) {
    try {
      photos.push(await fileToPhoto(file));
    } catch (cause) {
      errors.push(
        cause instanceof Error
          ? cause.message
          : `${file.name}: не удалось обработать`,
      );
    }
  }

  return { photos, errors };
}
