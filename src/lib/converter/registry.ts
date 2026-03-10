import { FormatHandler } from './types';
import { ImageHandler } from './handlers/ImageHandler';
import { SpreadsheetHandler } from './handlers/SpreadsheetHandler';
import { DocumentHandler } from './handlers/DocumentHandler';
import { ArchiveHandler } from './handlers/ArchiveHandler';
import { GenericTextHandler } from './handlers/GenericTextHandler';
import { MockHandler } from './handlers/MockHandler';

export const handlers: FormatHandler[] = [
  new ImageHandler(),
  new SpreadsheetHandler(),
  new DocumentHandler(),
  new ArchiveHandler(),
  new GenericTextHandler(),
  new MockHandler(),
];

export async function initHandlers() {
  await Promise.all(handlers.map(h => h.init()));
}

export function findHandler(inputMime: string, outputMime: string): FormatHandler | undefined {
  return handlers.find(h => {
    const inputs = h.getSupportedInputFormats();
    const inputMatch = inputs.find(f => f.mime === inputMime);
    if (!inputMatch) return false;
    
    const outputs = h.getSupportedOutputFormats(inputMatch);
    return outputs.some(f => f.mime === outputMime);
  });
}
