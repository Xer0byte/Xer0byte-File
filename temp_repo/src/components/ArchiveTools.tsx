import React, { useState, useRef } from 'react';
import { Archive, Upload, ArrowRight, Download, Loader2, X, FileArchive } from 'lucide-react';
import JSZip from 'jszip';

export function ArchiveTools({ theme = 'dark' }: { theme?: 'dark' | 'light' }) {
  const [mode, setMode] = useState<'zip' | 'unzip'>('zip');
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultName, setResultName] = useState('');
  const [extractedFiles, setExtractedFiles] = useState<{name: string, blob: Blob}[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []) as File[];
    
    if (selectedFiles.length > 0) {
      if (mode === 'unzip') {
        const zipFile = selectedFiles.find(f => f.name.endsWith('.zip'));
        if (zipFile) {
          setFiles([zipFile]);
        } else {
          setError('Please select a valid ZIP file.');
          return;
        }
      } else {
        setFiles(prev => [...prev, ...selectedFiles]);
      }
      setResultBlob(null);
      setExtractedFiles([]);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files || []) as File[];
    
    if (droppedFiles.length > 0) {
      if (mode === 'unzip') {
        const zipFile = droppedFiles.find(f => f.name.endsWith('.zip'));
        if (zipFile) {
          setFiles([zipFile]);
        } else {
          setError('Please drop a valid ZIP file.');
          return;
        }
      } else {
        setFiles(prev => [...prev, ...droppedFiles]);
      }
      setResultBlob(null);
      setExtractedFiles([]);
      setError(null);
    }
  };

  const handleProcess = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setError(null);

    try {
      if (mode === 'zip') {
        const zip = new JSZip();
        files.forEach(file => {
          zip.file(file.name, file);
        });
        const content = await zip.generateAsync({ type: 'blob' });
        setResultBlob(content);
        setResultName('Archive.zip');
      } else if (mode === 'unzip') {
        const zip = new JSZip();
        const contents = await zip.loadAsync(files[0]);
        const extracted: {name: string, blob: Blob}[] = [];
        
        for (const [filename, fileData] of Object.entries(contents.files)) {
          if (!fileData.dir) {
            const blob = await fileData.async('blob');
            extracted.push({ name: filename, blob });
          }
        }
        
        if (extracted.length === 0) {
          throw new Error('No files found in the ZIP archive.');
        }
        
        setExtractedFiles(extracted);
      }
    } catch (err: any) {
      setError(err.message || `Failed to ${mode} files.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = async () => {
    if (extractedFiles.length === 0) return;
    
    // If there's only one file, just download it directly
    if (extractedFiles.length === 1) {
      handleDownload(extractedFiles[0].blob, extractedFiles[0].name);
      return;
    }

    // Otherwise, re-zip them (maybe they just wanted to see what's inside, or we can just trigger multiple downloads)
    // Actually, triggering multiple downloads is better for "unzip"
    extractedFiles.forEach((file, index) => {
      setTimeout(() => {
        handleDownload(file.blob, file.name);
      }, index * 200); // Stagger downloads slightly
    });
  };

  const reset = () => {
    setFiles([]);
    setResultBlob(null);
    setExtractedFiles([]);
    setError(null);
  };

  return (
    <div className={`w-full rounded-2xl ${theme === 'dark' ? 'bg-[#161616] text-white' : 'bg-white text-black'}`}>
      <div className={`p-6 border-b rounded-t-2xl ${theme === 'dark' ? 'border-[#2a2a2a] bg-[#111]' : 'border-[#ddd] bg-[#f5f5f5]'}`}>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Archive className={`w-5 h-5 ${theme === 'dark' ? 'text-[#00ff9d]' : 'text-[#006633]'}`} />
          Archive Tools
        </h2>
        <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-[#aaa]' : 'text-[#666]'}`}>Compress files into ZIP or extract ZIP archives</p>
      </div>

      <div className="p-6">
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => { setMode('zip'); reset(); }}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${mode === 'zip' ? (theme === 'dark' ? 'bg-[#333] text-[#00ff9d] border border-[#00ff9d]/30' : 'bg-[#e0e0e0] text-[#006633] border border-[#006633]/30') : (theme === 'dark' ? 'bg-[#111] text-[#888] border border-[#333] hover:bg-[#222]' : 'bg-[#f5f5f5] text-[#666] border border-[#ddd] hover:bg-[#eaeaea]')}`}
          >
            <FileArchive className="w-4 h-4" /> Create ZIP
          </button>
          <button
            onClick={() => { setMode('unzip'); reset(); }}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${mode === 'unzip' ? (theme === 'dark' ? 'bg-[#333] text-[#00ff9d] border border-[#00ff9d]/30' : 'bg-[#e0e0e0] text-[#006633] border border-[#006633]/30') : (theme === 'dark' ? 'bg-[#111] text-[#888] border border-[#333] hover:bg-[#222]' : 'bg-[#f5f5f5] text-[#666] border border-[#ddd] hover:bg-[#eaeaea]')}`}
          >
            <Archive className="w-4 h-4" /> Extract ZIP
          </button>
        </div>

        {files.length === 0 ? (
          <div 
            className={`border-2 border-dashed rounded-xl p-6 sm:p-10 text-center transition-colors cursor-pointer ${theme === 'dark' ? 'border-[#333] hover:bg-[#222]' : 'border-[#ccc] hover:bg-[#f9f9f9]'}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className={`w-10 h-10 mx-auto mb-4 ${theme === 'dark' ? 'text-[#666]' : 'text-[#999]'}`} />
            <p className="font-medium mb-1">Click or drag {mode === 'zip' ? 'files' : 'a ZIP file'} here</p>
            <p className={`text-sm ${theme === 'dark' ? 'text-[#888]' : 'text-[#666]'}`}>
              {mode === 'zip' ? 'Select multiple files to compress into a single ZIP archive' : 'Select a ZIP archive to extract its contents'}
            </p>
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept={mode === 'unzip' ? '.zip' : undefined}
              multiple={mode === 'zip'}
            />
          </div>
        ) : (
          <div className="space-y-6">
            <div className={`flex items-center justify-between p-4 rounded-lg border ${theme === 'dark' ? 'bg-[#111] border-[#333]' : 'bg-[#f5f5f5] border-[#ddd]'}`}>
              <div className="flex items-center gap-3 overflow-hidden">
                <div className={`w-10 h-10 rounded flex items-center justify-center shrink-0 ${theme === 'dark' ? 'bg-[#222] text-[#00ff9d]' : 'bg-[#e0e0e0] text-[#006633]'}`}>
                  <Archive className="w-5 h-5" />
                </div>
                <div className="truncate">
                  <p className="text-sm font-medium truncate">{files.length === 1 ? files[0].name : `${files.length} files selected`}</p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-[#888]' : 'text-[#666]'}`}>
                    {files.length === 1 ? `${(files[0].size / 1024 / 1024).toFixed(2)} MB` : 'Ready to compress'}
                  </p>
                </div>
              </div>
              <button 
                onClick={reset}
                className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'text-[#888] hover:text-white hover:bg-[#333]' : 'text-[#666] hover:text-black hover:bg-[#e0e0e0]'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className={`p-3 text-sm rounded-lg border ${theme === 'dark' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-red-50 text-red-600 border-red-100'}`}>
                {error}
              </div>
            )}

            {!resultBlob && extractedFiles.length === 0 && (
              <button
                onClick={handleProcess}
                disabled={isProcessing}
                className={`w-full flex items-center justify-center gap-2 font-medium py-3 px-5 rounded-lg transition-colors ${isProcessing ? (theme === 'dark' ? 'bg-[#333] text-[#666]' : 'bg-[#ddd] text-[#999]') : (theme === 'dark' ? 'bg-[#00ff9d] text-black hover:bg-[#00cc7e]' : 'bg-black text-white hover:bg-gray-800')}`}
              >
                {isProcessing ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                ) : (
                  <>{mode === 'zip' ? 'Compress to ZIP' : 'Extract Files'} <ArrowRight className="w-5 h-5" /></>
                )}
              </button>
            )}

            {resultBlob && mode === 'zip' && (
              <div className={`border rounded-lg p-6 text-center ${theme === 'dark' ? 'bg-[#111] border-[#00ff9d]/30' : 'bg-[#f5f5f5] border-[#006633]/30'}`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${theme === 'dark' ? 'bg-[#222] text-[#00ff9d]' : 'bg-[#e0e0e0] text-[#006633]'}`}>
                  <FileArchive className="w-8 h-8" />
                </div>
                <h3 className={`text-lg font-medium mb-2 ${theme === 'dark' ? 'text-[#00ff9d]' : 'text-[#006633]'}`}>ZIP Created Successfully!</h3>
                <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-[#aaa]' : 'text-[#666]'}`}>
                  Your files have been compressed into a single ZIP archive.
                </p>
                <button
                  onClick={() => handleDownload(resultBlob, resultName)}
                  className={`inline-flex items-center gap-2 font-medium py-3 px-8 rounded-lg transition-colors ${theme === 'dark' ? 'bg-[#00ff9d] text-black hover:bg-[#00cc7e]' : 'bg-black text-white hover:bg-gray-800'}`}
                >
                  <Download className="w-5 h-5" />
                  Download ZIP
                </button>
              </div>
            )}

            {extractedFiles.length > 0 && mode === 'unzip' && (
              <div className={`border rounded-lg p-6 ${theme === 'dark' ? 'bg-[#111] border-[#00ff9d]/30' : 'bg-[#f5f5f5] border-[#006633]/30'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`font-medium ${theme === 'dark' ? 'text-[#00ff9d]' : 'text-[#006633]'}`}>Extracted {extractedFiles.length} files</h3>
                  <button
                    onClick={handleDownloadAll}
                    className={`text-sm font-medium px-4 py-1.5 rounded-lg transition-colors ${theme === 'dark' ? 'bg-[#00ff9d] text-black hover:bg-[#00cc7e]' : 'bg-black text-white hover:bg-gray-800'}`}
                  >
                    Download All
                  </button>
                </div>
                <div className={`max-h-60 overflow-y-auto rounded border ${theme === 'dark' ? 'border-[#333] bg-[#161616]' : 'border-[#ddd] bg-white'}`}>
                  {extractedFiles.map((file, idx) => (
                    <div key={idx} className={`flex items-center justify-between p-3 border-b last:border-0 ${theme === 'dark' ? 'border-[#333]' : 'border-[#eee]'}`}>
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 text-xs font-medium ${theme === 'dark' ? 'bg-[#222] text-[#888]' : 'bg-[#f0f0f0] text-[#666]'}`}>
                          {file.name.split('.').pop()?.toUpperCase() || '?'}
                        </div>
                        <p className="text-sm truncate">{file.name}</p>
                      </div>
                      <button
                        onClick={() => handleDownload(file.blob, file.name)}
                        className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'text-[#00ff9d] hover:bg-[#222]' : 'text-[#006633] hover:bg-[#f0f0f0]'}`}
                        title="Download file"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
