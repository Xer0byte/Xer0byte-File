import fs from 'fs';
import path from 'path';

const logoPath = path.resolve('src/assets/logo.png');
const data = fs.readFileSync(logoPath);
const base64 = data.toString('base64');
const content = `export const logoBase64 = 'data:image/png;base64,${base64}';\n`;

fs.writeFileSync(path.resolve('src/logoBase64.ts'), content);
console.log('Logo converted to base64 successfully.');
