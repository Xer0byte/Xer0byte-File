import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { KeyRound, Copy, Check, RefreshCw, Shield, ShieldAlert, ShieldCheck } from 'lucide-react';

interface PasswordGeneratorProps {
  theme: 'dark' | 'light';
}

export const PasswordGenerator: React.FC<PasswordGeneratorProps> = ({ theme }) => {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });
  const [copied, setCopied] = useState(false);
  const [strength, setStrength] = useState<{ score: number; label: string; color: string }>({ score: 0, label: '', color: '' });

  const generatePassword = () => {
    let charset = '';
    if (options.uppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (options.lowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (options.numbers) charset += '0123456789';
    if (options.symbols) charset += '!@#$%^&*()_+~`|}{[]:;?><,./-=';

    if (charset === '') {
      setPassword('');
      return;
    }

    let newPassword = '';
    const randomValues = new Uint32Array(length);
    crypto.getRandomValues(randomValues);

    for (let i = 0; i < length; i++) {
      newPassword += charset[randomValues[i] % charset.length];
    }

    setPassword(newPassword);
  };

  const evaluateStrength = (pass: string) => {
    let score = 0;
    if (!pass) return { score: 0, label: 'None', color: 'text-gray-500' };

    if (pass.length > 8) score += 1;
    if (pass.length > 12) score += 1;
    if (pass.length >= 16) score += 1;

    if (/[A-Z]/.test(pass)) score += 1;
    if (/[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score < 3) return { score, label: 'Weak', color: 'text-red-500' };
    if (score < 5) return { score, label: 'Fair', color: 'text-yellow-500' };
    if (score < 7) return { score, label: 'Good', color: 'text-blue-500' };
    return { score, label: 'Strong', color: 'text-green-500' };
  };

  useEffect(() => {
    generatePassword();
  }, [length, options]);

  useEffect(() => {
    setStrength(evaluateStrength(password));
  }, [password]);

  const handleCopy = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleOption = (key: keyof typeof options) => {
    // Prevent unchecking the last option
    const activeCount = Object.values(options).filter(Boolean).length;
    if (activeCount === 1 && options[key]) return;
    
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const btnClass = `px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
    theme === 'dark' 
      ? 'bg-[#333] text-white hover:bg-[#444]' 
      : 'bg-[#e0e0e0] text-black hover:bg-[#d0d0d0]'
  }`;

  return (
    <div className="p-4 sm:p-6 w-full max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`p-6 rounded-xl border ${theme === 'dark' ? 'bg-[#111] border-[#333]' : 'bg-white border-[#eee]'}`}
      >
        <div className="flex items-center gap-3 mb-6">
          <KeyRound className={theme === 'dark' ? 'text-[#00ff9d]' : 'text-[#006633]'} size={24} />
          <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Password Generator</h2>
        </div>

        <div className="flex flex-col gap-6">
          {/* Password Display */}
          <div className={`relative flex items-center w-full p-4 rounded-lg border ${theme === 'dark' ? 'bg-[#1a1a1a] border-[#333]' : 'bg-[#fafafa] border-[#ddd]'}`}>
            <div className={`flex-1 font-mono text-lg sm:text-2xl break-all pr-12 ${theme === 'dark' ? 'text-[#00ff9d]' : 'text-[#006633]'}`}>
              {password || 'Select options to generate'}
            </div>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
              <button 
                onClick={generatePassword}
                className={`p-2 rounded-md transition-colors ${theme === 'dark' ? 'text-[#aaa] hover:text-white hover:bg-[#333]' : 'text-[#666] hover:text-black hover:bg-[#e0e0e0]'}`}
                title="Regenerate"
              >
                <RefreshCw size={20} />
              </button>
              <button 
                onClick={handleCopy}
                className={`p-2 rounded-md transition-colors ${theme === 'dark' ? 'text-[#aaa] hover:text-white hover:bg-[#333]' : 'text-[#666] hover:text-black hover:bg-[#e0e0e0]'}`}
                title="Copy"
              >
                {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
              </button>
            </div>
          </div>

          {/* Strength Indicator */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {strength.score < 3 ? <ShieldAlert size={18} className={strength.color} /> : 
               strength.score < 5 ? <Shield size={18} className={strength.color} /> : 
               <ShieldCheck size={18} className={strength.color} />}
              <span className={`text-sm font-medium ${strength.color}`}>
                {strength.label} Password
              </span>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4].map(i => (
                <div 
                  key={i} 
                  className={`h-2 w-8 sm:w-12 rounded-full transition-colors ${
                    i <= (strength.score / 2) 
                      ? strength.color.replace('text-', 'bg-') 
                      : (theme === 'dark' ? 'bg-[#333]' : 'bg-[#e0e0e0]')
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Length Slider */}
          <div className="flex flex-col gap-3 mt-2">
            <div className="flex justify-between items-center">
              <label className={`text-sm font-medium ${theme === 'dark' ? 'text-[#aaa]' : 'text-[#666]'}`}>Password Length</label>
              <span className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{length}</span>
            </div>
            <input 
              type="range" 
              min="4" 
              max="64" 
              value={length} 
              onChange={(e) => setLength(parseInt(e.target.value))}
              className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${theme === 'dark' ? 'bg-[#333]' : 'bg-[#e0e0e0]'}`}
              style={{
                background: `linear-gradient(to right, ${theme === 'dark' ? '#00ff9d' : '#006633'} ${(length - 4) / 60 * 100}%, ${theme === 'dark' ? '#333' : '#e0e0e0'} ${(length - 4) / 60 * 100}%)`
              }}
            />
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            {[
              { id: 'uppercase', label: 'Uppercase (A-Z)' },
              { id: 'lowercase', label: 'Lowercase (a-z)' },
              { id: 'numbers', label: 'Numbers (0-9)' },
              { id: 'symbols', label: 'Symbols (!@#$)' },
            ].map((opt) => (
              <label 
                key={opt.id} 
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  options[opt.id as keyof typeof options]
                    ? (theme === 'dark' ? 'bg-[#00ff9d]/10 border-[#00ff9d]/30' : 'bg-[#006633]/5 border-[#006633]/30')
                    : (theme === 'dark' ? 'bg-[#1a1a1a] border-[#333]' : 'bg-[#fafafa] border-[#ddd]')
                }`}
              >
                <input 
                  type="checkbox" 
                  checked={options[opt.id as keyof typeof options]}
                  onChange={() => toggleOption(opt.id as keyof typeof options)}
                  className={`w-4 h-4 rounded ${theme === 'dark' ? 'accent-[#00ff9d]' : 'accent-[#006633]'}`}
                />
                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-[#ccc]' : 'text-[#555]'}`}>
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
          
          <button 
            onClick={generatePassword}
            className={`w-full py-3 rounded-lg font-bold text-sm transition-colors mt-2 ${
              theme === 'dark' 
                ? 'bg-[#00ff9d] text-black hover:bg-[#00cc7d]' 
                : 'bg-[#006633] text-white hover:bg-[#004d26]'
            }`}
          >
            Generate New Password
          </button>
        </div>
      </motion.div>
    </div>
  );
};
