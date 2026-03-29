import React, { useState, useRef } from 'react';
import { Video, Upload, ArrowRight, Download, Loader2, X, Music } from 'lucide-react';
import { loadFFmpeg, convertFile } from '../lib/ffmpeg';
import type { FFmpeg } from '@ffmpeg/ffmpeg';

export function VideoTools({ theme = 'dark' }: { theme?: 'dark' | 'light' }) {
  const [mode, setMode] = useState<'extract_audio' | 'trim'>('extract_audio');
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultName, setResultName] = useState('');
  const [trimStart, setTrimStart] = useState<string>('00:00:00');
  const [trimEnd, setTrimEnd] = useState<string>('00:00:10');
  const [error, setError] = useState<string | null>(null);
  const [ffmpeg, setFfmpeg] = useState<FFmpeg | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type.startsWith('video/')) {
      setFile(selectedFile);
      setResultBlob(null);
      setError(null);
      setProgress(0);
    } else if (selectedFile) {
      setError('Please select a valid video file.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.type.startsWith('video/')) {
      setFile(droppedFile);
      setResultBlob(null);
      setError(null);
      setProgress(0);
    } else if (droppedFile) {
      setError('Please drop a valid video file.');
    }
  };

  const handleProcess = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    setProgress(0);

    try {
      let currentFfmpeg = ffmpeg;
      if (!currentFfmpeg) {
        setProgress(-1); // downloading engine
        currentFfmpeg = await loadFFmpeg();
        setFfmpeg(currentFfmpeg);
        setProgress(0);
      }

      const outputFormat = mode === 'extract_audio' ? 'mp3' : file.name.split('.').pop() || 'mp4';
      const options = mode === 'trim' ? { trimStart, trimEnd } : undefined;

      const { url } = await convertFile(currentFfmpeg, file, outputFormat, (p) => {
        setProgress(p * 100);
      }, options);
      
      const res = await fetch(url);
      const blob = await res.blob();
      
      setResultBlob(blob);
      const originalName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      const suffix = mode === 'extract_audio' ? 'audio' : 'trimmed';
      setResultName(`${originalName}_${suffix}.${outputFormat}`);
    } catch (err: any) {
      setError(err.message || `Failed to ${mode === 'extract_audio' ? 'extract audio' : 'trim video'}.`);
    } finally {
      setIsProcessing(false);
      setProgress(100);
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
    setProgress(0);
    setTrimStart('00:00:00');
    setTrimEnd('00:00:10');
  };

  return (
    <div className={`w-full rounded-2xl ${theme === 'dark' ? 'bg-[#161616] text-white' : 'bg-white text-black'}`}>
      <div className={`p-6 border-b rounded-t-2xl ${theme === 'dark' ? 'border-[#2a2a2a] bg-[#111]' : 'border-[#ddd] bg-[#f5f5f5]'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Video className={`w-5 h-5 ${theme === 'dark' ? 'text-[#00ff9d]' : 'text-[#006633]'}`} />
              Video Tools
            </h2>
            <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-[#aaa]' : 'text-[#666]'}`}>Extract audio or trim your videos</p>
          </div>
          <div className={`flex rounded-lg p-1 border ${theme === 'dark' ? 'bg-[#222] border-[#444]' : 'bg-[#e0e0e0] border-[#ccc]'}`}>
            <button 
              onClick={() => { setMode('extract_audio'); reset(); }}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${mode === 'extract_audio' ? (theme === 'dark' ? 'bg-[#333] text-[#00ff9d]' : 'bg-white text-[#006633] shadow-sm') : (theme === 'dark' ? 'text-[#aaa] hover:text-white' : 'text-[#666] hover:text-black')}`}
            >
              Extract Audio
            </button>
            <button 
              onClick={() => { setMode('trim'); reset(); }}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${mode === 'trim' ? (theme === 'dark' ? 'bg-[#333] text-[#00ff9d]' : 'bg-white text-[#006633] shadow-sm') : (theme === 'dark' ? 'text-[#aaa] hover:text-white' : 'text-[#666] hover:text-black')}`}
            >
              Trim
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
            <p className="font-medium mb-1">Click or drag a video here</p>
            <p className={`text-sm ${theme === 'dark' ? 'text-[#888]' : 'text-[#666]'}`}>Select a video to {mode === 'extract_audio' ? 'extract audio' : 'trim'}</p>
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="video/*"
            />
          </div>
        ) : (
          <div className="space-y-6">
            <div className={`flex items-center justify-between p-4 rounded-lg border ${theme === 'dark' ? 'bg-[#111] border-[#333]' : 'bg-[#f5f5f5] border-[#ddd]'}`}>
              <div className="flex items-center gap-3 overflow-hidden">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 font-medium text-sm ${theme === 'dark' ? 'bg-[#222] text-[#00ff9d]' : 'bg-[#e0e0e0] text-[#006633]'}`}>
                  VID
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

            {mode === 'trim' && (
              <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-[#111] border-[#333]' : 'bg-[#f5f5f5] border-[#ddd]'}`}>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-[#aaa]' : 'text-[#555]'}`}>
                  Trim Range (HH:MM:SS)
                </label>
                <div className="flex gap-4 items-center">
                  <input 
                    type="text" 
                    value={trimStart}
                    onChange={(e) => setTrimStart(e.target.value)}
                    placeholder="Start Time"
                    className={`w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#00ff9d]/50 transition-all ${theme === 'dark' ? 'bg-[#222] border-[#444] text-white' : 'bg-white border-[#ccc] text-black'}`}
                  />
                  <span className={`text-sm ${theme === 'dark' ? 'text-[#666]' : 'text-[#999]'}`}>to</span>
                  <input 
                    type="text" 
                    value={trimEnd}
                    onChange={(e) => setTrimEnd(e.target.value)}
                    placeholder="End Time"
                    className={`w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#00ff9d]/50 transition-all ${theme === 'dark' ? 'bg-[#222] border-[#444] text-white' : 'bg-white border-[#ccc] text-black'}`}
                  />
                </div>
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
                disabled={isProcessing}
                className={`w-full flex items-center justify-center gap-2 font-medium py-3 px-5 rounded-lg transition-colors ${isProcessing ? (theme === 'dark' ? 'bg-[#333] text-[#666]' : 'bg-[#ddd] text-[#999]') : (theme === 'dark' ? 'bg-[#00ff9d] text-black hover:bg-[#00cc7e]' : 'bg-black text-white hover:bg-gray-800')}`}
              >
                {isProcessing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> {progress === -1 ? 'Downloading Engine...' : `Processing... ${progress > 0 ? `${progress.toFixed(0)}%` : ''}`}</>
                ) : (
                  <>{mode === 'extract_audio' ? 'Extract Audio (MP3)' : 'Trim Video'} <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            )}

            {resultBlob && (
              <div className={`border rounded-lg p-5 text-center mt-4 ${theme === 'dark' ? 'bg-[#111] border-[#00ff9d]/30' : 'bg-[#f5f5f5] border-[#006633]/30'}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${theme === 'dark' ? 'bg-[#222] text-[#00ff9d]' : 'bg-[#e0e0e0] text-[#006633]'}`}>
                  {mode === 'extract_audio' ? <Music className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                </div>
                <h3 className={`font-medium mb-1 ${theme === 'dark' ? 'text-[#00ff9d]' : 'text-[#006633]'}`}>Success!</h3>
                <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-[#aaa]' : 'text-[#666]'}`}>
                  Your {mode === 'extract_audio' ? 'audio' : 'trimmed video'} is ready to download.
                </p>
                <button
                  onClick={handleDownload}
                  className={`inline-flex items-center gap-2 font-medium py-2 px-6 rounded-lg transition-colors ${theme === 'dark' ? 'bg-[#00ff9d] text-black hover:bg-[#00cc7e]' : 'bg-black text-white hover:bg-gray-800'}`}
                >
                  <Download className="w-4 h-4" />
                  Download {mode === 'extract_audio' ? 'MP3' : 'Video'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
