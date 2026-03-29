import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Code, Hash, Key, Link as LinkIcon, FileJson, Copy, Check } from 'lucide-react';

interface DeveloperToolsProps {
  theme: 'dark' | 'light';
}

export const DeveloperTools: React.FC<DeveloperToolsProps> = ({ theme }) => {
  const [activeTool, setActiveTool] = useState<'json' | 'base64' | 'hash' | 'url' | 'jwt'>('json');
  
  // JSON Formatter State
  const [jsonInput, setJsonInput] = useState('');
  const [jsonOutput, setJsonOutput] = useState('');
  const [jsonError, setJsonError] = useState('');

  // Base64 State
  const [base64Input, setBase64Input] = useState('');
  const [base64Output, setBase64Output] = useState('');
  const [base64Mode, setBase64Mode] = useState<'encode' | 'decode'>('encode');

  // URL State
  const [urlInput, setUrlInput] = useState('');
  const [urlOutput, setUrlOutput] = useState('');
  const [urlMode, setUrlMode] = useState<'encode' | 'decode'>('encode');

  // Hash State
  const [hashInput, setHashInput] = useState('');
  const [hashes, setHashes] = useState({ md5: '', sha1: '', sha256: '', sha512: '' });

  // JWT State
  const [jwtInput, setJwtInput] = useState('');
  const [jwtHeader, setJwtHeader] = useState('');
  const [jwtPayload, setJwtPayload] = useState('');
  const [jwtError, setJwtError] = useState('');

  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // JSON Handlers
  const formatJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonOutput(JSON.stringify(parsed, null, 2));
      setJsonError('');
    } catch (err: any) {
      setJsonError(err.message || 'Invalid JSON');
      setJsonOutput('');
    }
  };

  const minifyJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonOutput(JSON.stringify(parsed));
      setJsonError('');
    } catch (err: any) {
      setJsonError(err.message || 'Invalid JSON');
      setJsonOutput('');
    }
  };

  // Base64 Handlers
  const handleBase64 = (input: string, mode: 'encode' | 'decode') => {
    setBase64Input(input);
    try {
      if (mode === 'encode') {
        setBase64Output(btoa(unescape(encodeURIComponent(input))));
      } else {
        setBase64Output(decodeURIComponent(escape(atob(input))));
      }
    } catch (err) {
      setBase64Output('Invalid input for decoding');
    }
  };

  // URL Handlers
  const handleUrl = (input: string, mode: 'encode' | 'decode') => {
    setUrlInput(input);
    try {
      if (mode === 'encode') {
        setUrlOutput(encodeURIComponent(input));
      } else {
        setUrlOutput(decodeURIComponent(input));
      }
    } catch (err) {
      setUrlOutput('Invalid input for decoding');
    }
  };

  // Hash Handlers
  const generateHashes = async (input: string) => {
    setHashInput(input);
    if (!input) {
      setHashes({ md5: '', sha1: '', sha256: '', sha512: '' });
      return;
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(input);

    const hashBufferSha1 = await crypto.subtle.digest('SHA-1', data);
    const hashBufferSha256 = await crypto.subtle.digest('SHA-256', data);
    const hashBufferSha512 = await crypto.subtle.digest('SHA-512', data);

    const buf2hex = (buffer: ArrayBuffer) => {
      return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    };

    // Note: Web Crypto API doesn't support MD5 natively in all browsers due to security, 
    // but we'll provide SHA-1, SHA-256, SHA-512 which are standard.
    setHashes({
      md5: 'Not supported by native Web Crypto API',
      sha1: buf2hex(hashBufferSha1),
      sha256: buf2hex(hashBufferSha256),
      sha512: buf2hex(hashBufferSha512)
    });
  };

  // JWT Handlers
  const decodeJwt = (token: string) => {
    setJwtInput(token);
    if (!token) {
      setJwtHeader('');
      setJwtPayload('');
      setJwtError('');
      return;
    }

    try {
      const parts = token.split('.');
      if (parts.length !== 3) throw new Error('Invalid JWT format');

      const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));

      setJwtHeader(JSON.stringify(header, null, 2));
      setJwtPayload(JSON.stringify(payload, null, 2));
      setJwtError('');
    } catch (err) {
      setJwtHeader('');
      setJwtPayload('');
      setJwtError('Invalid JWT token');
    }
  };

  const inputClass = `w-full p-3 rounded-lg border font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#00ff9d]/50 transition-colors ${
    theme === 'dark' 
      ? 'bg-[#222] border-[#444] text-white placeholder-[#666]' 
      : 'bg-[#f5f5f5] border-[#ccc] text-black placeholder-[#999]'
  }`;

  const outputClass = `w-full p-3 rounded-lg border font-mono text-sm h-full min-h-[150px] overflow-auto ${
    theme === 'dark' 
      ? 'bg-[#1a1a1a] border-[#333] text-[#00ff9d]' 
      : 'bg-[#fafafa] border-[#ddd] text-[#006633]'
  }`;

  const btnClass = `px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
    theme === 'dark' 
      ? 'bg-[#333] text-white hover:bg-[#444]' 
      : 'bg-[#e0e0e0] text-black hover:bg-[#d0d0d0]'
  }`;

  return (
    <div className="p-4 sm:p-6 w-full max-w-6xl mx-auto">
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { id: 'json', icon: FileJson, label: 'JSON Formatter' },
          { id: 'base64', icon: Code, label: 'Base64' },
          { id: 'url', icon: LinkIcon, label: 'URL Encode' },
          { id: 'hash', icon: Hash, label: 'Hash Generator' },
          { id: 'jwt', icon: Key, label: 'JWT Decoder' },
        ].map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
              activeTool === tool.id
                ? (theme === 'dark' ? 'bg-[#00ff9d]/20 text-[#00ff9d] border border-[#00ff9d]/30' : 'bg-[#006633]/10 text-[#006633] border border-[#006633]/30')
                : (theme === 'dark' ? 'bg-[#222] text-[#888] hover:text-white hover:bg-[#333]' : 'bg-[#f5f5f5] text-[#666] hover:text-black hover:bg-[#e0e0e0]')
            }`}
          >
            <tool.icon size={16} />
            {tool.label}
          </button>
        ))}
      </div>

      <motion.div
        key={activeTool}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`p-4 sm:p-6 rounded-xl border ${theme === 'dark' ? 'bg-[#111] border-[#333]' : 'bg-white border-[#eee]'}`}
      >
        {/* JSON Formatter */}
        {activeTool === 'json' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className={`text-sm font-medium ${theme === 'dark' ? 'text-[#aaa]' : 'text-[#666]'}`}>Input JSON</label>
                <div className="flex gap-2">
                  <button onClick={formatJson} className={btnClass}>Format</button>
                  <button onClick={minifyJson} className={btnClass}>Minify</button>
                </div>
              </div>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className={`${inputClass} h-[300px] resize-none`}
                placeholder="Paste JSON here..."
              />
              {jsonError && <p className="text-red-500 text-sm mt-1">{jsonError}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className={`text-sm font-medium ${theme === 'dark' ? 'text-[#aaa]' : 'text-[#666]'}`}>Output</label>
                <button onClick={() => handleCopy(jsonOutput)} className={btnClass}>
                  {copied ? <Check size={16} /> : <Copy size={16} />} Copy
                </button>
              </div>
              <div className={`${outputClass} h-[300px] whitespace-pre-wrap`}>
                {jsonOutput || 'Output will appear here...'}
              </div>
            </div>
          </div>
        )}

        {/* Base64 */}
        {activeTool === 'base64' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setBase64Mode('encode'); handleBase64(base64Input, 'encode'); }}
                    className={`px-3 py-1 rounded text-sm ${base64Mode === 'encode' ? (theme === 'dark' ? 'bg-[#00ff9d] text-black' : 'bg-[#006633] text-white') : (theme === 'dark' ? 'bg-[#333] text-white' : 'bg-[#e0e0e0] text-black')}`}
                  >Encode</button>
                  <button 
                    onClick={() => { setBase64Mode('decode'); handleBase64(base64Input, 'decode'); }}
                    className={`px-3 py-1 rounded text-sm ${base64Mode === 'decode' ? (theme === 'dark' ? 'bg-[#00ff9d] text-black' : 'bg-[#006633] text-white') : (theme === 'dark' ? 'bg-[#333] text-white' : 'bg-[#e0e0e0] text-black')}`}
                  >Decode</button>
                </div>
              </div>
              <textarea
                value={base64Input}
                onChange={(e) => handleBase64(e.target.value, base64Mode)}
                className={`${inputClass} h-[200px] resize-none`}
                placeholder={`Enter text to ${base64Mode}...`}
              />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className={`text-sm font-medium ${theme === 'dark' ? 'text-[#aaa]' : 'text-[#666]'}`}>Result</label>
                <button onClick={() => handleCopy(base64Output)} className={btnClass}>
                  {copied ? <Check size={16} /> : <Copy size={16} />} Copy
                </button>
              </div>
              <div className={`${outputClass} h-[200px] break-all`}>
                {base64Output || 'Result will appear here...'}
              </div>
            </div>
          </div>
        )}

        {/* URL Encode/Decode */}
        {activeTool === 'url' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setUrlMode('encode'); handleUrl(urlInput, 'encode'); }}
                    className={`px-3 py-1 rounded text-sm ${urlMode === 'encode' ? (theme === 'dark' ? 'bg-[#00ff9d] text-black' : 'bg-[#006633] text-white') : (theme === 'dark' ? 'bg-[#333] text-white' : 'bg-[#e0e0e0] text-black')}`}
                  >Encode</button>
                  <button 
                    onClick={() => { setUrlMode('decode'); handleUrl(urlInput, 'decode'); }}
                    className={`px-3 py-1 rounded text-sm ${urlMode === 'decode' ? (theme === 'dark' ? 'bg-[#00ff9d] text-black' : 'bg-[#006633] text-white') : (theme === 'dark' ? 'bg-[#333] text-white' : 'bg-[#e0e0e0] text-black')}`}
                  >Decode</button>
                </div>
              </div>
              <textarea
                value={urlInput}
                onChange={(e) => handleUrl(e.target.value, urlMode)}
                className={`${inputClass} h-[200px] resize-none`}
                placeholder={`Enter URL to ${urlMode}...`}
              />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className={`text-sm font-medium ${theme === 'dark' ? 'text-[#aaa]' : 'text-[#666]'}`}>Result</label>
                <button onClick={() => handleCopy(urlOutput)} className={btnClass}>
                  {copied ? <Check size={16} /> : <Copy size={16} />} Copy
                </button>
              </div>
              <div className={`${outputClass} h-[200px] break-all`}>
                {urlOutput || 'Result will appear here...'}
              </div>
            </div>
          </div>
        )}

        {/* Hash Generator */}
        {activeTool === 'hash' && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className={`text-sm font-medium ${theme === 'dark' ? 'text-[#aaa]' : 'text-[#666]'}`}>Input Text</label>
              <textarea
                value={hashInput}
                onChange={(e) => generateHashes(e.target.value)}
                className={`${inputClass} h-[100px] resize-none`}
                placeholder="Enter text to hash..."
              />
            </div>
            <div className="grid grid-cols-1 gap-4">
              {['SHA-1', 'SHA-256', 'SHA-512'].map((algo) => {
                const key = algo.toLowerCase().replace('-', '') as keyof typeof hashes;
                return (
                  <div key={algo} className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <label className={`text-xs font-bold ${theme === 'dark' ? 'text-[#888]' : 'text-[#999]'}`}>{algo}</label>
                      <button onClick={() => handleCopy(hashes[key])} className="text-xs text-[#00ff9d] hover:underline">Copy</button>
                    </div>
                    <div className={`w-full p-2 rounded border font-mono text-xs break-all ${theme === 'dark' ? 'bg-[#1a1a1a] border-[#333] text-[#ccc]' : 'bg-[#fafafa] border-[#ddd] text-[#555]'}`}>
                      {hashes[key] || '-'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* JWT Decoder */}
        {activeTool === 'jwt' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className={`text-sm font-medium ${theme === 'dark' ? 'text-[#aaa]' : 'text-[#666]'}`}>JWT Token</label>
              <textarea
                value={jwtInput}
                onChange={(e) => decodeJwt(e.target.value)}
                className={`${inputClass} h-[300px] resize-none`}
                placeholder="Paste JWT token here (ey...)"
              />
              {jwtError && <p className="text-red-500 text-sm mt-1">{jwtError}</p>}
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className={`text-sm font-medium ${theme === 'dark' ? 'text-[#aaa]' : 'text-[#666]'}`}>Header</label>
                <div className={`${outputClass} h-[100px] whitespace-pre-wrap`}>
                  {jwtHeader || 'Header will appear here...'}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className={`text-sm font-medium ${theme === 'dark' ? 'text-[#aaa]' : 'text-[#666]'}`}>Payload</label>
                <div className={`${outputClass} h-[180px] whitespace-pre-wrap`}>
                  {jwtPayload || 'Payload will appear here...'}
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
