import React, { useState, useRef } from 'react';
import { Image as ImageIcon, Upload, ArrowRight, Download, Loader2, X } from 'lucide-react';

export function ImageTools({ theme = 'dark' }: { theme?: 'dark' | 'light' }) {
  const [mode, setMode] = useState<'compress' | 'resize'>('compress');
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultName, setResultName] = useState('');
  const [quality, setQuality] = useState(0.7);
  const [resizeWidth, setResizeWidth] = useState<string>('');
  const [resizeHeight, setResizeHeight] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      setFile(selectedFile);
      setResultBlob(null);
      setError(null);
    } else if (selectedFile) {
      setError('Please select a valid image file.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      setFile(droppedFile);
      setResultBlob(null);
      setError(null);
    } else if (droppedFile) {
      setError('Please drop a valid image file.');
    }
  };

  const handleProcess = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    try {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = objectUrl;
      });

      const canvas = document.createElement('canvas');
      
      if (mode === 'resize') {
        const targetWidth = parseInt(resizeWidth) || img.width;
        const targetHeight = parseInt(resizeHeight) || img.height;
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }
      
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      const blob = await new Promise<Blob | null>((resolve) => {
        if (mode === 'compress') {
          canvas.toBlob(resolve, 'image/jpeg', quality);
        } else {
          canvas.toBlob(resolve, file.type, 0.92);
        }
      });

      if (!blob) throw new Error(`Failed to ${mode} image`);

      setResultBlob(blob);
      const originalName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      const ext = mode === 'compress' ? 'jpg' : file.name.split('.').pop() || 'png';
      setResultName(`${originalName}_${mode}ed.${ext}`);
      URL.revokeObjectURL(objectUrl);
    } catch (err: any) {
      setError(err.message || `Failed to ${mode} image.`);
    } finally {
      setIsProcessing(false);
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

  const reset = () => {
    setFile(null);
    setResultBlob(null);
    setError(null);
    setQuality(0.7);
    setResizeWidth('');
    setResizeHeight('');
  };

  return (
    <div className={`w-full rounded-2xl ${theme === 'dark' ? 'bg-[#161616] text-white' : 'bg-white text-black'}`}>
      <div className={`p-6 border-b rounded-t-2xl ${theme === 'dark' ? 'border-[#2a2a2a] bg-[#111]' : 'border-[#ddd] bg-[#f5f5f5]'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <ImageIcon className={`w-5 h-5 ${theme === 'dark' ? 'text-[#00ff9d]' : 'text-[#006633]'}`} />
              Image Tools
            </h2>
            <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-[#aaa]' : 'text-[#666]'}`}>Compress or resize your images</p>
          </div>
          <div className={`flex rounded-lg p-1 border ${theme === 'dark' ? 'bg-[#222] border-[#444]' : 'bg-[#e0e0e0] border-[#ccc]'}`}>
            <button 
              onClick={() => { setMode('compress'); reset(); }}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${mode === 'compress' ? (theme === 'dark' ? 'bg-[#333] text-[#00ff9d]' : 'bg-white text-[#006633] shadow-sm') : (theme === 'dark' ? 'text-[#aaa] hover:text-white' : 'text-[#666] hover:text-black')}`}
            >
              Compress
            </button>
            <button 
              onClick={() => { setMode('resize'); reset(); }}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${mode === 'resize' ? (theme === 'dark' ? 'bg-[#333] text-[#00ff9d]' : 'bg-white text-[#006633] shadow-sm') : (theme === 'dark' ? 'text-[#aaa] hover:text-white' : 'text-[#666] hover:text-black')}`}
            >
              Resize
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {!file ? (
          <div 
            className={`border-2 border-dashed rounded-xl p-6 sm:p-10 text-center transition-colors cursor-pointer ${theme === 'dark' ? 'border-[#333] hover:bg-[#222]' : 'border-[#ccc] hover:bg-[#f9f9f9]'}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className={`w-10 h-10 mx-auto mb-4 ${theme === 'dark' ? 'text-[#666]' : 'text-[#999]'}`} />
            <p className="font-medium mb-1">Click or drag an image here</p>
            <p className={`text-sm ${theme === 'dark' ? 'text-[#888]' : 'text-[#666]'}`}>Supports JPG, PNG, WebP</p>
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
            />
          </div>
        ) : (
          <div className="space-y-6">
            <div className={`flex items-center justify-between p-4 rounded-lg border ${theme === 'dark' ? 'bg-[#111] border-[#333]' : 'bg-[#f5f5f5] border-[#ddd]'}`}>
              <div className="flex items-center gap-3 overflow-hidden">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 font-medium text-sm ${theme === 'dark' ? 'bg-[#222] text-[#00ff9d]' : 'bg-[#e0e0e0] text-[#006633]'}`}>
                  IMG
                </div>
                <div className="truncate">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-[#888]' : 'text-[#666]'}`}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button onClick={reset} className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'text-[#888] hover:text-white hover:bg-[#333]' : 'text-[#666] hover:text-black hover:bg-[#e0e0e0]'}`}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className={`p-3 text-sm rounded-lg border ${theme === 'dark' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-red-50 text-red-600 border-red-100'}`}>
                {error}
              </div>
            )}

            {!resultBlob && (
              <div className="space-y-4">
                {mode === 'compress' && (
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className={`text-sm font-medium ${theme === 'dark' ? 'text-[#aaa]' : 'text-[#555]'}`}>Quality</label>
                      <span className={`text-sm font-medium ${theme === 'dark' ? 'text-[#00ff9d]' : 'text-[#006633]'}`}>{Math.round(quality * 100)}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0.1" 
                      max="1" 
                      step="0.1" 
                      value={quality} 
                      onChange={(e) => setQuality(parseFloat(e.target.value))}
                      className="w-full accent-[#00ff9d]"
                    />
                    <div className={`flex justify-between mt-1 text-xs ${theme === 'dark' ? 'text-[#666]' : 'text-[#999]'}`}>
                      <span>Smaller file</span>
                      <span>Better quality</span>
                    </div>
                  </div>
                )}

                {mode === 'resize' && (
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-[#aaa]' : 'text-[#555]'}`}>
                      Target Dimensions (px)
                    </label>
                    <div className="flex gap-4 items-center">
                      <input 
                        type="number" 
                        value={resizeWidth}
                        onChange={(e) => setResizeWidth(e.target.value)}
                        placeholder="Width"
                        className={`w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#00ff9d]/50 transition-all ${theme === 'dark' ? 'bg-[#222] border-[#444] text-white' : 'bg-white border-[#ccc] text-black'}`}
                      />
                      <span className={`text-sm ${theme === 'dark' ? 'text-[#666]' : 'text-[#999]'}`}>x</span>
                      <input 
                        type="number" 
                        value={resizeHeight}
                        onChange={(e) => setResizeHeight(e.target.value)}
                        placeholder="Height"
                        className={`w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#00ff9d]/50 transition-all ${theme === 'dark' ? 'bg-[#222] border-[#444] text-white' : 'bg-white border-[#ccc] text-black'}`}
                      />
                    </div>
                    <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-[#666]' : 'text-[#999]'}`}>Leave empty to keep original dimensions.</p>
                  </div>
                )}

                <button
                  onClick={handleProcess}
                  disabled={isProcessing}
                  className={`w-full flex items-center justify-center gap-2 font-medium py-3 px-5 rounded-lg transition-colors ${isProcessing ? (theme === 'dark' ? 'bg-[#333] text-[#666]' : 'bg-[#ddd] text-[#999]') : (theme === 'dark' ? 'bg-[#00ff9d] text-black hover:bg-[#00cc7e]' : 'bg-black text-white hover:bg-gray-800')}`}
                >
                  {isProcessing ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                  ) : (
                    <>{mode === 'compress' ? 'Compress Image' : 'Resize Image'} <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            )}

            {resultBlob && (
              <div className={`border rounded-lg p-5 text-center mt-4 ${theme === 'dark' ? 'bg-[#111] border-[#00ff9d]/30' : 'bg-[#f5f5f5] border-[#006633]/30'}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${theme === 'dark' ? 'bg-[#222] text-[#00ff9d]' : 'bg-[#e0e0e0] text-[#006633]'}`}>
                  <ImageIcon className="w-6 h-6" />
                </div>
                <h3 className={`font-medium mb-1 ${theme === 'dark' ? 'text-[#00ff9d]' : 'text-[#006633]'}`}>Success!</h3>
                <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-[#aaa]' : 'text-[#666]'}`}>
                  Your {mode === 'compress' ? 'compressed' : 'resized'} image is ready to download.
                </p>
                <div className={`text-xs mb-4 p-2 rounded ${theme === 'dark' ? 'bg-[#222] text-[#888]' : 'bg-[#e0e0e0] text-[#666]'}`}>
                  Original Size: {(file.size / 1024).toFixed(1)} KB <br/>
                  New Size: {(resultBlob.size / 1024).toFixed(1)} KB
                </div>
                <button
                  onClick={handleDownload}
                  className={`inline-flex items-center gap-2 font-medium py-2 px-6 rounded-lg transition-colors ${theme === 'dark' ? 'bg-[#00ff9d] text-black hover:bg-[#00cc7e]' : 'bg-black text-white hover:bg-gray-800'}`}
                >
                  <Download className="w-4 h-4" />
                  Download Image
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
