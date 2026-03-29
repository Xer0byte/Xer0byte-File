import { Format, FormatHandler } from '../types';
import { CommonFormats } from '../CommonFormats';
import * as XLSX from 'xlsx';

export class SpreadsheetHandler implements FormatHandler {
  name = 'Spreadsheet Converter';
  description = 'Converts between spreadsheet formats and data formats';

  async init() {
    // No initialization needed
  }

  getSupportedInputFormats(): Format[] {
    return [
      CommonFormats.XLSX,
      CommonFormats.CSV,
      CommonFormats.JSON,
      CommonFormats.HTML
    ];
  }

  getSupportedOutputFormats(inputFormat: Format): Format[] {
    return [
      CommonFormats.XLSX,
      CommonFormats.CSV,
      CommonFormats.JSON,
      CommonFormats.HTML
    ].filter(f => f.mime !== inputFormat.mime);
  }

  async doConvert(file: File, toFormat: Format): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          let workbook: XLSX.WorkBook;

          if (file.type === CommonFormats.JSON.mime) {
            // Handle JSON to Worksheet
            const jsonStr = new TextDecoder().decode(data as ArrayBuffer);
            const jsonObj = JSON.parse(jsonStr);
            const worksheet = XLSX.utils.json_to_sheet(Array.isArray(jsonObj) ? jsonObj : [jsonObj]);
            workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
          } else {
            // Parse with XLSX
            workbook = XLSX.read(data, { type: 'array' });
          }

          let outputContent: any;
          
          switch (toFormat.mime) {
            case CommonFormats.XLSX.mime:
              outputContent = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
              resolve(new Blob([outputContent], { type: toFormat.mime }));
              break;
            case CommonFormats.CSV.mime:
              outputContent = XLSX.utils.sheet_to_csv(workbook.Sheets[workbook.SheetNames[0]]);
              resolve(new Blob([outputContent], { type: toFormat.mime }));
              break;
            case CommonFormats.JSON.mime:
              outputContent = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
              resolve(new Blob([JSON.stringify(outputContent, null, 2)], { type: toFormat.mime }));
              break;
            case CommonFormats.HTML.mime:
              outputContent = XLSX.utils.sheet_to_html(workbook.Sheets[workbook.SheetNames[0]]);
              resolve(new Blob([outputContent], { type: toFormat.mime }));
              break;
            default:
              reject(new Error(`Unsupported target format: ${toFormat.name}`));
          }
        } catch (err) {
          reject(new Error(`Failed to convert spreadsheet: ${err}`));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }
}
