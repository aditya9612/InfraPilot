/**
 * Safely sets an item in localStorage without throwing QuotaExceededError or crashing the UI.
 */
export const safeSetItem = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error: any) {
    console.warn(`[safeSetItem] Failed to set key "${key}" in localStorage. Attempting cleanup...`, error);
    
    // Attempt cleanup of old drafts and temporary keys
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (
          k.startsWith('work_update_data_') || 
          k.startsWith('task_history_photos_') ||
          k.includes('draft') ||
          k.includes('temp')
        ) && k !== key) {
          keysToRemove.push(k);
        }
      }
      
      keysToRemove.forEach(k => localStorage.removeItem(k));
      
      // Retry once after cleanup
      localStorage.setItem(key, value);
      return true;
    } catch (retryError) {
      console.error(`[safeSetItem] Failed to save key "${key}" even after cleanup:`, retryError);
      return false;
    }
  }
};

/**
 * Compresses an image file to a lightweight data URL string.
 * Reduces raw 5MB+ photos down to ~30-100KB so localStorage quota is never hit.
 */
export const compressImageFile = (
  file: File,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.7
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = (err) => reject(err);
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = (err) => reject(err);
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};
