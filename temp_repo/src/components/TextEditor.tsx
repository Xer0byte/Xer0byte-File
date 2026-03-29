import React, { useState, useRef, useEffect } from 'react';
import { FileText, Upload, Download, Loader2, X, Save } from 'lucide-react';
import Editor from '@monaco-editor/react';

export function TextEditor({ theme = 'dark' }: { theme?: 'dark' | 'light' }) {
  const [file, setFile] = useState<File | null>(null);
  const [content, setContent] = useState<string>('');
  const [language, setLanguage] = useState<string>('plaintext');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const detectLanguage = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js': return 'javascript';
      case 'ts': return 'typescript';
      case 'jsx': return 'javascript';
      case 'tsx': return 'typescript';
      case 'json': return 'json';
      case 'html': return 'html';
      case 'css': return 'css';
      case 'md': return 'markdown';
      case 'py': return 'python';
      case 'java': return 'java';
      case 'c': return 'c';
      case 'cpp': return 'cpp';
      case 'cs': return 'csharp';
      case 'go': return 'go';
      case 'rs': return 'rust';
      case 'php': return 'php';
      case 'rb': return 'ruby';
      case 'sql': return 'sql';
      case 'xml': return 'xml';
      case 'yaml':
      case 'yml': return 'yaml';
      case 'sh': return 'shell';
      default: return 'plaintext';
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      await loadFile(selectedFile);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      await loadFile(droppedFile);
    }
  };

  const loadFile = async (selectedFile: File) => {
    setIsProcessing(true);
    setError(null);
    try {
      const text = await selectedFile.text();
      setFile(selectedFile);
      setContent(text);
      setLanguage(detectLanguage(selectedFile.name));
    } catch (err: any) {
      setError('Failed to read file. Make sure it is a valid text file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!file) return;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setFile(null);
    setContent('');
    setError(null);
    setLanguage('plaintext');
  };

  return (
    <div className={`w-full rounded-2xl ${theme === 'dark' ? 'bg-[#161616] text-white' : 'bg-white text-black'}`}>
      <div className={`p-6 border-b rounded-t-2xl flex justify-between items-center ${theme === 'dark' ? 'border-[#2a2a2a] bg-[#111]' : 'border-[#ddd] bg-[#f5f5f5]'}`}>
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileText className={`w-5 h-5 ${theme === 'dark' ? 'text-[#00ff9d]' : 'text-[#006633]'}`} />
            Text & Code Editor
          </h2>
          <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-[#aaa]' : 'text-[#666]'}`}>Edit any text or code file directly in your browser</p>
        </div>
        {file && (
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${theme === 'dark' ? 'bg-[#00ff9d] text-black hover:bg-[#00cc7e]' : 'bg-black text-white hover:bg-gray-800'}`}
            >
              <Save className="w-4 h-4" /> Save
            </button>
            <button
              onClick={reset}
              className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'bg-[#333] text-[#aaa] hover:text-white hover:bg-[#444]' : 'bg-[#e0e0e0] text-[#555] hover:text-black hover:bg-[#ccc]'}`}
              title="Close file"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
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
            <p className="font-medium mb-1">Click or drag a text/code file here</p>
            <p className={`text-sm ${theme === 'dark' ? 'text-[#888]' : 'text-[#666]'}`}>Supports TXT, MD, JS, HTML, CSS, JSON, and more</p>
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".txt,.md,.js,.ts,.jsx,.tsx,.json,.html,.css,.py,.java,.c,.cpp,.cs,.go,.rs,.php,.rb,.sql,.xml,.yaml,.yml,.sh,.csv"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className={`flex items-center justify-between p-3 rounded-lg border ${theme === 'dark' ? 'bg-[#111] border-[#333]' : 'bg-[#f5f5f5] border-[#ddd]'}`}>
              <div className="flex items-center gap-3 overflow-hidden">
                <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 font-medium text-xs ${theme === 'dark' ? 'bg-[#222] text-[#00ff9d]' : 'bg-[#e0e0e0] text-[#006633]'}`}>
                  {file.name.split('.').pop()?.toUpperCase() || 'TXT'}
                </div>
                <div className="truncate">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-[#888]' : 'text-[#666]'}`}>
                    {(file.size / 1024).toFixed(2)} KB • {language}
                  </p>
                </div>
              </div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className={`text-xs p-1.5 rounded border outline-none ${theme === 'dark' ? 'bg-[#222] border-[#444] text-white' : 'bg-white border-[#ccc] text-black'}`}
              >
                <option value="plaintext">Plain Text</option>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="json">JSON</option>
                <option value="markdown">Markdown</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="csharp">C#</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
                <option value="php">PHP</option>
                <option value="sql">SQL</option>
                <option value="xml">XML</option>
                <option value="yaml">YAML</option>
                <option value="shell">Shell</option>
              </select>
            </div>

            {error && (
              <div className={`p-3 text-sm rounded-lg border ${theme === 'dark' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-red-50 text-red-600 border-red-100'}`}>
                {error}
              </div>
            )}

            <div className={`h-[500px] w-full rounded-lg overflow-hidden border ${theme === 'dark' ? 'border-[#333]' : 'border-[#ddd]'}`}>
              <Editor
                height="100%"
                language={language}
                theme={theme === 'dark' ? 'vs-dark' : 'light'}
                value={content}
                onChange={(value) => setContent(value || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: 'on',
                  scrollBeyondLastLine: false,
                  smoothScrolling: true,
                  padding: { top: 16, bottom: 16 },
                }}
                loading={
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 animate-spin text-[#00ff9d]" />
                  </div>
                }
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
