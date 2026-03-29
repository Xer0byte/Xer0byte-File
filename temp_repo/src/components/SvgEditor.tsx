import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Image as ImageIcon, Upload, Download, Code, Eye } from 'lucide-react';

interface SvgEditorProps {
  theme: 'dark' | 'light';
}

export const SvgEditor: React.FC<SvgEditorProps> = ({ theme }) => {
  const [svgCode, setSvgCode] = useState<string>('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="200" height="200">\n  <circle cx="50" cy="50" r="40" stroke="green" stroke-width="4" fill="yellow" />\n</svg>');
  const [viewMode, setViewMode] = useState<'split' | 'code' | 'preview'>('split');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setSvgCode(result);
    };
    reader.readAsText(file);
  };

  const handleDownload = () => {
    const blob = new Blob([svgCode], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'image.svg');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const btnClass = `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
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
            <ImageIcon className={theme === 'dark' ? 'text-[#00ff9d]' : 'text-[#006633]'} size={20} />
            <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>SVG Editor</h2>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg overflow-hidden border border-[#333] mr-2">
              <button 
                onClick={() => setViewMode('code')}
                className={`px-3 py-1.5 text-xs font-medium ${viewMode === 'code' ? (theme === 'dark' ? 'bg-[#333] text-white' : 'bg-[#e0e0e0] text-black') : (theme === 'dark' ? 'bg-transparent text-[#888] hover:text-white' : 'bg-transparent text-[#666] hover:text-black')}`}
              >
                <Code size={14} className="inline mr-1" /> Code
              </button>
              <button 
                onClick={() => setViewMode('split')}
                className={`px-3 py-1.5 text-xs font-medium border-l border-r ${theme === 'dark' ? 'border-[#333]' : 'border-[#ccc]'} ${viewMode === 'split' ? (theme === 'dark' ? 'bg-[#333] text-white' : 'bg-[#e0e0e0] text-black') : (theme === 'dark' ? 'bg-transparent text-[#888] hover:text-white' : 'bg-transparent text-[#666] hover:text-black')}`}
              >
                Split
              </button>
              <button 
                onClick={() => setViewMode('preview')}
                className={`px-3 py-1.5 text-xs font-medium ${viewMode === 'preview' ? (theme === 'dark' ? 'bg-[#333] text-white' : 'bg-[#e0e0e0] text-black') : (theme === 'dark' ? 'bg-transparent text-[#888] hover:text-white' : 'bg-transparent text-[#666] hover:text-black')}`}
              >
                <Eye size={14} className="inline mr-1" /> Preview
              </button>
            </div>

            <input 
              type="file" 
              accept=".svg" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <button onClick={() => fileInputRef.current?.click()} className={btnClass}>
              <Upload size={16} /> Open SVG
            </button>
            <button onClick={handleDownload} className={btnClass} title="Download SVG">
              <Download size={16} /> Save
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Editor Pane */}
          {(viewMode === 'split' || viewMode === 'code') && (
            <div className={`flex-1 flex flex-col ${viewMode === 'split' ? 'border-r' : ''} ${theme === 'dark' ? 'border-[#333]' : 'border-[#eee]'}`}>
              <textarea
                value={svgCode}
                onChange={(e) => setSvgCode(e.target.value)}
                className={`flex-1 w-full p-4 resize-none font-mono text-sm focus:outline-none ${
                  theme === 'dark' 
                    ? 'bg-[#161616] text-[#00ff9d] placeholder-[#555]' 
                    : 'bg-[#f5f5f5] text-[#006633] placeholder-[#999]'
                }`}
                placeholder="Paste or write SVG code here..."
                spellCheck={false}
              />
            </div>
          )}

          {/* Preview Pane */}
          {(viewMode === 'split' || viewMode === 'preview') && (
            <div className={`flex-1 flex items-center justify-center p-6 overflow-auto ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-[#e5e5e5]'}`}>
              <div 
                className={`p-8 rounded-xl shadow-lg flex items-center justify-center ${theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-white'}`}
                dangerouslySetInnerHTML={{ __html: svgCode }}
              />
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
