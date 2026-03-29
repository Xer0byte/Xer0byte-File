import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { FileText, Upload, Trash2, FileCode, File, FileType } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import mammoth from 'mammoth/mammoth.browser';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import html2pdf from 'html2pdf.js';
import { asBlob } from 'html-docx-js-typescript';
import { saveAs } from 'file-saver';
import { VisualPdfEditor } from './VisualPdfEditor';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface DocumentEditorProps {
  theme: 'dark' | 'light';
}

export function DocumentEditor({ theme }: DocumentEditorProps) {
  const [content, setContent] = useState('');
  const [fileName, setFileName] = useState('untitled.html');
  const [isLoading, setIsLoading] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setFileName(file.name);

    const ext = file.name.split('.').pop()?.toLowerCase();

    try {
      if (ext === 'txt' || ext === 'html' || ext === 'htm') {
        const text = await file.text();
        if (ext === 'txt') {
          setContent(`<p>${text.replace(/\n/g, '<br/>')}</p>`);
        } else {
          setContent(text);
        }
      } else if (ext === 'docx') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        setContent(result.value);
      } else if (ext === 'pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          
          let pageText = '';
          let lastY = -1;
          
          for (let item of textContent.items as any[]) {
            if (lastY !== item.transform[5] && lastY !== -1) {
              pageText += '<br/>';
            } else if (lastY !== -1) {
              pageText += ' ';
            }
            pageText += item.str;
            lastY = item.transform[5];
          }
          
          fullText += `<p>${pageText}</p><br/>`;
        }
        setContent(fullText);
      } else {
        alert('Unsupported file type. Please upload .pdf, .docx, .txt, or .html');
      }
    } catch (error) {
      console.error('Error reading file:', error);
      alert('Error reading file');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const downloadHtml = () => {
    if (!content) return;
    const blob = new Blob([content], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName.replace(/\.[^/.]+$/, '') + '.html');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadDocx = async () => {
    if (!content) return;
    const htmlString = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>${content}</body></html>`;
    const blob = await asBlob(htmlString);
    saveAs(blob as Blob, fileName.replace(/\.[^/.]+$/, '') + '.docx');
  };

  const downloadPdf = () => {
    if (!content) return;
    const element = document.createElement('div');
    element.innerHTML = content;
    element.style.padding = '20px';
    element.style.fontFamily = 'Arial, sans-serif';
    
    const opt = {
      margin:       10,
      filename:     fileName.replace(/\.[^/.]+$/, '') + '.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save();
  };
  const downloadTxt = () => {
    if (!content) return;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    // Replace br tags with newlines
    const brs = tempDiv.getElementsByTagName('br');
    for (let i = brs.length - 1; i >= 0; i--) {
      brs[i].parentNode?.replaceChild(document.createTextNode('\n'), brs[i]);
    }
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName.replace(/\.[^/.]+$/, '') + '.txt');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean']
    ],
  };

  const btnClass = `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
    theme === 'dark' ? 'bg-[#333] text-white hover:bg-[#444]' : 'bg-[#e0e0e0] text-black hover:bg-[#d0d0d0]'
  }`;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full flex flex-col"
    >
      <div className={`flex-1 rounded-xl border overflow-hidden flex flex-col ${theme === 'dark' ? 'border-[#333] bg-[#1a1a1a]' : 'border-[#eee] bg-white'}`}>
        <div className={`p-4 border-b flex flex-wrap justify-between items-center gap-4 ${theme === 'dark' ? 'border-[#333] bg-[#1a1a1a]' : 'border-[#eee] bg-[#fafafa]'}`}>
          <div className="flex items-center gap-3">
            <FileText className={theme === 'dark' ? 'text-[#00ff9d]' : 'text-[#006633]'} size={20} />
            <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Document Editor</h2>
            {content && <span className={`text-xs px-2 py-1 rounded-full ${theme === 'dark' ? 'bg-[#333] text-[#aaa]' : 'bg-[#e0e0e0] text-[#666]'}`}>{fileName}</span>}
          </div>
          
          <div className="flex items-center gap-2">
            <input 
              type="file" 
              accept=".txt,.html,.htm,.docx,.pdf" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className={btnClass}
            >
              <Upload size={16} /> Upload (.pdf, .docx, .txt, .html)
            </button>
            
            {content && (
              <>
                <div className={`h-6 w-px mx-1 ${theme === 'dark' ? 'bg-[#444]' : 'bg-[#ccc]'}`}></div>
                <button onClick={downloadPdf} className={btnClass} title="Download PDF">
                  <FileType size={16} /> PDF
                </button>
                <button onClick={downloadDocx} className={btnClass} title="Download DOCX">
                  <FileText size={16} /> DOCX
                </button>
                <button onClick={downloadHtml} className={btnClass} title="Download HTML">
                  <FileCode size={16} /> HTML
                </button>
                <button onClick={downloadTxt} className={btnClass} title="Download TXT">
                  <File size={16} /> TXT
                </button>
                <button onClick={() => { setContent(''); setFileName('untitled.html'); }} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${theme === 'dark' ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-red-100 text-red-600 hover:bg-red-200'}`} title="Clear Document">
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </div>

        <div className={`flex-1 overflow-hidden document-editor-container ${theme === 'dark' ? 'dark-mode' : ''}`}>
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00ff9d]"></div>
            </div>
          ) : !content ? (
            <div className={`h-full flex flex-col items-center justify-center text-center ${theme === 'dark' ? 'text-[#666]' : 'text-[#999]'}`}>
              <FileText size={48} className="mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Rich Text Document Editor</p>
              <p className="text-sm max-w-md">Upload a PDF, Word Document (.docx), HTML, or Text file to edit its contents and save it in any format.</p>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className={`mt-6 px-6 py-2 rounded-lg font-medium transition-colors ${theme === 'dark' ? 'bg-[#00ff9d] text-black hover:bg-[#00cc7d]' : 'bg-[#006633] text-white hover:bg-[#004d26]'}`}
              >
                Upload Document
              </button>
            </div>
          ) : (
            <>
              <style>{`
                .quill-page-editor {
                  display: flex;
                  flex-direction: column;
                  height: 100%;
                }
                .quill-page-editor .ql-toolbar {
                  background-color: ${theme === 'dark' ? '#1a1a1a' : '#ffffff'};
                  border: none !important;
                  border-bottom: 1px solid ${theme === 'dark' ? '#333' : '#e5e7eb'} !important;
                  padding: 12px !important;
                  text-align: center;
                  z-index: 10;
                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                }
                .quill-page-editor .ql-container {
                  border: none !important;
                  background-color: ${theme === 'dark' ? '#0a0a0a' : '#e5e7eb'};
                  overflow-y: auto;
                  padding: 2rem 0;
                }
                .quill-page-editor .ql-editor {
                  background-color: ${theme === 'dark' ? '#1a1a1a' : '#ffffff'};
                  color: ${theme === 'dark' ? '#ffffff' : '#000000'};
                  width: 210mm;
                  min-height: 297mm;
                  margin: 0 auto;
                  padding: 25.4mm;
                  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                  border-radius: 2px;
                  overflow-y: visible;
                  font-family: Arial, sans-serif;
                  font-size: 11pt;
                }
                ${theme === 'dark' ? `
                  .quill-page-editor .ql-stroke { stroke: #ccc !important; }
                  .quill-page-editor .ql-fill { fill: #ccc !important; }
                  .quill-page-editor .ql-picker { color: #ccc !important; }
                ` : ''}
              `}</style>
              <ReactQuill 
                theme="snow" 
                value={content} 
                onChange={setContent} 
                modules={modules}
                className="quill-page-editor"
              />
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
