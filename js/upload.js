/* ============================================
   东方圣光 · 图片上传模块
   ============================================ */

const STORAGE_BUCKET = 'checkin-images';
const MAX_FILES = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png'];
const COMPRESS_TARGET = 500 * 1024; // 500KB

// --- 文件验证 ---

function validateFile(file) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: '仅支持 JPG / PNG 格式' };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: '图片不能超过 5MB' };
  }
  return { valid: true };
}

// --- 图片压缩 ---

function compressImage(file, targetSize = COMPRESS_TARGET) {
  return new Promise((resolve, reject) => {
    // 如果文件已经很小，直接返回
    if (file.size <= targetSize) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // 手机截图通常较大，限制最大尺寸
        const MAX_DIM = 1200;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height / width) * MAX_DIM);
            width = MAX_DIM;
          } else {
            width = Math.round((width / height) * MAX_DIM);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // 二分法找合适的 quality
        let quality = 0.8;
        const tryCompress = (q) => {
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('压缩失败'));
              return;
            }
            if (blob.size <= targetSize || q <= 0.2) {
              resolve(new File([blob], file.name, { type: 'image/jpeg' }));
            } else {
              quality -= 0.15;
              tryCompress(quality);
            }
          }, 'image/jpeg', q);
        };
        tryCompress(quality);
      };
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}

// --- 上传到 Supabase Storage ---

async function uploadImage(file, memberName, taskDate) {
  const timestamp = Date.now();
  const ext = file.type === 'image/png' ? 'png' : 'jpg';
  const safeName = memberName.replace(/[^a-zA-Z0-9一-龥_-]/g, '_');
  const path = `checkins/${taskDate}/${safeName}_${timestamp}.${ext}`;

  const { data, error } = await getSupabase()
    .storage
    .from(STORAGE_BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;

  // 获取公开 URL
  const { data: urlData } = getSupabase()
    .storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path);

  return urlData.publicUrl;
}

// --- 批量上传 ---

async function uploadImages(files, memberName, taskDate) {
  const urls = [];
  for (const file of files) {
    // 压缩
    const compressed = await compressImage(file);
    // 上传
    const url = await uploadImage(compressed, memberName, taskDate);
    urls.push(url);
  }
  return urls;
}
