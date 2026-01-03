/**
 * 图片验证结果
 */
export interface ImageValidationResult {
  ok: boolean;
  msg?: string;
}

/**
 * 将文件转换为 Base64
 * @param file - 文件对象
 */
export function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
  });
}

/**
 * 检查图片文件
 * @param file - 文件对象
 */
export function checkImage(file: File): ImageValidationResult {
  // 检查文件后缀
  const isValidSuffix = /\.(gif|jpg|jpeg|png|GIF|JPG|PNG)$/.test(file.name);
  if (!isValidSuffix) {
    return {
      ok: false,
      msg: '请上传 JPG/PNG/GIF 格式的图片',
    };
  }

  // 检查文件大小（最大 10MB）
  const maxSize = 10;
  const valid = file.size / 1024 / 1024 <= maxSize;
  if (!valid) {
    return {
      ok: false,
      msg: `由于公众号限制，图片大小不能超过 ${maxSize}M`,
    };
  }

  return { ok: true };
}

