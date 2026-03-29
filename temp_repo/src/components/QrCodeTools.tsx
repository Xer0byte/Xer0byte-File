import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { QrCode, Download, Link as LinkIcon } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface QrCodeToolsProps {
  theme: 'dark' | 'light';
}

export const QrCodeTools: React.FC<QrCodeToolsProps> = ({ theme }) => {
  const [text, setText] = useState('https://xer0byte.com');
  const [size, setSize] = useState(256);
  const [fgColor, setFgColor] = useState(theme === 'dark' ? '#00ff9d' : '#006633');
  const [bgColor, setBgColor] = useState(theme === 'dark' ? '#111111' : '#ffffff');
  
  const svgRef = useRef<SVGSVGElement>(null);

  const downloadQR = () => {
    if (!svgRef.current) return;
    
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = size;
      canvas.height = size;
      if (ctx) {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = 'qrcode.png';
        downloadLink.href = `${pngFile}`;
        downloadLink.click();
      }
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const inputClass = `w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#00ff9d]/50 transition-colors ${
    theme === 'dark' 
      ? 'bg-[#222] border-[#444] text-white placeholder-[#666]' 
      : 'bg-[#f5f5f5] border-[#ccc] text-black placeholder-[#999]'
  }`;

  return (
    <div className="p-4 sm:p-6 w-full max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`p-6 rounded-xl border ${theme === 'dark' ? 'bg-[#111] border-[#333]' : 'bg-white border-[#eee]'}`}
      >
        <div className="flex items-center gap-3 mb-6">
          <QrCode className={theme === 'dark' ? 'text-[#00ff9d]' : 'text-[#006633]'} size={24} />
          <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>QR Code Generator</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className={`text-sm font-medium ${theme === 'dark' ? 'text-[#aaa]' : 'text-[#666]'}`}>Content (Text or URL)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LinkIcon size={16} className={theme === 'dark' ? 'text-[#666]' : 'text-[#999]'} />
                </div>
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className={`${inputClass} pl-10`}
                  placeholder="Enter text or URL..."
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className={`text-sm font-medium ${theme === 'dark' ? 'text-[#aaa]' : 'text-[#666]'}`}>Size</label>
                <span className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{size}px</span>
              </div>
              <input 
                type="range" 
                min="128" 
                max="512" 
                step="32"
                value={size} 
                onChange={(e) => setSize(parseInt(e.target.value))}
                className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${theme === 'dark' ? 'bg-[#333]' : 'bg-[#e0e0e0]'}`}
                style={{
                  background: `linear-gradient(to right, ${theme === 'dark' ? '#00ff9d' : '#006633'} ${(size - 128) / 384 * 100}%, ${theme === 'dark' ? '#333' : '#e0e0e0'} ${(size - 128) / 384 * 100}%)`
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className={`text-sm font-medium ${theme === 'dark' ? 'text-[#aaa]' : 'text-[#666]'}`}>Foreground Color</label>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer shrink-0"
                  />
                  <input 
                    type="text" 
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className={`${inputClass} !p-2 !text-xs`}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className={`text-sm font-medium ${theme === 'dark' ? 'text-[#aaa]' : 'text-[#666]'}`}>Background Color</label>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer shrink-0"
                  />
                  <input 
                    type="text" 
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className={`${inputClass} !p-2 !text-xs`}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-6">
            <div 
              className={`p-4 rounded-xl shadow-lg border flex items-center justify-center overflow-hidden ${theme === 'dark' ? 'bg-[#1a1a1a] border-[#333]' : 'bg-[#fafafa] border-[#ddd]'}`}
              style={{ width: '100%', maxWidth: '300px', aspectRatio: '1/1' }}
            >
              <div style={{ transform: `scale(${Math.min(1, 260 / size)})`, transformOrigin: 'center' }}>
                <QRCodeSVG
                  value={text || ' '}
                  size={size}
                  fgColor={fgColor}
                  bgColor={bgColor}
                  level="H"
                  includeMargin={true}
                  ref={svgRef}
                />
              </div>
            </div>
            
            <button 
              onClick={downloadQR}
              disabled={!text}
              className={`w-full max-w-[300px] py-3 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2 ${
                !text 
                  ? (theme === 'dark' ? 'bg-[#333] text-[#666] cursor-not-allowed' : 'bg-[#e0e0e0] text-[#999] cursor-not-allowed')
                  : (theme === 'dark' ? 'bg-[#00ff9d] text-black hover:bg-[#00cc7d]' : 'bg-[#006633] text-white hover:bg-[#004d26]')
              }`}
            >
              <Download size={18} /> Download PNG
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
