import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Table, Upload, Download, FileJson, FileSpreadsheet, Trash2, FileText } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface DataEditorProps {
  theme: 'dark' | 'light';
}

export const DataEditor: React.FC<DataEditorProps> = ({ theme }) => {
  const [data, setData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>('untitled.csv');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);

    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            setHeaders(Object.keys(results.data[0] as object));
            setData(results.data);
          } else {
            setError('CSV file is empty or invalid.');
          }
        },
        error: (err) => {
          setError(err.message);
        }
      });
    } else if (ext === 'json') {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          if (Array.isArray(json)) {
            if (json.length > 0 && typeof json[0] === 'object') {
              setHeaders(Object.keys(json[0]));
              setData(json);
            } else {
              setError('JSON array must contain objects.');
            }
          } else {
            setError('JSON file must contain an array of objects.');
          }
        } catch (err: any) {
          setError('Invalid JSON file.');
        }
      };
      reader.readAsText(file);
    } else if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);
          
          if (json.length > 0 && typeof json[0] === 'object') {
            setHeaders(Object.keys(json[0] as object));
            setData(json);
          } else {
            setError('Excel file is empty or invalid.');
          }
        } catch (err: any) {
          setError('Failed to read Excel file.');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      setError('Unsupported file type. Please upload a CSV, JSON, or Excel file.');
    }
  };

  const downloadCSV = () => {
    if (data.length === 0) return;
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName.replace(/\.[^/.]+$/, '') + '.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadExcel = () => {
    if (data.length === 0) return;
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, fileName.replace(/\.[^/.]+$/, '') + '.xlsx');
  };

  const downloadJSON = () => {
    if (data.length === 0) return;
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName.replace(/\.[^/.]+$/, '') + '.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCellChange = (rowIndex: number, header: string, value: string) => {
    const newData = [...data];
    newData[rowIndex] = { ...newData[rowIndex], [header]: value };
    setData(newData);
  };

  const addRow = () => {
    const newRow: any = {};
    headers.forEach(h => newRow[h] = '');
    setData([...data, newRow]);
  };

  const deleteRow = (index: number) => {
    const newData = data.filter((_, i) => i !== index);
    setData(newData);
  };

  const clearData = () => {
    setData([]);
    setHeaders([]);
    setFileName('untitled.csv');
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
            <Table className={theme === 'dark' ? 'text-[#00ff9d]' : 'text-[#006633]'} size={20} />
            <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Spreadsheet Editor</h2>
            {data.length > 0 && <span className={`text-xs px-2 py-1 rounded-full ${theme === 'dark' ? 'bg-[#333] text-[#aaa]' : 'bg-[#e0e0e0] text-[#666]'}`}>{fileName}</span>}
          </div>
          
          <div className="flex items-center gap-2">
            <input 
              type="file" 
              accept=".csv,.json,.xlsx,.xls" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <button onClick={() => fileInputRef.current?.click()} className={btnClass}>
              <Upload size={16} /> Upload
            </button>
            
            {data.length > 0 && (
              <>
                <div className={`h-6 w-px mx-1 ${theme === 'dark' ? 'bg-[#444]' : 'bg-[#ccc]'}`}></div>
                <button onClick={downloadCSV} className={btnClass} title="Download CSV">
                  <FileText size={16} /> CSV
                </button>
                <button onClick={downloadJSON} className={btnClass} title="Download JSON">
                  <FileJson size={16} /> JSON
                </button>
                <button onClick={downloadExcel} className={btnClass} title="Download Excel">
                  <FileSpreadsheet size={16} /> Excel
                </button>
                <button onClick={clearData} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${theme === 'dark' ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-red-100 text-red-600 hover:bg-red-200'}`} title="Clear Data">
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {error && (
            <div className="p-4 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
              {error}
            </div>
          )}

          {data.length === 0 && !error ? (
            <div className={`h-full flex flex-col items-center justify-center text-center ${theme === 'dark' ? 'text-[#666]' : 'text-[#999]'}`}>
              <Table size={48} className="mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No data loaded</p>
              <p className="text-sm max-w-md">Upload an Excel (.xlsx), CSV, or JSON file to view and edit its contents as a spreadsheet.</p>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className={`mt-6 px-6 py-2 rounded-lg font-medium transition-colors ${theme === 'dark' ? 'bg-[#00ff9d] text-black hover:bg-[#00cc7d]' : 'bg-[#006633] text-white hover:bg-[#004d26]'}`}
              >
                Select File
              </button>
            </div>
          ) : (
            <div className="min-w-max">
              <table className={`w-full border-collapse text-sm ${theme === 'dark' ? 'text-[#ccc]' : 'text-[#333]'}`}>
                <thead>
                  <tr>
                    <th className={`p-2 border font-medium text-left sticky top-0 z-10 ${theme === 'dark' ? 'bg-[#222] border-[#444] text-[#aaa]' : 'bg-[#f5f5f5] border-[#ddd] text-[#666]'}`}>#</th>
                    {headers.map((header, i) => (
                      <th key={i} className={`p-2 border font-medium text-left sticky top-0 z-10 ${theme === 'dark' ? 'bg-[#222] border-[#444] text-[#aaa]' : 'bg-[#f5f5f5] border-[#ddd] text-[#666]'}`}>
                        {header}
                      </th>
                    ))}
                    <th className={`p-2 border font-medium text-center sticky top-0 z-10 ${theme === 'dark' ? 'bg-[#222] border-[#444] text-[#aaa]' : 'bg-[#f5f5f5] border-[#ddd] text-[#666]'}`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, rowIndex) => (
                    <tr key={rowIndex} className={`hover:${theme === 'dark' ? 'bg-[#222]' : 'bg-[#f9f9f9]'}`}>
                      <td className={`p-2 border text-center ${theme === 'dark' ? 'border-[#333] text-[#666]' : 'border-[#eee] text-[#999]'}`}>
                        {rowIndex + 1}
                      </td>
                      {headers.map((header, colIndex) => (
                        <td key={colIndex} className={`p-0 border ${theme === 'dark' ? 'border-[#333]' : 'border-[#eee]'}`}>
                          <input
                            type="text"
                            value={row[header] || ''}
                            onChange={(e) => handleCellChange(rowIndex, header, e.target.value)}
                            className={`w-full h-full p-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#00ff9d]/50 ${theme === 'dark' ? 'text-[#ccc]' : 'text-[#333]'}`}
                          />
                        </td>
                      ))}
                      <td className={`p-2 border text-center ${theme === 'dark' ? 'border-[#333]' : 'border-[#eee]'}`}>
                        <button 
                          onClick={() => deleteRow(rowIndex)}
                          className={`p-1 rounded transition-colors ${theme === 'dark' ? 'text-[#666] hover:text-red-500 hover:bg-[#333]' : 'text-[#999] hover:text-red-500 hover:bg-[#eee]'}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button 
                onClick={addRow}
                className={`mt-4 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-dashed ${theme === 'dark' ? 'border-[#444] text-[#aaa] hover:text-white hover:border-[#666]' : 'border-[#ccc] text-[#666] hover:text-black hover:border-[#999]'}`}
              >
                + Add Row
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
