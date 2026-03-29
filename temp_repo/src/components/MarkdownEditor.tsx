import React, { useState } from 'react';
import { motion } from 'motion/react';
import { FileEdit, Download, Copy, Check, Eye } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownEditorProps {
  theme: 'dark' | 'light';
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ theme }) => {
  const [markdown, setMarkdown] = useState<string>('# Hello Markdown\n\nWrite your **markdown** here and see the live preview on the right.\n\n## Features\n- Live preview\n- GitHub Flavored Markdown\n- Tables\n- Code blocks\n\n```javascript\nconsole.log("Hello World");\n```\n\n| Syntax | Description |\n| ----------- | ----------- |\n| Header | Title |\n| Paragraph | Text |');
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split');

  const handleCopy = () => {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const btnClass = `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
    theme === 'dark' 
      ? 'bg-[#333] text-white hover:bg-[#444]' 
      : 'bg-[#e0e0e0] text-black hover:bg-[#d0d0d0]'
  }`;

  const activeBtnClass = `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
    theme === 'dark' 
      ? 'bg-[#00ff9d]/20 text-[#00ff9d] border border-[#00ff9d]/30' 
      : 'bg-[#006633]/10 text-[#006633] border border-[#006633]/30'
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
            <FileEdit className={theme === 'dark' ? 'text-[#00ff9d]' : 'text-[#006633]'} size={20} />
            <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Markdown Editor</h2>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg overflow-hidden border border-[#333] mr-2">
              <button 
                onClick={() => setViewMode('edit')}
                className={`px-3 py-1.5 text-xs font-medium ${viewMode === 'edit' ? (theme === 'dark' ? 'bg-[#333] text-white' : 'bg-[#e0e0e0] text-black') : (theme === 'dark' ? 'bg-transparent text-[#888] hover:text-white' : 'bg-transparent text-[#666] hover:text-black')}`}
              >
                Edit
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
                Preview
              </button>
            </div>
            <button onClick={handleCopy} className={btnClass} title="Copy Markdown">
              {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
            </button>
            <button onClick={handleDownload} className={btnClass} title="Download .md">
              <Download size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Editor Pane */}
          {(viewMode === 'split' || viewMode === 'edit') && (
            <div className={`flex-1 flex flex-col ${viewMode === 'split' ? 'border-r' : ''} ${theme === 'dark' ? 'border-[#333]' : 'border-[#eee]'}`}>
              <textarea
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                className={`flex-1 w-full p-4 resize-none font-mono text-sm focus:outline-none ${
                  theme === 'dark' 
                    ? 'bg-[#161616] text-[#ccc] placeholder-[#555]' 
                    : 'bg-white text-[#333] placeholder-[#999]'
                }`}
                placeholder="Type your markdown here..."
                spellCheck={false}
              />
            </div>
          )}

          {/* Preview Pane */}
          {(viewMode === 'split' || viewMode === 'preview') && (
            <div className={`flex-1 overflow-y-auto p-6 ${theme === 'dark' ? 'bg-[#111]' : 'bg-[#fafafa]'}`}>
              <div className={`prose max-w-none ${theme === 'dark' ? 'prose-invert prose-pre:bg-[#222] prose-a:text-[#00ff9d]' : 'prose-pre:bg-[#f5f5f5] prose-a:text-[#006633]'}`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {markdown || '*Nothing to preview*'}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
