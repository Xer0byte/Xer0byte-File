import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Palette, Copy, Check, Droplet, Type } from 'lucide-react';

interface ColorToolsProps {
  theme: 'dark' | 'light';
}

export const ColorTools: React.FC<ColorToolsProps> = ({ theme }) => {
  const [activeTool, setActiveTool] = useState<'picker' | 'contrast'>('picker');
  
  // Color Picker State
  const [color, setColor] = useState('#00ff9d');
  const [rgb, setRgb] = useState('');
  const [hsl, setHsl] = useState('');

  // Contrast Checker State
  const [fgColor, setFgColor] = useState('#ffffff');
  const [bgColor, setBgColor] = useState('#000000');
  const [contrastRatio, setContrastRatio] = useState(21);

  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper functions for color conversion
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  };

  const getLuminance = (r: number, g: number, b: number) => {
    const a = [r, g, b].map(function (v) {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  };

  const calculateContrast = (hex1: string, hex2: string) => {
    const rgb1 = hexToRgb(hex1);
    const rgb2 = hexToRgb(hex2);
    if (!rgb1 || !rgb2) return 1;

    const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
    
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  };

  useEffect(() => {
    const rgbVal = hexToRgb(color);
    if (rgbVal) {
      setRgb(`rgb(${rgbVal.r}, ${rgbVal.g}, ${rgbVal.b})`);
      const hslVal = rgbToHsl(rgbVal.r, rgbVal.g, rgbVal.b);
      setHsl(`hsl(${hslVal.h}, ${hslVal.s}%, ${hslVal.l}%)`);
    }
  }, [color]);

  useEffect(() => {
    setContrastRatio(calculateContrast(fgColor, bgColor));
  }, [fgColor, bgColor]);

  const inputClass = `w-full p-3 rounded-lg border font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#00ff9d]/50 transition-colors ${
    theme === 'dark' 
      ? 'bg-[#222] border-[#444] text-white placeholder-[#666]' 
      : 'bg-[#f5f5f5] border-[#ccc] text-black placeholder-[#999]'
  }`;

  const btnClass = `px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
    theme === 'dark' 
      ? 'bg-[#333] text-white hover:bg-[#444]' 
      : 'bg-[#e0e0e0] text-black hover:bg-[#d0d0d0]'
  }`;

  return (
    <div className="p-4 sm:p-6 w-full max-w-4xl mx-auto">
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { id: 'picker', icon: Palette, label: 'Color Picker & Converter' },
          { id: 'contrast', icon: Type, label: 'Contrast Checker' },
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
        {/* Color Picker */}
        {activeTool === 'picker' && (
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex flex-col items-center gap-4 w-full md:w-1/3">
              <div 
                className="w-full aspect-square rounded-2xl shadow-inner border border-black/10"
                style={{ backgroundColor: color }}
              ></div>
              <input 
                type="color" 
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full h-12 rounded cursor-pointer"
              />
            </div>
            <div className="flex flex-col gap-4 w-full md:w-2/3">
              {[
                { label: 'HEX', value: color.toUpperCase() },
                { label: 'RGB', value: rgb },
                { label: 'HSL', value: hsl },
              ].map(format => (
                <div key={format.label} className="flex flex-col gap-1">
                  <label className={`text-sm font-medium ${theme === 'dark' ? 'text-[#aaa]' : 'text-[#666]'}`}>{format.label}</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={format.value} 
                      readOnly 
                      className={inputClass} 
                    />
                    <button onClick={() => handleCopy(format.value)} className={btnClass}>
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contrast Checker */}
        {activeTool === 'contrast' && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className={`text-sm font-medium ${theme === 'dark' ? 'text-[#aaa]' : 'text-[#666]'}`}>Text Color (Foreground)</label>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-12 h-12 rounded cursor-pointer shrink-0"
                  />
                  <input 
                    type="text" 
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className={inputClass}
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
                    className="w-12 h-12 rounded cursor-pointer shrink-0"
                  />
                  <input 
                    type="text" 
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div 
              className="w-full p-8 rounded-xl border flex flex-col items-center justify-center text-center transition-colors"
              style={{ backgroundColor: bgColor, color: fgColor, borderColor: theme === 'dark' ? '#333' : '#eee' }}
            >
              <h3 className="text-3xl font-bold mb-2">Contrast Ratio: {contrastRatio.toFixed(2)}:1</h3>
              <p className="text-lg opacity-80">This is how your text will look on this background.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'WCAG AA (Normal Text)', target: 4.5 },
                { label: 'WCAG AA (Large Text)', target: 3.0 },
                { label: 'WCAG AAA (Normal Text)', target: 7.0 },
              ].map(level => {
                const pass = contrastRatio >= level.target;
                return (
                  <div key={level.label} className={`p-4 rounded-lg border flex flex-col items-center text-center ${theme === 'dark' ? 'bg-[#1a1a1a] border-[#333]' : 'bg-[#fafafa] border-[#ddd]'}`}>
                    <span className={`text-sm font-medium mb-2 ${theme === 'dark' ? 'text-[#aaa]' : 'text-[#666]'}`}>{level.label}</span>
                    <div className={`px-3 py-1 rounded-full text-sm font-bold ${pass ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                      {pass ? 'PASS' : 'FAIL'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
