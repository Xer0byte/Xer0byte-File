import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

export const loadFFmpeg = async (): Promise<FFmpeg> => {
  if (ffmpeg) return ffmpeg;

  ffmpeg = new FFmpeg();
  
  const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm';
  
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  return ffmpeg;
};

export const convertFile = async (
  ffmpeg: FFmpeg,
  file: File,
  outputFormat: string,
  onProgress: (progress: number) => void
): Promise<{ url: string; name: string }> => {
  const inputName = `input.${file.name.split('.').pop()}`;
  const outputName = `output.${outputFormat}`;

  ffmpeg.on('progress', ({ progress }) => {
    onProgress(Math.round(progress * 100));
  });

  await ffmpeg.writeFile(inputName, await fetchFile(file));
  
  // Run conversion
  await ffmpeg.exec(['-i', inputName, outputName]);
  
  const data = await ffmpeg.readFile(outputName);
  const blob = new Blob([(data as Uint8Array).buffer], { type: getMimeType(outputFormat) });
  const url = URL.createObjectURL(blob);
  
  // Cleanup
  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);
  ffmpeg.off('progress', () => {});

  return { url, name: outputName };
};

const getMimeType = (ext: string) => {
  const types: Record<string, string> = {
    mp4: 'video/mp4',
    webm: 'video/webm',
    avi: 'video/x-msvideo',
    mkv: 'video/x-matroska',
    mov: 'video/quicktime',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    aac: 'audio/aac',
    flac: 'audio/flac',
    jpg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif'
  };
  return types[ext] || 'application/octet-stream';
};
