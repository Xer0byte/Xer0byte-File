import { Format, FormatHandler } from '../types';
import { CommonFormats } from '../CommonFormats';

export class GenericTextHandler implements FormatHandler {
  name = 'Text/Code Converter';
  description = 'Converts between text and code formats';

  async init() {
    // No initialization needed
  }

  getSupportedInputFormats(): Format[] {
    return [
      CommonFormats.TXT,
      CommonFormats.JSON,
      CommonFormats.XML,
      CommonFormats.YML,
      CommonFormats.HTML,
      CommonFormats.MD,
      CommonFormats.CSV,
      CommonFormats.BATCH,
      CommonFormats.PYTHON,
      CommonFormats.SH
    ];
  }

  getSupportedOutputFormats(inputFormat: Format): Format[] {
    return [
      CommonFormats.TXT,
      CommonFormats.JSON,
      CommonFormats.XML,
      CommonFormats.YML,
      CommonFormats.HTML,
      CommonFormats.MD,
      CommonFormats.CSV,
      CommonFormats.BATCH,
      CommonFormats.PYTHON,
      CommonFormats.SH
    ].filter(f => f.mime !== inputFormat.mime);
  }

  async doConvert(file: File, toFormat: Format): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          // For now, we just pass the text through and change the extension/mime type.
          // In a real app, we would parse and stringify (e.g., JSON to XML).
          resolve(new Blob([text], { type: toFormat.mime }));
        } catch (err) {
          reject(new Error(`Failed to convert text: ${err}`));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
}
