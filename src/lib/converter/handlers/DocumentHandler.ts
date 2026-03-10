import { Format, FormatHandler } from '../types';
import { CommonFormats } from '../CommonFormats';
import * as mammoth from 'mammoth';
import { marked } from 'marked';
import jsPDF from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export class DocumentHandler implements FormatHandler {
  name = 'Document Converter';
  description = 'Converts between document formats (DOCX, PDF, TXT, MD, HTML)';

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
      CommonFormats.JPEG
    ];
  }

  getSupportedOutputFormats(inputFormat: Format): Format[] {
    const outputs = [
      CommonFormats.TXT,
      CommonFormats.MD,
      CommonFormats.HTML,
      CommonFormats.PDF
    ];

    // Images can only go to PDF currently
    if (inputFormat.category === 'image') {
      return [CommonFormats.PDF];
    }

    return outputs.filter(f => f.mime !== inputFormat.mime);
  }

  async doConvert(file: File, toFormat: Format): Promise<Blob> {
    const inputMime = file.type || CommonFormats.TXT.mime;

    // Handle Image to PDF
    if (inputMime.startsWith('image/') && toFormat.mime === CommonFormats.PDF.mime) {
      return this.imageToPdf(file);
    }

    // Read file content
    const isBinary = inputMime === CommonFormats.DOCX.mime || inputMime === CommonFormats.PDF.mime;
    const content = await this.readFile(file, isBinary ? 'arrayBuffer' : 'text');

    let textContent = '';
    let htmlContent = '';

    // Extract content based on input format
    if (inputMime === CommonFormats.PDF.mime) {
      textContent = await this.extractPdfText(content as ArrayBuffer);
      htmlContent = `<p>${textContent.replace(/\n/g, '<br>')}</p>`;
    } else if (inputMime === CommonFormats.DOCX.mime) {
      const result = await mammoth.extractRawText({ arrayBuffer: content as ArrayBuffer });
      textContent = result.value;
      const htmlResult = await mammoth.convertToHtml({ arrayBuffer: content as ArrayBuffer });
      htmlContent = htmlResult.value;
    } else if (inputMime === CommonFormats.MD.mime) {
      textContent = content as string;
      htmlContent = await marked.parse(textContent) as string;
    } else if (inputMime === CommonFormats.HTML.mime) {
      htmlContent = content as string;
      textContent = this.stripHtml(htmlContent);
    } else {
      textContent = content as string;
      htmlContent = `<p>${textContent.replace(/\n/g, '<br>')}</p>`;
    }

    // Convert to target format
    switch (toFormat.mime) {
      case CommonFormats.TXT.mime:
        return new Blob([textContent], { type: toFormat.mime });
      case CommonFormats.MD.mime:
        // Basic conversion, full HTML to MD is complex
        return new Blob([textContent], { type: toFormat.mime });
      case CommonFormats.HTML.mime:
        return new Blob([htmlContent], { type: toFormat.mime });
      case CommonFormats.PDF.mime:
        return this.textToPdf(textContent);
      default:
        throw new Error(`Unsupported target format: ${toFormat.name}`);
    }
  }

  private async extractPdfText(arrayBuffer: ArrayBuffer): Promise<string> {
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n\n';
    }
    return fullText;
  }

  private readFile(file: File, type: 'text' | 'arrayBuffer'): Promise<string | ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string | ArrayBuffer);
      reader.onerror = () => reject(new Error('Failed to read file'));
      if (type === 'text') reader.readAsText(file);
      else reader.readAsArrayBuffer(file);
    });
  }

  private stripHtml(html: string): string {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  private async imageToPdf(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        try {
          const pdf = new jsPDF({
            orientation: img.width > img.height ? 'landscape' : 'portrait',
            unit: 'px',
            format: [img.width, img.height]
          });
          
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Could not get canvas context');
          
          ctx.drawImage(img, 0, 0);
          const imgData = canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg');
          
          pdf.addImage(imgData, file.type === 'image/png' ? 'PNG' : 'JPEG', 0, 0, img.width, img.height);
          resolve(pdf.output('blob'));
        } catch (err) {
          reject(err);
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      
      img.src = url;
    });
  }

  private textToPdf(text: string): Promise<Blob> {
    return new Promise((resolve) => {
      const pdf = new jsPDF();
      const margin = 10;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const maxLineWidth = pageWidth - margin * 2;
      
      const lines = pdf.splitTextToSize(text, maxLineWidth);
      let cursorY = margin;
      
      for (let i = 0; i < lines.length; i++) {
        if (cursorY > pdf.internal.pageSize.getHeight() - margin) {
          pdf.addPage();
          cursorY = margin;
        }
        pdf.text(lines[i], margin, cursorY);
        cursorY += 7; // line height
      }
      
      resolve(pdf.output('blob'));
    });
  }
}
