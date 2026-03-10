export function normalizeMimeType(mime: string): string {
  return mime.split(';')[0].trim().toLowerCase();
}
