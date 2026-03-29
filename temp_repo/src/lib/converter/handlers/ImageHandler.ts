import { Format, FormatHandler, ConversionOptions } from '../types';
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

  async doConvert(file: File, toFormat: Format, options?: ConversionOptions): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        let finalWidth = img.width;
        let finalHeight = img.height;

        if (options?.width || options?.height) {
          const maintainAspectRatio = options.maintainAspectRatio !== false;
          
          if (maintainAspectRatio) {
            const ratio = img.width / img.height;
            if (options.width && !options.height) {
              finalWidth = options.width;
              finalHeight = options.width / ratio;
            } else if (options.height && !options.width) {
              finalHeight = options.height;
              finalWidth = options.height * ratio;
            } else if (options.width && options.height) {
              // Fit within box
              const targetRatio = options.width / options.height;
              if (ratio > targetRatio) {
                finalWidth = options.width;
                finalHeight = options.width / ratio;
              } else {
                finalHeight = options.height;
                finalWidth = options.height * ratio;
              }
            }
          } else {
            finalWidth = options.width || img.width;
            finalHeight = options.height || img.height;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = finalWidth;
        canvas.height = finalHeight;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, finalWidth, finalHeight);
        
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas toBlob failed'));
          },
          toFormat.mime,
          options?.quality ?? 0.9 // quality for jpeg/webp
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
