import { Format, FormatHandler } from '../types';
import { CommonFormats } from '../CommonFormats';

export class ImageHandler implements FormatHandler {
  name = 'Canvas Image Converter';
  description = 'Converts basic images using HTML5 Canvas';

  async init() {
    // No initialization needed for Canvas
  }

  getSupportedInputFormats(): Format[] {
    return [CommonFormats.PNG, CommonFormats.JPEG, CommonFormats.WEBP];
  }

  getSupportedOutputFormats(inputFormat: Format): Format[] {
    return [CommonFormats.PNG, CommonFormats.JPEG, CommonFormats.WEBP].filter(
      f => f.mime !== inputFormat.mime
    );
  }

  async doConvert(file: File, toFormat: Format): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas toBlob failed'));
          },
          toFormat.mime,
          0.9 // quality for jpeg/webp
        );
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      
      img.src = url;
    });
  }
}
