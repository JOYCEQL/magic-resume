/**
 * 用Canvas调整图片尺寸和质量，返回压缩后的base64图片数据
 */
export const compressImage = (
  file: File,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.7
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("无法创建Canvas上下文"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL(file.type || "image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = () => {
        reject(new Error("图片加载失败"));
      };
    };
    reader.onerror = () => {
      reject(new Error("文件读取失败"));
    };
  });
};

/**
 * 估算base64图片数据的实际大小（字节）
 * base64编码会将3字节的数据编码为4字节，所以实际大小约为base64字符串长度的3/4
 */
export const estimateBase64Size = (base64String: string): number => {
  const base64Data = base64String.split(",")[1] || base64String;
  return Math.round((base64Data.length * 3) / 4);
};
