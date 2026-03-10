export interface Format {
  name: string;
  extension: string;
  mime: string;
  category: string;
  lossless?: boolean;
}

export interface FormatHandler {
  name: string;
  description: string;
  init: () => Promise<void>;
  doConvert: (file: File, toFormat: Format) => Promise<Blob>;
  getSupportedInputFormats: () => Format[];
  getSupportedOutputFormats: (inputFormat: Format) => Format[];
}
