import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Upload, FileType, ArrowRight, Download, Loader2, X, Search, Layers, Combine } from 'lucide-react';
import { Format } from '../lib/converter/types';
import { ALL_FORMATS, CommonFormats } from '../lib/converter/CommonFormats';
import { normalizeMimeType } from '../lib/converter/normalizeMimeType';
import { findHandler, initHandlers } from '../lib/converter/registry';
import { loadFFmpeg, convertFile } from '../lib/ffmpeg';
import type { FFmpeg } from '@ffmpeg/ffmpeg';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, setDoc, collection, serverTimestamp } from 'firebase/firestore';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';

export function Converter({ theme = 'dark' }: { theme?: 'dark' | 'light' }) {
  const { user } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [isBatch, setIsBatch] = useState(false);
  const [isMerge, setIsMerge] = useState(false);
  const [inputFormat, setInputFormat] = useState<Format | null>(null);
  const [targetFormat, setTargetFormat] = useState<Format | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [convertedBlob, setConvertedBlob] = useState<Blob | null>(null);
  const [convertedFileName, setConvertedFileName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [ffmpeg, setFfmpeg] = useState<FFmpeg | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Advanced Options
  const [quality, setQuality] = useState(0.9);
  const [removeAudio, setRemoveAudio] = useState(false);
  const [width, setWidth] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [trimStart, setTrimStart] = useState<string>('');
  const [trimEnd, setTrimEnd] = useState<string>('');
  const [framerate, setFramerate] = useState<string>('');
  const [audioBitrate, setAudioBitrate] = useState<string>('192k');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initHandlers().catch(console.error);
    // FFmpeg is now loaded lazily when needed to prevent massive network congestion on initial load
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []) as File[];
    if (selectedFiles.length > 0) {
      processFiles(selectedFiles);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files || []) as File[];
    if (droppedFiles.length > 0) {
      processFiles(droppedFiles);
    }
  };

  const processFiles = (selectedFiles: File[]) => {
    if (!isBatch && !isMerge) {
      // Single file mode
      setFiles([selectedFiles[0]]);
    } else {
      // Batch or Merge mode
      setFiles(prev => [...prev, ...selectedFiles]);
    }
    
    setConvertedBlob(null);
    setError(null);
    setTargetFormat(null);
    setProgress(0);
    setSearchQuery('');
    
    // Use the first file to determine the input format
    const primaryFile = selectedFiles[0];
    const mime = normalizeMimeType(primaryFile.type);
    const format = ALL_FORMATS.find(f => f.mime === mime);
    
    if (format) {
      setInputFormat(format);
    } else {
      // Fallback based on extension
      const ext = primaryFile.name.split('.').pop()?.toLowerCase();
      const formatByExt = ALL_FORMATS.find(f => f.extension === ext);
      if (formatByExt) {
        setInputFormat(formatByExt);
      } else {
        // If still not found, let's try to guess the category
        const category = primaryFile.type.split('/')[0];
        if (['video', 'audio', 'image'].includes(category)) {
          setInputFormat({
            name: `${ext?.toUpperCase() || 'Unknown'} File`,
            extension: ext || 'unknown',
            mime: primaryFile.type,
            category: category as any,
            lossless: false
          });
        } else {
          setError(`Unsupported file format: ${primaryFile.type || ext}`);
          setInputFormat(null);
        }
      }
    }
  };

  const handleConvert = async () => {
    if (files.length === 0 || !inputFormat || !targetFormat) return;

    setIsConverting(true);
    setError(null);
    setProgress(0);

    try {
      const isMedia = ['video', 'audio', 'image'].includes(inputFormat.category) && ['video', 'audio', 'image'].includes(targetFormat.category);
      
      let currentFfmpeg = ffmpeg;
      if (isMedia && !currentFfmpeg) {
        setProgress(-1); // -1 means downloading engine
        currentFfmpeg = await loadFFmpeg();
        setFfmpeg(currentFfmpeg);
        setProgress(0);
      }

      const conversionOptions = {
        quality,
        removeAudio,
        width: width ? parseInt(width) : undefined,
        height: height ? parseInt(height) : undefined,
        maintainAspectRatio,
        trimStart: trimStart || undefined,
        trimEnd: trimEnd || undefined,
        framerate: framerate ? parseInt(framerate) : undefined,
        audioBitrate: audioBitrate || undefined
      };

      const convertedBlobs: { name: string, blob: Blob }[] = [];
      let totalSize = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const progressBase = (i / files.length) * 100;
        const progressMultiplier = 1 / files.length;
        
        let blob: Blob;
        if (isMedia && currentFfmpeg) {
          const { url } = await convertFile(currentFfmpeg, file, targetFormat.extension, (p) => {
            setProgress(progressBase + (p * progressMultiplier));
          }, conversionOptions);
          const res = await fetch(url);
          blob = await res.blob();
        } else {
          const handler = findHandler(inputFormat.mime, targetFormat.mime);
          if (!handler) {
            throw new Error(`No handler found to convert ${inputFormat.name} to ${targetFormat.name}`);
          }
          blob = await handler.doConvert(file, targetFormat, conversionOptions);
          setProgress(progressBase + (100 * progressMultiplier));
        }

        const originalName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        const convertedName = `${originalName}.${targetFormat.extension}`;
        convertedBlobs.push({ name: convertedName, blob });
        totalSize += file.size;

        // Save history to Firestore if user is logged in
        if (user) {
          try {
            const newDocRef = doc(collection(db, 'users', user.uid, 'conversions'));
            await setDoc(newDocRef, {
              id: newDocRef.id,
              userId: user.uid,
              originalName: file.name,
              convertedName: convertedName,
              originalFormat: inputFormat.extension,
              targetFormat: targetFormat.extension,
              size: file.size,
              convertedAt: serverTimestamp()
            });
          } catch (historyError) {
            console.error("Failed to save conversion history:", historyError);
          }
        }
      }

      if (files.length === 1) {
        setConvertedBlob(convertedBlobs[0].blob);
        setConvertedFileName(convertedBlobs[0].name);
      } else if (isMerge && targetFormat.mime === CommonFormats.PDF.mime) {
        // Merge PDFs
        const mergedPdf = await PDFDocument.create();
        for (const cb of convertedBlobs) {
          const pdfBytes = await cb.blob.arrayBuffer();
          const pdf = await PDFDocument.load(pdfBytes);
          const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
          copiedPages.forEach((page) => mergedPdf.addPage(page));
        }
        const mergedPdfBytes = await mergedPdf.save();
        setConvertedBlob(new Blob([mergedPdfBytes], { type: CommonFormats.PDF.mime }));
        setConvertedFileName('Merged_Document.pdf');
      } else {
        // Zip multiple files
        const zip = new JSZip();
        convertedBlobs.forEach(cb => {
          zip.file(cb.name, cb.blob);
        });
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        setConvertedBlob(zipBlob);
        setConvertedFileName(isMerge ? `Merged_Files.zip` : `Batch_Converted.zip`);
      }

    } catch (err: any) {
      setError(err.message || 'Conversion failed');
    } finally {
      setIsConverting(false);
      setProgress(100);
    }
  };

  const handleDownload = () => {
    if (!convertedBlob || files.length === 0 || !targetFormat) return;
    
    const url = URL.createObjectURL(convertedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = convertedFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setFiles([]);
    setInputFormat(null);
    setTargetFormat(null);
    setConvertedBlob(null);
    setConvertedFileName('');
    setError(null);
    setProgress(0);
    setSearchQuery('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Get available output formats based on input format
  const availableOutputFormats = useMemo(() => {
    if (!inputFormat) return [];
    return ALL_FORMATS.filter(f => {
      if (['video', 'audio', 'image'].includes(inputFormat.category) && ['video', 'audio', 'image'].includes(f.category)) {
        return true;
      }
      return !!findHandler(inputFormat.mime, f.mime);
    });
  }, [inputFormat]);

  const filteredOutputFormats = useMemo(() => {
    let formats = availableOutputFormats;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      formats = formats.filter(f => 
        f.name.toLowerCase().includes(query) || 
        f.extension.toLowerCase().includes(query)
      );
    }
    
    // Sort by category first, then alphabetically
    const catOrder: Record<string, number> = { 
      image: 1, video: 2, audio: 3, document: 4, spreadsheet: 5, archive: 6, code: 7, font: 8, other: 99 
    };
    
    return formats.sort((a, b) => {
      const aCat = catOrder[a.category] || 99;
      const bCat = catOrder[b.category] || 99;
      if (aCat !== bCat) return aCat - bCat;
      return a.name.localeCompare(b.name);
    });
  }, [availableOutputFormats, searchQuery]);

  return (
    <div className={`w-full rounded-2xl ${theme === 'dark' ? 'bg-[#161616] text-white' : 'bg-white text-black'}`}>
      <div className={`p-6 border-b rounded-t-2xl ${theme === 'dark' ? 'border-[#2a2a2a] bg-[#111]' : 'border-[#ddd] bg-[#f5f5f5]'}`}>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <FileType className={`w-5 h-5 ${theme === 'dark' ? 'text-[#00ff9d]' : 'text-[#006633]'}`} />
          Universal File Converter
        </h2>
        <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-[#aaa]' : 'text-[#666]'}`}>100% client-side, privacy-focused conversion</p>
      </div>

      <div className="p-6">
        <div className="flex gap-6 mb-6">
          <label className={`flex items-center gap-2 cursor-pointer text-sm font-medium transition-colors ${isBatch ? (theme === 'dark' ? 'text-[#00ff9d]' : 'text-[#006633]') : (theme === 'dark' ? 'text-[#888] hover:text-[#ccc]' : 'text-[#666] hover:text-[#333]')}`}>
            <input 
              type="checkbox" 
              checked={isBatch} 
              onChange={(e) => { 
                setIsBatch(e.target.checked); 
                if(e.target.checked) setIsMerge(false); 
                if(!e.target.checked && files.length > 1) setFiles([files[0]]);
              }} 
              className="hidden" 
            />
            <div className={`w-4 h-4 rounded flex items-center justify-center border ${isBatch ? (theme === 'dark' ? 'bg-[#00ff9d] border-[#00ff9d] text-black' : 'bg-[#006633] border-[#006633] text-white') : (theme === 'dark' ? 'border-[#555]' : 'border-[#ccc]')}`}>
              {isBatch && <Layers className="w-3 h-3" />}
            </div>
            <Layers className="w-4 h-4" /> Batch Conversion
          </label>
          <label className={`flex items-center gap-2 cursor-pointer text-sm font-medium transition-colors ${isMerge ? (theme === 'dark' ? 'text-[#00ff9d]' : 'text-[#006633]') : (theme === 'dark' ? 'text-[#888] hover:text-[#ccc]' : 'text-[#666] hover:text-[#333]')}`}>
            <input 
              type="checkbox" 
              checked={isMerge} 
              onChange={(e) => { 
                setIsMerge(e.target.checked); 
                if(e.target.checked) setIsBatch(false);
                if(!e.target.checked && files.length > 1) setFiles([files[0]]);
              }} 
              className="hidden" 
            />
            <div className={`w-4 h-4 rounded flex items-center justify-center border ${isMerge ? (theme === 'dark' ? 'bg-[#00ff9d] border-[#00ff9d] text-black' : 'bg-[#006633] border-[#006633] text-white') : (theme === 'dark' ? 'border-[#555]' : 'border-[#ccc]')}`}>
              {isMerge && <Combine className="w-3 h-3" />}
            </div>
            <Combine className="w-4 h-4" /> Merge Files
          </label>
        </div>

        {files.length === 0 ? (
          <div 
            className={`border-2 border-dashed rounded-xl p-6 sm:p-10 text-center transition-colors cursor-pointer ${theme === 'dark' ? 'border-[#333] hover:bg-[#222]' : 'border-[#ccc] hover:bg-[#f9f9f9]'}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className={`w-10 h-10 mx-auto mb-4 ${theme === 'dark' ? 'text-[#666]' : 'text-[#999]'}`} />
            <p className="font-medium mb-1">Click or drag file{isBatch || isMerge ? 's' : ''} to this area to upload</p>
            <p className={`text-sm ${theme === 'dark' ? 'text-[#888]' : 'text-[#666]'}`}>Supports all media and document formats (Video, Audio, Images, PDF, Word, Excel, ZIP)</p>
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple={isBatch || isMerge}
            />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Selected Files ({files.length})</h3>
                <button onClick={reset} className={`text-xs hover:underline ${theme === 'dark' ? 'text-[#00ff9d]' : 'text-[#006633]'}`}>Clear All</button>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                {files.map((file, idx) => (
                  <div key={idx} className={`flex items-center justify-between p-3 rounded-lg border ${theme === 'dark' ? 'bg-[#111] border-[#333]' : 'bg-[#f5f5f5] border-[#ddd]'}`}>
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 font-medium text-xs ${theme === 'dark' ? 'bg-[#222] text-[#00ff9d]' : 'bg-[#e0e0e0] text-[#006633]'}`}>
                        {file.name.split('.').pop()?.toUpperCase() || '?'}
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className={`text-xs ${theme === 'dark' ? 'text-[#888]' : 'text-[#666]'}`}>
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        const newFiles = files.filter((_, i) => i !== idx);
                        if (newFiles.length === 0) reset();
                        else setFiles(newFiles);
                      }}
                      className={`p-1.5 rounded-full transition-colors ${theme === 'dark' ? 'text-[#888] hover:text-white hover:bg-[#333]' : 'text-[#666] hover:text-black hover:bg-[#e0e0e0]'}`}
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className={`p-3 text-sm rounded-lg border ${theme === 'dark' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-red-50 text-red-600 border-red-100'}`}>
                {error}
              </div>
            )}

            {inputFormat && !convertedBlob && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="flex-1 w-full relative" ref={dropdownRef}>
                    <label className={`block text-xs font-medium mb-1 uppercase tracking-wider ${theme === 'dark' ? 'text-[#888]' : 'text-[#666]'}`}>Convert To</label>
                    
                    <div 
                      className={`w-full text-sm rounded-lg flex items-center justify-between p-2.5 cursor-pointer border transition-colors ${theme === 'dark' ? 'bg-[#222] border-[#444] text-white hover:border-[#00ff9d]' : 'bg-white border-[#ccc] text-black hover:border-[#006633]'}`}
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                      <span>{targetFormat ? `${targetFormat.name} (.${targetFormat.extension})` : 'Select format...'}</span>
                      <ArrowRight className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-90' : ''}`} />
                    </div>

                    {isDropdownOpen && (
                      <div className={`absolute z-50 w-full mt-1 top-full rounded-lg border shadow-lg overflow-hidden ${theme === 'dark' ? 'bg-[#222] border-[#444]' : 'bg-white border-[#ccc]'}`}>
                        <div className={`p-2 border-b flex items-center gap-2 ${theme === 'dark' ? 'border-[#444]' : 'border-[#eee]'}`}>
                          <Search className={`w-4 h-4 ${theme === 'dark' ? 'text-[#888]' : 'text-[#666]'}`} />
                          <input
                            type="text"
                            className={`w-full bg-transparent outline-none text-sm ${theme === 'dark' ? 'text-white placeholder-[#888]' : 'text-black placeholder-[#999]'}`}
                            placeholder="Search formats (e.g., mp4, pdf)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="max-h-[40vh] overflow-y-auto">
                          {filteredOutputFormats.length === 0 ? (
                            <div className={`p-3 text-sm text-center ${theme === 'dark' ? 'text-[#888]' : 'text-[#666]'}`}>
                              No formats found
                            </div>
                          ) : (
                            filteredOutputFormats.map(f => (
                              <div
                                key={f.extension}
                                className={`p-2.5 text-sm cursor-pointer transition-colors ${targetFormat?.extension === f.extension ? (theme === 'dark' ? 'bg-[#333] text-[#00ff9d]' : 'bg-[#f0f0f0] text-[#006633]') : (theme === 'dark' ? 'hover:bg-[#333]' : 'hover:bg-[#f5f5f5]')}`}
                                onClick={() => {
                                  setTargetFormat(f);
                                  setIsDropdownOpen(false);
                                  setSearchQuery('');
                                }}
                              >
                                <div className="font-medium">{f.name}</div>
                                <div className={`text-xs ${theme === 'dark' ? 'text-[#888]' : 'text-[#666]'}`}>.{f.extension}</div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                    <button
                      onClick={handleConvert}
                      disabled={!targetFormat || isConverting}
                      className={`w-full sm:w-auto flex items-center justify-center gap-2 font-medium py-2.5 px-5 rounded-lg transition-colors ${!targetFormat || isConverting ? (theme === 'dark' ? 'bg-[#333] text-[#666]' : 'bg-[#ddd] text-[#999]') : (theme === 'dark' ? 'bg-[#00ff9d] text-black hover:bg-[#00cc7e]' : 'bg-black text-white hover:bg-gray-800')}`}
                    >
                      {isConverting ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> {progress === -1 ? 'Downloading Engine...' : `Converting... ${progress > 0 ? `${progress}%` : ''}`}</>
                      ) : (
                        <>Convert <ArrowRight className="w-4 h-4" /></>
                      )}
                    </button>
                  </div>
                </div>

                {targetFormat && (targetFormat.category === 'image' || targetFormat.category === 'video' || targetFormat.category === 'audio') && (
                  <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-[#111] border-[#333]' : 'bg-[#f5f5f5] border-[#ddd]'}`}>
                    <div 
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                    >
                      <h4 className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Advanced Options</h4>
                      <ArrowRight className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-90' : ''} ${theme === 'dark' ? 'text-[#888]' : 'text-[#666]'}`} />
                    </div>
                    
                    {showAdvanced && (
                      <div className="mt-4 space-y-4">
                        {/* Image Quality */}
                        {targetFormat.category === 'image' && (
                          <div>
                            <label className={`block text-xs mb-2 ${theme === 'dark' ? 'text-[#888]' : 'text-[#666]'}`}>
                              Image Quality: {Math.round(quality * 100)}%
                            </label>
                            <input 
                              type="range" 
                              min="0.1" 
                              max="1.0" 
                              step="0.1" 
                              value={quality} 
                              onChange={(e) => setQuality(parseFloat(e.target.value))}
                              className="w-full accent-[#00ff9d]"
                            />
                          </div>
                        )}

                        {/* Dimensions (Image & Video) */}
                        {(targetFormat.category === 'image' || targetFormat.category === 'video') && (
                          <div className="space-y-2">
                            <label className={`block text-xs ${theme === 'dark' ? 'text-[#888]' : 'text-[#666]'}`}>
                              Resize (Leave empty to keep original)
                            </label>
                            <div className="flex gap-2 items-center">
                              <input 
                                type="number" 
                                placeholder="Width" 
                                value={width}
                                onChange={(e) => setWidth(e.target.value)}
                                className={`w-24 p-1.5 text-sm rounded border ${theme === 'dark' ? 'bg-[#222] border-[#444] text-white' : 'bg-white border-[#ccc] text-black'}`}
                              />
                              <span className={theme === 'dark' ? 'text-[#888]' : 'text-[#666]'}>x</span>
                              <input 
                                type="number" 
                                placeholder="Height" 
                                value={height}
                                onChange={(e) => setHeight(e.target.value)}
                                className={`w-24 p-1.5 text-sm rounded border ${theme === 'dark' ? 'bg-[#222] border-[#444] text-white' : 'bg-white border-[#ccc] text-black'}`}
                              />
                            </div>
                            <label className={`flex items-center gap-2 text-xs cursor-pointer ${theme === 'dark' ? 'text-[#ccc]' : 'text-[#333]'}`}>
                              <input 
                                type="checkbox" 
                                checked={maintainAspectRatio} 
                                onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                                className="rounded accent-[#00ff9d]"
                              />
                              Maintain Aspect Ratio
                            </label>
                          </div>
                        )}

                        {/* Video Specific */}
                        {targetFormat.category === 'video' && (
                          <div className="space-y-4">
                            <div>
                              <label className={`block text-xs mb-1 ${theme === 'dark' ? 'text-[#888]' : 'text-[#666]'}`}>
                                Framerate (FPS)
                              </label>
                              <input 
                                type="number" 
                                placeholder="e.g., 30" 
                                value={framerate}
                                onChange={(e) => setFramerate(e.target.value)}
                                className={`w-full p-1.5 text-sm rounded border ${theme === 'dark' ? 'bg-[#222] border-[#444] text-white' : 'bg-white border-[#ccc] text-black'}`}
                              />
                            </div>
                            <label className={`flex items-center gap-2 text-sm cursor-pointer ${theme === 'dark' ? 'text-[#ccc]' : 'text-[#333]'}`}>
                              <input 
                                type="checkbox" 
                                checked={removeAudio} 
                                onChange={(e) => setRemoveAudio(e.target.checked)}
                                className="rounded accent-[#00ff9d]"
                              />
                              Remove Audio Track
                            </label>
                          </div>
                        )}

                        {/* Audio Specific */}
                        {targetFormat.category === 'audio' && (
                          <div>
                            <label className={`block text-xs mb-1 ${theme === 'dark' ? 'text-[#888]' : 'text-[#666]'}`}>
                              Audio Bitrate
                            </label>
                            <select 
                              value={audioBitrate}
                              onChange={(e) => setAudioBitrate(e.target.value)}
                              className={`w-full p-1.5 text-sm rounded border ${theme === 'dark' ? 'bg-[#222] border-[#444] text-white' : 'bg-white border-[#ccc] text-black'}`}
                            >
                              <option value="64k">64 kbps (Low)</option>
                              <option value="128k">128 kbps (Standard)</option>
                              <option value="192k">192 kbps (High)</option>
                              <option value="320k">320 kbps (Very High)</option>
                            </select>
                          </div>
                        )}

                        {/* Trimming (Video & Audio) */}
                        {(targetFormat.category === 'video' || targetFormat.category === 'audio') && (
                          <div className="space-y-2">
                            <label className={`block text-xs ${theme === 'dark' ? 'text-[#888]' : 'text-[#666]'}`}>
                              Trim (Format: HH:MM:SS)
                            </label>
                            <div className="flex gap-2 items-center">
                              <input 
                                type="text" 
                                placeholder="Start (e.g. 00:00:10)" 
                                value={trimStart}
                                onChange={(e) => setTrimStart(e.target.value)}
                                className={`w-full p-1.5 text-sm rounded border ${theme === 'dark' ? 'bg-[#222] border-[#444] text-white' : 'bg-white border-[#ccc] text-black'}`}
                              />
                              <span className={theme === 'dark' ? 'text-[#888]' : 'text-[#666]'}>to</span>
                              <input 
                                type="text" 
                                placeholder="End (e.g. 00:01:30)" 
                                value={trimEnd}
                                onChange={(e) => setTrimEnd(e.target.value)}
                                className={`w-full p-1.5 text-sm rounded border ${theme === 'dark' ? 'bg-[#222] border-[#444] text-white' : 'bg-white border-[#ccc] text-black'}`}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {convertedBlob && (
              <div className={`border rounded-lg p-5 text-center ${theme === 'dark' ? 'bg-[#111] border-[#00ff9d]/30' : 'bg-[#f5f5f5] border-[#006633]/30'}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${theme === 'dark' ? 'bg-[#222] text-[#00ff9d]' : 'bg-[#e0e0e0] text-[#006633]'}`}>
                  <FileType className="w-6 h-6" />
                </div>
                <h3 className={`font-medium mb-1 ${theme === 'dark' ? 'text-[#00ff9d]' : 'text-[#006633]'}`}>Conversion Complete!</h3>
                <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-[#aaa]' : 'text-[#666]'}`}>
                  Your {targetFormat?.name} file is ready to download.
                </p>
                <button
                  onClick={handleDownload}
                  className={`inline-flex items-center gap-2 font-medium py-2 px-6 rounded-lg transition-colors ${theme === 'dark' ? 'bg-[#00ff9d] text-black hover:bg-[#00cc7e]' : 'bg-black text-white hover:bg-gray-800'}`}
                >
                  <Download className="w-4 h-4" />
                  Download File
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

