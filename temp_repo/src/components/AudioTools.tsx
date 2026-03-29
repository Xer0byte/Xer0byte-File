import React, { useState, useRef } from 'react';
import { Music, Upload, ArrowRight, Download, Loader2, X, Scissors, Combine } from 'lucide-react';
import { loadFFmpeg, convertFile } from '../lib/ffmpeg';
import type { FFmpeg } from '@ffmpeg/ffmpeg';

export function AudioTools({ theme = 'dark' }: { theme?: 'dark' | 'light' }) {
  const [mode, setMode] = useState<'trim' | 'merge'>('trim');
  const [files, setFiles] = useState<File[]>([]);
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
    const selectedFiles = Array.from(e.target.files || []) as File[];
    const audioFiles = selectedFiles.filter(f => f.type.startsWith('audio/'));
    
    if (audioFiles.length > 0) {
      if (mode === 'trim') {
        setFiles([audioFiles[0]]);
      } else {
        setFiles(prev => [...prev, ...audioFiles]);
      }
      setResultBlob(null);
      setError(null);
      setProgress(0);
    } else if (selectedFiles.length > 0) {
      setError('Please select valid audio files.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files || []) as File[];
    const audioFiles = droppedFiles.filter(f => f.type.startsWith('audio/'));
    
    if (audioFiles.length > 0) {
      if (mode === 'trim') {
        setFiles([audioFiles[0]]);
      } else {
        setFiles(prev => [...prev, ...audioFiles]);
      }
      setResultBlob(null);
      setError(null);
      setProgress(0);
    } else if (droppedFiles.length > 0) {
      setError('Please drop valid audio files.');
    }
  };

  const handleProcess = async () => {
    if (files.length === 0) return;
    if (mode === 'merge' && files.length < 2) {
      setError('Please select at least 2 audio files to merge.');
      return;
    }

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

      if (mode === 'trim') {
        const file = files[0];
        const outputFormat = file.name.split('.').pop() || 'mp3';
        const options = { trimStart, trimEnd };

        const { url } = await convertFile(currentFfmpeg, file, outputFormat, (p) => {
          setProgress(p * 100);
        }, options);
        
        const res = await fetch(url);
        const blob = await res.blob();
        
        setResultBlob(blob);
        const originalName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        setResultName(`${originalName}_trimmed.${outputFormat}`);
      } else if (mode === 'merge') {
        // Merge audio files
        // Write all files to ffmpeg
        for (let i = 0; i < files.length; i++) {
          const fileData = await files[i].arrayBuffer();
          await currentFfmpeg.writeFile(`input${i}.mp3`, new Uint8Array(fileData));
        }

        // Create a text file with the list of files to concatenate
        const fileList = files.map((_, i) => `file 'input${i}.mp3'`).join('\n');
        await currentFfmpeg.writeFile('list.txt', fileList);

        // Run concatenation
        await currentFfmpeg.exec([
          '-f', 'concat',
          '-safe', '0',
          '-i', 'list.txt',
          '-c', 'copy',
          'output.mp3'
        ]);

        const data = await currentFfmpeg.readFile('output.mp3');
        const blob = new Blob([data], { type: 'audio/mp3' });
        setResultBlob(blob);
        setResultName('Merged_Audio.mp3');
      }
    } catch (err: any) {
      setError(err.message || `Failed to ${mode} audio.`);
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
    setFiles([]);
    setResultBlob(null);
    setError(null);
    setProgress(0);
    setTrimStart('00:00:00');
    setTrimEnd('00:00:10');
  };

  return (
    <div className={`w-full rounded-2xl ${theme === 'dark' ? 'bg-[#161616] text-white' : 'bg-white text-black'}`}>
      <div className={`p-6 border-b rounded-t-2xl ${theme === 'dark' ? 'border-[#2a2a2a] bg-[#111]' : 'border-[#ddd] bg-[#f5f5f5]'}`}>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Music className={`w-5 h-5 ${theme === 'dark' ? 'text-[#00ff9d]' : 'text-[#006633]'}`} />
          Audio Tools
        </h2>
        <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-[#aaa]' : 'text-[#666]'}`}>Trim and merge audio files locally</p>
      </div>

      <div className="p-6">
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => { setMode('trim'); reset(); }}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${mode === 'trim' ? (theme === 'dark' ? 'bg-[#333] text-[#00ff9d] border border-[#00ff9d]/30' : 'bg-[#e0e0e0] text-[#006633] border border-[#006633]/30') : (theme === 'dark' ? 'bg-[#111] text-[#888] border border-[#333] hover:bg-[#222]' : 'bg-[#f5f5f5] text-[#666] border border-[#ddd] hover:bg-[#eaeaea]')}`}
          >
            <Scissors className="w-4 h-4" /> Trim Audio
          </button>
          <button
            onClick={() => { setMode('merge'); reset(); }}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${mode === 'merge' ? (theme === 'dark' ? 'bg-[#333] text-[#00ff9d] border border-[#00ff9d]/30' : 'bg-[#e0e0e0] text-[#006633] border border-[#006633]/30') : (theme === 'dark' ? 'bg-[#111] text-[#888] border border-[#333] hover:bg-[#222]' : 'bg-[#f5f5f5] text-[#666] border border-[#ddd] hover:bg-[#eaeaea]')}`}
          >
            <Combine className="w-4 h-4" /> Merge Audio
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
            <p className="font-medium mb-1">Click or drag audio file{mode === 'merge' ? 's' : ''} here</p>
            <p className={`text-sm ${theme === 'dark' ? 'text-[#888]' : 'text-[#666]'}`}>Supports MP3, WAV, OGG, AAC</p>
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="audio/*"
              multiple={mode === 'merge'}
            />
          </div>
        ) : (
          <div className="space-y-6">
            <div className={`flex items-center justify-between p-4 rounded-lg border ${theme === 'dark' ? 'bg-[#111] border-[#333]' : 'bg-[#f5f5f5] border-[#ddd]'}`}>
              <div className="flex items-center gap-3 overflow-hidden">
                <div className={`w-10 h-10 rounded flex items-center justify-center shrink-0 ${theme === 'dark' ? 'bg-[#222] text-[#00ff9d]' : 'bg-[#e0e0e0] text-[#006633]'}`}>
                  <Music className="w-5 h-5" />
                </div>
                <div className="truncate">
                  <p className="text-sm font-medium truncate">{files.length === 1 ? files[0].name : `${files.length} files selected`}</p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-[#888]' : 'text-[#666]'}`}>
                    {files.length === 1 ? `${(files[0].size / 1024 / 1024).toFixed(2)} MB` : 'Ready to merge'}
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

            {!resultBlob && (
              <div className="space-y-4">
                {mode === 'trim' && (
                  <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-[#111] border-[#333]' : 'bg-[#f5f5f5] border-[#ddd]'}`}>
                    <h4 className={`text-sm font-medium mb-3 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Trim Settings</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-xs mb-1 ${theme === 'dark' ? 'text-[#888]' : 'text-[#666]'}`}>Start Time (HH:MM:SS)</label>
                        <input 
                          type="text" 
                          value={trimStart}
                          onChange={(e) => setTrimStart(e.target.value)}
                          className={`w-full p-2 text-sm rounded border ${theme === 'dark' ? 'bg-[#222] border-[#444] text-white' : 'bg-white border-[#ccc] text-black'}`}
                        />
                      </div>
                      <div>
                        <label className={`block text-xs mb-1 ${theme === 'dark' ? 'text-[#888]' : 'text-[#666]'}`}>End Time (HH:MM:SS)</label>
                        <input 
                          type="text" 
                          value={trimEnd}
                          onChange={(e) => setTrimEnd(e.target.value)}
                          className={`w-full p-2 text-sm rounded border ${theme === 'dark' ? 'bg-[#222] border-[#444] text-white' : 'bg-white border-[#ccc] text-black'}`}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleProcess}
                  disabled={isProcessing}
                  className={`w-full flex items-center justify-center gap-2 font-medium py-3 px-5 rounded-lg transition-colors ${isProcessing ? (theme === 'dark' ? 'bg-[#333] text-[#666]' : 'bg-[#ddd] text-[#999]') : (theme === 'dark' ? 'bg-[#00ff9d] text-black hover:bg-[#00cc7e]' : 'bg-black text-white hover:bg-gray-800')}`}
                >
                  {isProcessing ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> {progress === -1 ? 'Downloading Engine...' : `Processing... ${progress > 0 ? `${progress.toFixed(0)}%` : ''}`}</>
                  ) : (
                    <>{mode === 'trim' ? 'Trim Audio' : 'Merge Audio'} <ArrowRight className="w-5 h-5" /></>
                  )}
                </button>
              </div>
            )}

            {resultBlob && (
              <div className={`border rounded-lg p-6 text-center ${theme === 'dark' ? 'bg-[#111] border-[#00ff9d]/30' : 'bg-[#f5f5f5] border-[#006633]/30'}`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${theme === 'dark' ? 'bg-[#222] text-[#00ff9d]' : 'bg-[#e0e0e0] text-[#006633]'}`}>
                  <Music className="w-8 h-8" />
                </div>
                <h3 className={`text-lg font-medium mb-2 ${theme === 'dark' ? 'text-[#00ff9d]' : 'text-[#006633]'}`}>Processing Complete!</h3>
                <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-[#aaa]' : 'text-[#666]'}`}>
                  Your audio file is ready to download.
                </p>
                <button
                  onClick={handleDownload}
                  className={`inline-flex items-center gap-2 font-medium py-3 px-8 rounded-lg transition-colors ${theme === 'dark' ? 'bg-[#00ff9d] text-black hover:bg-[#00cc7e]' : 'bg-black text-white hover:bg-gray-800'}`}
                >
                  <Download className="w-5 h-5" />
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
