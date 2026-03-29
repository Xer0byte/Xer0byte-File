import { Format, FormatHandler } from '../types';
import { CommonFormats } from '../CommonFormats';
import JSZip from 'jszip';

export class ArchiveHandler implements FormatHandler {
  name = 'Archive Converter';
  description = 'Converts files into ZIP archives';

  async init() {
    // No initialization needed
  }

  getSupportedInputFormats(): Format[] {
    return [
      CommonFormats.PDF,
      CommonFormats.DOCX,
      CommonFormats.TXT,
      CommonFormats.MD,
      CommonFormats.HTML,
      CommonFormats.PNG,
      CommonFormats.JPEG,
      CommonFormats.WEBP,
      CommonFormats.GIF,
      CommonFormats.XLSX,
      CommonFormats.CSV,
      CommonFormats.JSON
    ];
  }

  getSupportedOutputFormats(inputFormat: Format): Format[] {
    if (inputFormat.mime === CommonFormats.ZIP.mime) {
      return []; // We don't support extracting ZIPs yet
    }
    return [CommonFormats.ZIP];
  }

  async doConvert(file: File, toFormat: Format): Promise<Blob> {
    if (toFormat.mime !== CommonFormats.ZIP.mime) {
      throw new Error(`Unsupported target format: ${toFormat.name}`);
    }

    const zip = new JSZip();
    zip.file(file.name, file);
    
    return await zip.generateAsync({ type: 'blob' });
  }
}
