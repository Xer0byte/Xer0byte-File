import { Format, FormatHandler } from '../types';
import { CommonFormats, ALL_FORMATS } from '../CommonFormats';

export class MockHandler implements FormatHandler {
  name = 'Advanced Media Converter';
  description = 'Converts advanced media and document formats';

  async init() {
    // No initialization needed
  }

  getSupportedInputFormats(): Format[] {
    return ALL_FORMATS;
  }

  getSupportedOutputFormats(inputFormat: Format): Format[] {
    // Return all formats except the input format to allow any-to-any conversion
    return ALL_FORMATS.filter(f => f.mime !== inputFormat.mime);
  }

  async doConvert(file: File, toFormat: Format): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          // In a real application, we would use WebAssembly (ffmpeg, imagemagick, etc.)
          // For now, we just change the mime type and return the blob
          const data = e.target?.result as ArrayBuffer;
          resolve(new Blob([data], { type: toFormat.mime }));
        } catch (err) {
          reject(new Error(`Failed to convert file: ${err}`));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }
}
