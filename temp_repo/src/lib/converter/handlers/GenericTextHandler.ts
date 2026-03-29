import { Format, FormatHandler } from '../types';
import { CommonFormats } from '../CommonFormats';
import * as yaml from 'yaml';
import { js2xml, xml2js } from 'xml-js';

export class GenericTextHandler implements FormatHandler {
  name = 'Text/Code Converter';
  description = 'Converts between text and code formats (JSON, YAML, XML)';

  async init() {
    // No initialization needed
  }

  getSupportedInputFormats(): Format[] {
    return [
      CommonFormats.TXT,
      CommonFormats.JSON,
      CommonFormats.XML,
      CommonFormats.YML,
    ];
  }

  getSupportedOutputFormats(inputFormat: Format): Format[] {
    return [
      CommonFormats.TXT,
      CommonFormats.JSON,
      CommonFormats.XML,
      CommonFormats.YML,
    ].filter(f => f.mime !== inputFormat.mime);
  }

  async doConvert(file: File, toFormat: Format): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          let parsedObj: any = null;
          let outputText = text;

          // 1. Parse input to an object if possible
          if (file.type === CommonFormats.JSON.mime || file.name.endsWith('.json')) {
            try { parsedObj = JSON.parse(text); } catch (e) {}
          } else if (file.type === CommonFormats.YML.mime || file.name.endsWith('.yml') || file.name.endsWith('.yaml')) {
            try { parsedObj = yaml.parse(text); } catch (e) {}
          } else if (file.type === CommonFormats.XML.mime || file.name.endsWith('.xml')) {
            try { 
              const xmlObj = xml2js(text, { compact: true }); 
              parsedObj = xmlObj;
            } catch (e) {}
          }

          // 2. Convert object to target format
          if (parsedObj) {
            if (toFormat.mime === CommonFormats.JSON.mime) {
              outputText = JSON.stringify(parsedObj, null, 2);
            } else if (toFormat.mime === CommonFormats.YML.mime) {
              outputText = yaml.stringify(parsedObj);
            } else if (toFormat.mime === CommonFormats.XML.mime) {
              outputText = js2xml(parsedObj, { compact: true, spaces: 2 });
            } else if (toFormat.mime === CommonFormats.TXT.mime) {
              outputText = typeof parsedObj === 'object' ? JSON.stringify(parsedObj, null, 2) : String(parsedObj);
            }
          }

          resolve(new Blob([outputText], { type: toFormat.mime }));
        } catch (err) {
          reject(new Error(`Failed to convert text: ${err}`));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
}
