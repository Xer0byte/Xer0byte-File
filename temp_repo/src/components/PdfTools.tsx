import React, { useState, useRef } from 'react';
import { FileType, Upload, ArrowRight, Download, Loader2, X, Plus } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

export function PdfTools({ theme = 'dark' }: { theme?: 'dark' | 'light' }) {
  const [mode, setMode] = useState<'merge' | 'split'>('merge');
  const [splitRanges, setSplitRanges] = useState<string>('');
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultName, setResultName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []) as File[];
    const pdfFiles = selectedFiles.filter(f => f.type === 'application/pdf');
    if (pdfFiles.length > 0) {
      setFiles(prev => [...prev, ...pdfFiles]);
      setResultBlob(null);
      setError(null);
    } else {
      setError('Please select valid PDF files.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files || []) as File[];
    const pdfFiles = droppedFiles.filter(f => f.type === 'application/pdf');
    if (pdfFiles.length > 0) {
      setFiles(prev => [...prev, ...pdfFiles]);
      setResultBlob(null);
      setError(null);
    } else {
      setError('Please drop valid PDF files.');
    }
  };

  const handleProcess = async () => {
    if (mode === 'merge') {
      if (files.length < 2) {
        setError('Please select at least 2 PDF files to merge.');
        return;
      }
      setIsProcessing(true);
      setError(null);
      try {
        const mergedPdf = await PDFDocument.create();
        for (const file of files) {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await PDFDocument.load(arrayBuffer);
          const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
          copiedPages.forEach((page) => mergedPdf.addPage(page));
        }
        const mergedPdfBytes = await mergedPdf.save();
        const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
        setResultBlob(blob);
        setResultName('Merged_Document.pdf');
      } catch (err: any) {
        setError(err.message || 'Failed to merge PDFs.');
      } finally {
        setIsProcessing(false);
      }
    } else if (mode === 'split') {
      if (files.length !== 1) {
        setError('Please select exactly 1 PDF file to split.');
        return;
      }
      setIsProcessing(true);
      setError(null);
      try {
        const file = files[0];
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const totalPages = pdf.getPageCount();
        
        let pagesToExtract: number[] = [];
        if (!splitRanges.trim()) {
          // If no range provided, extract all pages into a new PDF (or just return the same)
          pagesToExtract = Array.from({ length: totalPages }, (_, i) => i);
        } else {
          // Parse ranges like "1, 3-5, 7"
          const parts = splitRanges.split(',').map(p => p.trim());
          for (const part of parts) {
            if (part.includes('-')) {
              const [start, end] = part.split('-').map(n => parseInt(n, 10));
              if (!isNaN(start) && !isNaN(end) && start >= 1 && end <= totalPages && start <= end) {
                for (let i = start; i <= end; i++) {
                  pagesToExtract.push(i - 1); // 0-indexed
                }
              }
            } else {
              const num = parseInt(part, 10);
              if (!isNaN(num) && num >= 1 && num <= totalPages) {
                pagesToExtract.push(num - 1);
              }
            }
          }
        }
        
        if (pagesToExtract.length === 0) {
          throw new Error('Invalid page range specified.');
        }
        
        const splitPdf = await PDFDocument.create();
        const copiedPages = await splitPdf.copyPages(pdf, pagesToExtract);
        copiedPages.forEach((page) => splitPdf.addPage(page));
        
        const splitPdfBytes = await splitPdf.save();
        const blob = new Blob([splitPdfBytes], { type: 'application/pdf' });
        setResultBlob(blob);
        const originalName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        setResultName(`${originalName}_split.pdf`);
      } catch (err: any) {
        setError(err.message || 'Failed to split PDF.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleDownload = () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = resultName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setResultBlob(null);
  };

  return (
    <div className={`w-full rounded-2xl ${theme === 'dark' ? 'bg-[#161616] text-white' : 'bg-white text-black'}`}>
      <div className={`p-6 border-b rounded-t-2xl ${theme === 'dark' ? 'border-[#2a2a2a] bg-[#111]' : 'border-[#ddd] bg-[#f5f5f5]'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <FileType className={`w-5 h-5 ${theme === 'dark' ? 'text-[#00ff9d]' : 'text-[#006633]'}`} />
              PDF Tools
            </h2>
            <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-[#aaa]' : 'text-[#666]'}`}>Merge or split your PDF documents</p>
          </div>
          <div className={`flex rounded-lg p-1 border ${theme === 'dark' ? 'bg-[#222] border-[#444]' : 'bg-[#e0e0e0] border-[#ccc]'}`}>
            <button 
              onClick={() => { setMode('merge'); setFiles([]); setResultBlob(null); setError(null); }}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${mode === 'merge' ? (theme === 'dark' ? 'bg-[#333] text-[#00ff9d]' : 'bg-white text-[#006633] shadow-sm') : (theme === 'dark' ? 'text-[#aaa] hover:text-white' : 'text-[#666] hover:text-black')}`}
            >
              Merge
            </button>
            <button 
              onClick={() => { setMode('split'); setFiles([]); setResultBlob(null); setError(null); }}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${mode === 'split' ? (theme === 'dark' ? 'bg-[#333] text-[#00ff9d]' : 'bg-white text-[#006633] shadow-sm') : (theme === 'dark' ? 'text-[#aaa] hover:text-white' : 'text-[#666] hover:text-black')}`}
            >
              Split
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {files.length === 0 ? (
          <div 
            className={`border-2 border-dashed rounded-xl p-6 sm:p-10 text-center transition-colors cursor-pointer ${theme === 'dark' ? 'border-[#333] hover:bg-[#222]' : 'border-[#ccc] hover:bg-[#f9f9f9]'}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className={`w-10 h-10 mx-auto mb-4 ${theme === 'dark' ? 'text-[#666]' : 'text-[#999]'}`} />
            <p className="font-medium mb-1">Click or drag PDF files here</p>
            <p className={`text-sm ${theme === 'dark' ? 'text-[#888]' : 'text-[#666]'}`}>{mode === 'merge' ? 'Select 2 or more PDFs to merge' : 'Select 1 PDF to split'}</p>
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="application/pdf"
              multiple={mode === 'merge'}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
              {files.map((file, index) => (
                <div key={index} className={`flex items-center justify-between p-3 rounded-lg border ${theme === 'dark' ? 'bg-[#111] border-[#333]' : 'bg-[#f5f5f5] border-[#ddd]'}`}>
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`w-8 h-8 rounded shrink-0 flex items-center justify-center font-medium text-xs ${theme === 'dark' ? 'bg-[#222] text-[#00ff9d]' : 'bg-[#e0e0e0] text-[#006633]'}`}>
                      {index + 1}
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className={`text-xs ${theme === 'dark' ? 'text-[#888]' : 'text-[#666]'}`}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button onClick={() => removeFile(index)} className={`p-1.5 rounded-full transition-colors ${theme === 'dark' ? 'text-[#888] hover:text-white hover:bg-[#333]' : 'text-[#666] hover:text-black hover:bg-[#e0e0e0]'}`}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              {mode === 'merge' && (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex-1 py-2.5 rounded-lg border flex items-center justify-center gap-2 text-sm font-medium transition-colors ${theme === 'dark' ? 'border-[#444] hover:bg-[#222]' : 'border-[#ccc] hover:bg-[#f0f0f0]'}`}
                >
                  <Plus className="w-4 h-4" /> Add More
                </button>
              )}
              <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileSelect} accept="application/pdf" multiple={mode === 'merge'} />
              
              <button 
                onClick={() => { setFiles([]); setResultBlob(null); }}
                className={`flex-1 py-2.5 rounded-lg border flex items-center justify-center gap-2 text-sm font-medium transition-colors ${theme === 'dark' ? 'border-[#444] hover:bg-[#222] text-red-400' : 'border-[#ccc] hover:bg-[#f0f0f0] text-red-600'}`}
              >
                Clear All
              </button>
            </div>

            {mode === 'split' && files.length === 1 && (
              <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-[#111] border-[#333]' : 'bg-[#f5f5f5] border-[#ddd]'}`}>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-[#aaa]' : 'text-[#555]'}`}>
                  Pages to Extract (e.g., 1, 3-5, 7)
                </label>
                <input 
                  type="text" 
                  value={splitRanges}
                  onChange={(e) => setSplitRanges(e.target.value)}
                  placeholder="Leave empty to extract all pages"
                  className={`w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#00ff9d]/50 transition-all ${theme === 'dark' ? 'bg-[#222] border-[#444] text-white' : 'bg-white border-[#ccc] text-black'}`}
                />
              </div>
            )}

            {error && (
              <div className={`p-3 text-sm rounded-lg border ${theme === 'dark' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-red-50 text-red-600 border-red-100'}`}>
                {error}
              </div>
            )}

            {!resultBlob && (
              <button
                onClick={handleProcess}
                disabled={(mode === 'merge' && files.length < 2) || (mode === 'split' && files.length !== 1) || isProcessing}
                className={`w-full flex items-center justify-center gap-2 font-medium py-3 px-5 rounded-lg transition-colors ${(mode === 'merge' && files.length < 2) || (mode === 'split' && files.length !== 1) || isProcessing ? (theme === 'dark' ? 'bg-[#333] text-[#666]' : 'bg-[#ddd] text-[#999]') : (theme === 'dark' ? 'bg-[#00ff9d] text-black hover:bg-[#00cc7e]' : 'bg-black text-white hover:bg-gray-800')}`}
              >
                {isProcessing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                ) : (
                  <>{mode === 'merge' ? `Merge ${files.length} PDFs` : 'Split PDF'} <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            )}

            {resultBlob && (
              <div className={`border rounded-lg p-5 text-center mt-4 ${theme === 'dark' ? 'bg-[#111] border-[#00ff9d]/30' : 'bg-[#f5f5f5] border-[#006633]/30'}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${theme === 'dark' ? 'bg-[#222] text-[#00ff9d]' : 'bg-[#e0e0e0] text-[#006633]'}`}>
                  <FileType className="w-6 h-6" />
                </div>
                <h3 className={`font-medium mb-1 ${theme === 'dark' ? 'text-[#00ff9d]' : 'text-[#006633]'}`}>Success!</h3>
                <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-[#aaa]' : 'text-[#666]'}`}>
                  Your {mode === 'merge' ? 'merged' : 'split'} PDF is ready to download.
                </p>
                <button
                  onClick={handleDownload}
                  className={`inline-flex items-center gap-2 font-medium py-2 px-6 rounded-lg transition-colors ${theme === 'dark' ? 'bg-[#00ff9d] text-black hover:bg-[#00cc7e]' : 'bg-black text-white hover:bg-gray-800'}`}
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
