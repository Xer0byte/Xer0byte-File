import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { FileCode, Upload, AlertCircle } from 'lucide-react';

interface HexViewerProps {
  theme: 'dark' | 'light';
}

export const HexViewer: React.FC<HexViewerProps> = ({ theme }) => {
  const [file, setFile] = useState<File | null>(null);
  const [hexData, setHexData] = useState<{ offset: string; hex: string; ascii: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
    setIsLoading(true);

    const reader = new FileReader();
    
    // Read only the first 10KB to avoid crashing the browser
    const slice = selectedFile.slice(0, 10240);
    
    reader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const view = new Uint8Array(buffer);
        const lines = [];
        
        for (let i = 0; i < view.length; i += 16) {
          const chunk = view.slice(i, i + 16);
          
          // Offset
          const offset = i.toString(16).padStart(8, '0').toUpperCase();
          
          // Hex
          const hexArr = Array.from(chunk).map(b => b.toString(16).padStart(2, '0').toUpperCase());
          const hex = hexArr.join(' ').padEnd(47, ' ');
          
          // ASCII
          const ascii = Array.from(chunk).map(b => {
            return (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.';
          }).join('');
          
          lines.push({ offset, hex, ascii });
        }
        
        setHexData(lines);
      } catch (err) {
        setError('Failed to read file as binary data.');
      } finally {
        setIsLoading(false);
      }
    };
    
    reader.onerror = () => {
      setError('Error reading file.');
      setIsLoading(false);
    };
    
    reader.readAsArrayBuffer(slice);
  };

  const btnClass = `px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
    theme === 'dark' 
      ? 'bg-[#333] text-white hover:bg-[#444]' 
      : 'bg-[#e0e0e0] text-black hover:bg-[#d0d0d0]'
  }`;

  return (
    <div className="p-4 sm:p-6 w-full max-w-7xl mx-auto h-[80vh] flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`flex-1 flex flex-col rounded-xl border overflow-hidden ${theme === 'dark' ? 'bg-[#111] border-[#333]' : 'bg-white border-[#eee]'}`}
      >
        <div className={`p-4 border-b flex flex-wrap justify-between items-center gap-4 ${theme === 'dark' ? 'border-[#333] bg-[#1a1a1a]' : 'border-[#eee] bg-[#fafafa]'}`}>
          <div className="flex items-center gap-3">
            <FileCode className={theme === 'dark' ? 'text-[#00ff9d]' : 'text-[#006633]'} size={20} />
            <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Universal Hex Viewer</h2>
            {file && <span className={`text-xs px-2 py-1 rounded-full ${theme === 'dark' ? 'bg-[#333] text-[#aaa]' : 'bg-[#e0e0e0] text-[#666]'}`}>{file.name} (Showing first 10KB)</span>}
          </div>
          
          <div className="flex items-center gap-2">
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <button onClick={() => fileInputRef.current?.click()} className={btnClass}>
              <Upload size={16} /> Open Any File
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {error && (
            <div className="p-4 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {!file && !isLoading && !error ? (
            <div className={`h-full flex flex-col items-center justify-center text-center ${theme === 'dark' ? 'text-[#666]' : 'text-[#999]'}`}>
              <FileCode size={48} className="mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Inspect Any File</p>
              <p className="text-sm max-w-md">Upload any file format (exe, dll, bin, docx, etc.) to view its raw binary data in hexadecimal and ASCII format.</p>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className={`mt-6 px-6 py-2 rounded-lg font-medium transition-colors ${theme === 'dark' ? 'bg-[#00ff9d] text-black hover:bg-[#00cc7d]' : 'bg-[#006633] text-white hover:bg-[#004d26]'}`}
              >
                Select File
              </button>
            </div>
          ) : isLoading ? (
            <div className={`h-full flex items-center justify-center ${theme === 'dark' ? 'text-[#aaa]' : 'text-[#666]'}`}>
              Loading binary data...
            </div>
          ) : (
            <div className={`font-mono text-sm whitespace-pre p-4 rounded-lg overflow-x-auto ${theme === 'dark' ? 'bg-[#161616] text-[#ccc]' : 'bg-[#f5f5f5] text-[#333]'}`}>
              <div className={`pb-2 mb-2 border-b flex ${theme === 'dark' ? 'border-[#333] text-[#888]' : 'border-[#ddd] text-[#888]'}`}>
                <div className="w-24">Offset</div>
                <div className="w-[400px]">Hexadecimal</div>
                <div>ASCII</div>
              </div>
              {hexData.map((line, i) => (
                <div key={i} className="flex hover:bg-black/10 dark:hover:bg-white/5">
                  <div className={`w-24 ${theme === 'dark' ? 'text-[#00ff9d]/70' : 'text-[#006633]/70'}`}>{line.offset}</div>
                  <div className="w-[400px] tracking-widest">{line.hex}</div>
                  <div className={`${theme === 'dark' ? 'text-[#aaa]' : 'text-[#666]'}`}>{line.ascii}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
