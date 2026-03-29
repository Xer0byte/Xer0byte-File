export interface Format {
  name: string;
  extension: string;
  mime: string;
  category: string;
  lossless?: boolean;
}

export interface ConversionOptions {
  quality?: number; // 0.1 to 1.0 for images
  removeAudio?: boolean; // for videos
  width?: number; // for images and videos
  height?: number; // for images and videos
  maintainAspectRatio?: boolean; // for images and videos
  trimStart?: string; // for audio and videos (format: HH:MM:SS)
  trimEnd?: string; // for audio and videos
  framerate?: number; // for videos
  audioBitrate?: string; // for audio (e.g., '128k', '192k')
}

export interface FormatHandler {
  name: string;
  description: string;
  init: () => Promise<void>;
  doConvert: (file: File, toFormat: Format, options?: ConversionOptions) => Promise<Blob>;
  getSupportedInputFormats: () => Format[];
  getSupportedOutputFormats: (inputFormat: Format) => Format[];
}
