import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, CheckCircle, XCircle } from 'lucide-react';

interface RegexTesterProps {
  theme: 'dark' | 'light';
}

export const RegexTester: React.FC<RegexTesterProps> = ({ theme }) => {
  const [pattern, setPattern] = useState<string>('[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}');
  const [flags, setFlags] = useState<string>('g');
  const [testString, setTestString] = useState<string>('Contact us at support@example.com or sales@company.org for more info.\nInvalid emails: user@.com, @domain.com');
  const [error, setError] = useState<string | null>(null);

  const getMatches = () => {
    try {
      if (!pattern) return { matches: [], error: null };
      
      const regex = new RegExp(pattern, flags);
      const matches = [];
      let match;
      
      if (flags.includes('g')) {
        while ((match = regex.exec(testString)) !== null) {
          matches.push(match);
          if (match.index === regex.lastIndex) {
            regex.lastIndex++;
          }
        }
      } else {
        match = regex.exec(testString);
        if (match) matches.push(match);
      }
      
      return { matches, error: null };
    } catch (err: any) {
      return { matches: [], error: err.message };
    }
  };

  const { matches, error: regexError } = getMatches();

  const renderHighlightedText = () => {
    if (regexError || !pattern || matches.length === 0) {
      return <div className="whitespace-pre-wrap">{testString}</div>;
    }

    let lastIndex = 0;
    const elements = [];

    matches.forEach((match, i) => {
      const start = match.index;
      const end = start + match[0].length;

      if (start > lastIndex) {
        elements.push(<span key={`text-${i}`}>{testString.substring(lastIndex, start)}</span>);
      }

      elements.push(
        <span key={`match-${i}`} className={`rounded px-1 ${theme === 'dark' ? 'bg-[#00ff9d]/30 text-[#00ff9d]' : 'bg-[#006633]/20 text-[#006633] font-bold'}`}>
          {testString.substring(start, end)}
        </span>
      );

      lastIndex = end;
    });

    if (lastIndex < testString.length) {
      elements.push(<span key="text-end">{testString.substring(lastIndex)}</span>);
    }

    return <div className="whitespace-pre-wrap">{elements}</div>;
  };

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
            <Search className={theme === 'dark' ? 'text-[#00ff9d]' : 'text-[#006633]'} size={20} />
            <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Regex Tester</h2>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 flex flex-col gap-6">
          
          {/* Regex Input Section */}
          <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-[#161616] border-[#333]' : 'bg-[#f5f5f5] border-[#ddd]'}`}>
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-[#aaa]' : 'text-[#666]'}`}>Regular Expression</label>
            <div className="flex gap-2 items-center">
              <span className={`text-xl font-mono ${theme === 'dark' ? 'text-[#666]' : 'text-[#999]'}`}>/</span>
              <input
                type="text"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                className={`flex-1 p-3 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-[#00ff9d]/50 ${theme === 'dark' ? 'bg-[#222] text-[#00ff9d] border-[#444]' : 'bg-white text-[#006633] border-[#ccc]'} border`}
                placeholder="Enter regex pattern..."
              />
              <span className={`text-xl font-mono ${theme === 'dark' ? 'text-[#666]' : 'text-[#999]'}`}>/</span>
              <input
                type="text"
                value={flags}
                onChange={(e) => setFlags(e.target.value)}
                className={`w-20 p-3 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-[#00ff9d]/50 ${theme === 'dark' ? 'bg-[#222] text-[#aaa] border-[#444]' : 'bg-white text-[#666] border-[#ccc]'} border`}
                placeholder="gmi"
              />
            </div>
            {regexError && (
              <div className="mt-2 text-red-500 text-sm flex items-center gap-1">
                <XCircle size={14} /> {regexError}
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-6 flex-1">
            {/* Test String Section */}
            <div className={`flex-1 flex flex-col p-4 rounded-xl border ${theme === 'dark' ? 'bg-[#161616] border-[#333]' : 'bg-[#f5f5f5] border-[#ddd]'}`}>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-[#aaa]' : 'text-[#666]'}`}>Test String</label>
              <textarea
                value={testString}
                onChange={(e) => setTestString(e.target.value)}
                className={`flex-1 w-full p-4 rounded-lg resize-none font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#00ff9d]/50 ${theme === 'dark' ? 'bg-[#222] text-[#ccc] border-[#444]' : 'bg-white text-[#333] border-[#ccc]'} border`}
                placeholder="Enter text to test your regex against..."
                spellCheck={false}
              />
            </div>

            {/* Results Section */}
            <div className={`flex-1 flex flex-col p-4 rounded-xl border ${theme === 'dark' ? 'bg-[#161616] border-[#333]' : 'bg-[#f5f5f5] border-[#ddd]'}`}>
              <div className="flex justify-between items-center mb-2">
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-[#aaa]' : 'text-[#666]'}`}>Match Results</label>
                {!regexError && pattern && (
                  <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${matches.length > 0 ? (theme === 'dark' ? 'bg-[#00ff9d]/20 text-[#00ff9d]' : 'bg-[#006633]/20 text-[#006633]') : (theme === 'dark' ? 'bg-red-500/20 text-red-500' : 'bg-red-100 text-red-600')}`}>
                    {matches.length > 0 ? <CheckCircle size={12} /> : <XCircle size={12} />}
                    {matches.length} match{matches.length !== 1 ? 'es' : ''}
                  </span>
                )}
              </div>
              <div className={`flex-1 w-full p-4 rounded-lg font-mono text-sm overflow-auto ${theme === 'dark' ? 'bg-[#222] text-[#ccc] border-[#444]' : 'bg-white text-[#333] border-[#ccc]'} border`}>
                {renderHighlightedText()}
              </div>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
};
