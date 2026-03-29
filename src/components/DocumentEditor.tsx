import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { 
  FileText, Upload, Trash2, Download, Type, Square, Circle, 
  Image as ImageIcon, ChevronLeft, ChevronRight, X, 
  Undo, Redo, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, 
  Layers, ArrowUp, ArrowDown, Copy, ClipboardPaste, Palette, MousePointer2, Type as TypeIcon
} from 'lucide-react';
import { fabric } from 'fabric';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth/mammoth.browser';
import jsPDF from 'jspdf';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface DocumentEditorProps {
  theme: 'dark' | 'light';
}

const FONTS = ['Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana', 'Helvetica', 'Comic Sans MS', 'Impact'];

export function DocumentEditor({ theme }: DocumentEditorProps) {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
  const [fileName, setFileName] = useState('Untitled Design');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // PDF Pagination state
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [scale, setScale] = useState(1.5);

  // Editor State
  const [activeObject, setActiveObject] = useState<fabric.Object | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isHistoryAction, setIsHistoryAction] = useState(false);
  const [clipboard, setClipboard] = useState<fabric.Object | null>(null);

  // Refs for state accessed in event listeners
  const historyRef = useRef(history);
  const historyIndexRef = useRef(historyIndex);
  const isHistoryActionRef = useRef(isHistoryAction);
  const clipboardRef = useRef(clipboard);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    historyIndexRef.current = historyIndex;
  }, [historyIndex]);

  useEffect(() => {
    isHistoryActionRef.current = isHistoryAction;
  }, [isHistoryAction]);

  useEffect(() => {
    clipboardRef.current = clipboard;
  }, [clipboard]);

  // Properties State
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontSize, setFontSize] = useState(24);
  const [fillColor, setFillColor] = useState('#000000');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [textAlign, setTextAlign] = useState('left');
  const [opacity, setOpacity] = useState(1);

  // Modal States
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Initialize Canvas
  useEffect(() => {
    if (canvasRef.current && canvasContainerRef.current && !fabricCanvas) {
      const initCanvas = new fabric.Canvas(canvasRef.current, {
        width: 800,
        height: 1131, // A4 ratio
        backgroundColor: '#ffffff',
        preserveObjectStacking: true,
      });
      setFabricCanvas(initCanvas);

      // Save initial state
      const initialJson = JSON.stringify(initCanvas.toJSON());
      setHistory([initialJson]);
      setHistoryIndex(0);

      const updateProperties = () => {
        const activeObj = initCanvas.getActiveObject();
        setActiveObject(activeObj || null);
        if (activeObj) {
          if (activeObj.type === 'i-text' || activeObj.type === 'text') {
            const textObj = activeObj as fabric.IText;
            setFontFamily(textObj.fontFamily || 'Arial');
            setFontSize(textObj.fontSize || 24);
            setFillColor(textObj.fill as string || '#000000');
            setIsBold(textObj.fontWeight === 'bold');
            setIsItalic(textObj.fontStyle === 'italic');
            setIsUnderline(textObj.underline || false);
            setTextAlign(textObj.textAlign || 'left');
          } else if (activeObj.type === 'rect' || activeObj.type === 'circle') {
            setFillColor(activeObj.fill as string || 'transparent');
            setStrokeColor(activeObj.stroke || '#000000');
            setStrokeWidth(activeObj.strokeWidth || 0);
          }
          setOpacity(activeObj.opacity ?? 1);
        }
      };

      initCanvas.on('selection:created', updateProperties);
      initCanvas.on('selection:updated', updateProperties);
      initCanvas.on('selection:cleared', () => setActiveObject(null));

      const saveHistory = () => {
        if (isHistoryActionRef.current) return;
        const json = JSON.stringify(initCanvas.toJSON());
        setHistory(prev => {
          const newHistory = prev.slice(0, historyIndexRef.current + 1);
          newHistory.push(json);
          return newHistory;
        });
        setHistoryIndex(prev => prev + 1);
      };

      initCanvas.on('object:modified', saveHistory);
      initCanvas.on('object:added', (e) => {
        if (!isHistoryActionRef.current) saveHistory();
      });
      initCanvas.on('object:removed', (e) => {
        if (!isHistoryActionRef.current) saveHistory();
      });

      const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.key === 'Delete' || e.key === 'Backspace') && !isEditingText(initCanvas)) {
          deleteSelected(initCanvas);
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
          e.preventDefault();
          if (e.shiftKey) handleRedo(initCanvas);
          else handleUndo(initCanvas);
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
          e.preventDefault();
          handleRedo(initCanvas);
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
          handleCopy(initCanvas);
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
          handlePaste(initCanvas);
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        initCanvas.dispose();
      };
    }
  }, []); // Run only once on mount

  const isEditingText = (canvas: fabric.Canvas) => {
    const activeObj = canvas.getActiveObject();
    return activeObj && activeObj.type === 'i-text' && (activeObj as fabric.IText).isEditing;
  };

  const handleUndo = (canvas: fabric.Canvas = fabricCanvas!) => {
    if (!canvas || historyIndexRef.current <= 0) return;
    setIsHistoryAction(true);
    const newIndex = historyIndexRef.current - 1;
    setHistoryIndex(newIndex);
    canvas.loadFromJSON(historyRef.current[newIndex], () => {
      canvas.renderAll();
      setIsHistoryAction(false);
    });
  };

  const handleRedo = (canvas: fabric.Canvas = fabricCanvas!) => {
    if (!canvas || historyIndexRef.current >= historyRef.current.length - 1) return;
    setIsHistoryAction(true);
    const newIndex = historyIndexRef.current + 1;
    setHistoryIndex(newIndex);
    canvas.loadFromJSON(historyRef.current[newIndex], () => {
      canvas.renderAll();
      setIsHistoryAction(false);
    });
  };

  const handleCopy = (canvas: fabric.Canvas = fabricCanvas!) => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      activeObject.clone((cloned: fabric.Object) => {
        setClipboard(cloned);
      });
    }
  };

  const handlePaste = (canvas: fabric.Canvas = fabricCanvas!) => {
    if (!canvas || !clipboardRef.current) return;
    clipboardRef.current.clone((clonedObj: fabric.Object) => {
      canvas.discardActiveObject();
      clonedObj.set({
        left: clonedObj.left! + 10,
        top: clonedObj.top! + 10,
        evented: true,
      });
      if (clonedObj.type === 'activeSelection') {
        clonedObj.canvas = canvas;
        (clonedObj as fabric.ActiveSelection).forEachObject((obj) => {
          canvas.add(obj);
        });
        clonedObj.setCoords();
      } else {
        canvas.add(clonedObj);
      }
      clipboardRef.current!.top! += 10;
      clipboardRef.current!.left! += 10;
      canvas.setActiveObject(clonedObj);
      canvas.requestRenderAll();
    });
  };

  const deleteSelected = (canvas: fabric.Canvas = fabricCanvas!) => {
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length) {
      canvas.discardActiveObject();
      activeObjects.forEach((obj) => canvas.remove(obj));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fabricCanvas) return;

    setIsLoading(true);
    setFileName(file.name);
    const ext = file.name.split('.').pop()?.toLowerCase();

    try {
      if (ext === 'pdf') {
        console.log('Reading PDF...');
        const arrayBuffer = await file.arrayBuffer();
        console.log('Got array buffer, getting document...');
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        console.log('Got PDF document, rendering page...');
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setCurrentPage(1);
        await renderPdfPage(pdf, 1, scale, fabricCanvas);
        console.log('PDF rendered.');
      } else if (ext === 'docx') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        addTextToCanvas(result.value.substring(0, 5000)); // Limit text to avoid freezing
        setPdfDoc(null);
      } else if (ext === 'txt') {
        const text = await file.text();
        addTextToCanvas(text.substring(0, 5000));
        setPdfDoc(null);
      } else {
        setErrorMessage('Unsupported file type for document import. Please use PDF, DOCX, or TXT.');
      }
    } catch (error) {
      console.error('Error reading file:', error);
      setErrorMessage('Error reading file');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const renderPdfPage = async (pdf: any, pageNum: number, currentScale: number, canvas: fabric.Canvas) => {
    setIsLoading(true);
    try {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: currentScale });

      const tempCanvas = document.createElement('canvas');
      const context = tempCanvas.getContext('2d');
      if (!context) return;
      
      tempCanvas.height = viewport.height;
      tempCanvas.width = viewport.width;

      await page.render({ canvasContext: context, viewport }).promise;

      canvas.clear();
      canvas.setBackgroundColor('#ffffff', () => {});
      canvas.setWidth(viewport.width);
      canvas.setHeight(viewport.height);

      fabric.Image.fromURL(tempCanvas.toDataURL(), (img) => {
        canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
        setIsLoading(false);
      });
    } catch (err) {
      console.error('Error rendering page:', err);
      setIsLoading(false);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1 && pdfDoc && fabricCanvas) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      renderPdfPage(pdfDoc, newPage, scale, fabricCanvas);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages && pdfDoc && fabricCanvas) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      renderPdfPage(pdfDoc, newPage, scale, fabricCanvas);
    }
  };

  const addTextToCanvas = (textStr: string = 'Type here...') => {
    if (!fabricCanvas) return;
    const text = new fabric.IText(textStr, {
      left: 50,
      top: 50,
      fontFamily: 'Arial',
      fill: '#000000',
      fontSize: 24,
      transparentCorners: false,
      cornerColor: theme === 'dark' ? '#00ff9d' : '#006633',
      cornerStrokeColor: '#000',
      borderColor: theme === 'dark' ? '#00ff9d' : '#006633',
      cornerSize: 10,
    });
    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    fabricCanvas.renderAll();
  };

  const addRect = () => {
    if (!fabricCanvas) return;
    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      fill: '#000000',
      stroke: 'transparent',
      strokeWidth: 0,
      width: 150,
      height: 100,
      transparentCorners: false,
      cornerColor: theme === 'dark' ? '#00ff9d' : '#006633',
      borderColor: theme === 'dark' ? '#00ff9d' : '#006633',
      cornerSize: 10,
    });
    fabricCanvas.add(rect);
    fabricCanvas.setActiveObject(rect);
    fabricCanvas.renderAll();
  };

  const addCircle = () => {
    if (!fabricCanvas) return;
    const circle = new fabric.Circle({
      left: 100,
      top: 100,
      fill: '#000000',
      stroke: 'transparent',
      strokeWidth: 0,
      radius: 50,
      transparentCorners: false,
      cornerColor: theme === 'dark' ? '#00ff9d' : '#006633',
      borderColor: theme === 'dark' ? '#00ff9d' : '#006633',
      cornerSize: 10,
    });
    fabricCanvas.add(circle);
    fabricCanvas.setActiveObject(circle);
    fabricCanvas.renderAll();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fabricCanvas) return;
    const reader = new FileReader();
    reader.onload = (f) => {
      const data = f.target?.result;
      fabric.Image.fromURL(data as string, (img) => {
        img.scaleToWidth(200);
        img.set({
          transparentCorners: false,
          cornerColor: theme === 'dark' ? '#00ff9d' : '#006633',
          borderColor: theme === 'dark' ? '#00ff9d' : '#006633',
          cornerSize: 10,
        });
        fabricCanvas.add(img);
        fabricCanvas.setActiveObject(img);
        fabricCanvas.renderAll();
      });
    };
    reader.readAsDataURL(file);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const clearCanvas = () => {
    if (!fabricCanvas) return;
    setShowClearConfirm(true);
  };

  const confirmClearCanvas = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.setBackgroundColor('#ffffff', () => {});
    setPdfDoc(null);
    setFileName('Untitled Design');
    setShowClearConfirm(false);
  };

  const downloadPdf = () => {
    if (!fabricCanvas) return;
    fabricCanvas.discardActiveObject();
    fabricCanvas.renderAll();
    const dataUrl = fabricCanvas.toDataURL({ format: 'jpeg', quality: 1 });
    const pdf = new jsPDF({
      orientation: fabricCanvas.width! > fabricCanvas.height! ? 'landscape' : 'portrait',
      unit: 'px',
      format: [fabricCanvas.width!, fabricCanvas.height!]
    });
    pdf.addImage(dataUrl, 'JPEG', 0, 0, fabricCanvas.width!, fabricCanvas.height!);
    pdf.save(`${fileName.replace(/\.[^/.]+$/, '')}_edited.pdf`);
  };

  const downloadImage = () => {
    if (!fabricCanvas) return;
    fabricCanvas.discardActiveObject();
    fabricCanvas.renderAll();
    const dataUrl = fabricCanvas.toDataURL({ format: 'png', quality: 1 });
    const link = document.createElement('a');
    link.download = `${fileName.replace(/\.[^/.]+$/, '')}_edited.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Property Handlers
  const updateActiveObject = (key: string, value: any) => {
    if (!fabricCanvas || !activeObject) return;
    activeObject.set(key as keyof fabric.Object, value);
    fabricCanvas.renderAll();
    fabricCanvas.fire('object:modified', { target: activeObject });
  };

  const handleFontFamilyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFontFamily(e.target.value);
    updateActiveObject('fontFamily', e.target.value);
  };

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const size = parseInt(e.target.value, 10);
    setFontSize(size);
    updateActiveObject('fontSize', size);
  };

  const handleFillColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFillColor(e.target.value);
    updateActiveObject('fill', e.target.value);
  };

  const handleStrokeColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStrokeColor(e.target.value);
    updateActiveObject('stroke', e.target.value);
  };

  const handleStrokeWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const width = parseInt(e.target.value, 10);
    setStrokeWidth(width);
    updateActiveObject('strokeWidth', width);
  };

  const toggleBold = () => {
    const newBold = !isBold;
    setIsBold(newBold);
    updateActiveObject('fontWeight', newBold ? 'bold' : 'normal');
  };

  const toggleItalic = () => {
    const newItalic = !isItalic;
    setIsItalic(newItalic);
    updateActiveObject('fontStyle', newItalic ? 'italic' : 'normal');
  };

  const toggleUnderline = () => {
    const newUnderline = !isUnderline;
    setIsUnderline(newUnderline);
    updateActiveObject('underline', newUnderline);
  };

  const handleTextAlign = (align: string) => {
    setTextAlign(align);
    updateActiveObject('textAlign', align);
  };

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const op = parseFloat(e.target.value);
    setOpacity(op);
    updateActiveObject('opacity', op);
  };

  const bringForward = () => {
    if (!fabricCanvas || !activeObject) return;
    fabricCanvas.bringForward(activeObject);
    fabricCanvas.renderAll();
    fabricCanvas.fire('object:modified', { target: activeObject });
  };

  const sendBackward = () => {
    if (!fabricCanvas || !activeObject) return;
    fabricCanvas.sendBackwards(activeObject);
    fabricCanvas.renderAll();
    fabricCanvas.fire('object:modified', { target: activeObject });
  };

  const btnClass = `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
    theme === 'dark' ? 'bg-[#333] text-white hover:bg-[#444]' : 'bg-[#e0e0e0] text-black hover:bg-[#d0d0d0]'
  }`;

  const iconBtnClass = `p-1.5 rounded-md transition-colors ${
    theme === 'dark' ? 'text-[#aaa] hover:bg-[#333] hover:text-white' : 'text-[#555] hover:bg-[#e0e0e0] hover:text-black'
  }`;

  const activeIconBtnClass = `p-1.5 rounded-md transition-colors ${
    theme === 'dark' ? 'bg-[#444] text-[#00ff9d]' : 'bg-[#d0d0d0] text-[#006633]'
  }`;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full flex flex-col"
    >
      <div className={`flex-1 rounded-xl border overflow-hidden flex flex-col ${theme === 'dark' ? 'border-[#333] bg-[#1a1a1a]' : 'border-[#eee] bg-white'}`}>
        
        {/* Top Header */}
        <div className={`p-3 border-b flex flex-wrap justify-between items-center gap-4 ${theme === 'dark' ? 'border-[#333] bg-[#1a1a1a]' : 'border-[#eee] bg-[#fafafa]'}`}>
          <div className="flex items-center gap-3">
            <FileText className={theme === 'dark' ? 'text-[#00ff9d]' : 'text-[#006633]'} size={20} />
            <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Visual Editor</h2>
            <span className={`text-xs px-2 py-1 rounded-full ${theme === 'dark' ? 'bg-[#333] text-[#aaa]' : 'bg-[#e0e0e0] text-[#666]'}`}>{fileName}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={() => handleUndo()} disabled={historyIndex <= 0} className={`${iconBtnClass} disabled:opacity-30`} title="Undo (Ctrl+Z)">
              <Undo size={18} />
            </button>
            <button onClick={() => handleRedo()} disabled={historyIndex >= history.length - 1} className={`${iconBtnClass} disabled:opacity-30`} title="Redo (Ctrl+Y)">
              <Redo size={18} />
            </button>

            <div className={`h-6 w-px mx-1 ${theme === 'dark' ? 'bg-[#444]' : 'bg-[#ccc]'}`}></div>

            <button onClick={() => handleCopy()} disabled={!activeObject} className={`${iconBtnClass} disabled:opacity-30`} title="Copy (Ctrl+C)">
              <Copy size={18} />
            </button>
            <button onClick={() => handlePaste()} disabled={!clipboard} className={`${iconBtnClass} disabled:opacity-30`} title="Paste (Ctrl+V)">
              <ClipboardPaste size={18} />
            </button>

            <div className={`h-6 w-px mx-1 ${theme === 'dark' ? 'bg-[#444]' : 'bg-[#ccc]'}`}></div>

            <button onClick={downloadPdf} className={btnClass} title="Download PDF">
              <Download size={16} /> Save PDF
            </button>
            <button onClick={downloadImage} className={btnClass} title="Download Image">
              <ImageIcon size={16} /> Save PNG
            </button>
          </div>
        </div>

        {/* Properties Bar (Top) */}
        <div className={`p-2 border-b flex flex-wrap items-center gap-3 min-h-[48px] ${theme === 'dark' ? 'border-[#333] bg-[#222]' : 'border-[#eee] bg-[#f5f5f5]'}`}>
          {activeObject ? (
            <>
              {/* Text Properties */}
              {(activeObject.type === 'i-text' || activeObject.type === 'text') && (
                <>
                  <select 
                    value={fontFamily} 
                    onChange={handleFontFamilyChange}
                    className={`px-2 py-1 rounded text-sm border ${theme === 'dark' ? 'bg-[#111] border-[#444] text-white' : 'bg-white border-[#ccc] text-black'}`}
                  >
                    {FONTS.map(font => <option key={font} value={font}>{font}</option>)}
                  </select>
                  
                  <div className="flex items-center gap-1">
                    <input 
                      type="number" 
                      value={fontSize} 
                      onChange={handleFontSizeChange}
                      className={`w-16 px-2 py-1 rounded text-sm border ${theme === 'dark' ? 'bg-[#111] border-[#444] text-white' : 'bg-white border-[#ccc] text-black'}`}
                      min="8" max="200"
                    />
                  </div>

                  <div className={`h-5 w-px mx-1 ${theme === 'dark' ? 'bg-[#444]' : 'bg-[#ccc]'}`}></div>

                  <button onClick={toggleBold} className={isBold ? activeIconBtnClass : iconBtnClass} title="Bold">
                    <Bold size={16} />
                  </button>
                  <button onClick={toggleItalic} className={isItalic ? activeIconBtnClass : iconBtnClass} title="Italic">
                    <Italic size={16} />
                  </button>
                  <button onClick={toggleUnderline} className={isUnderline ? activeIconBtnClass : iconBtnClass} title="Underline">
                    <Underline size={16} />
                  </button>

                  <div className={`h-5 w-px mx-1 ${theme === 'dark' ? 'bg-[#444]' : 'bg-[#ccc]'}`}></div>

                  <button onClick={() => handleTextAlign('left')} className={textAlign === 'left' ? activeIconBtnClass : iconBtnClass} title="Align Left">
                    <AlignLeft size={16} />
                  </button>
                  <button onClick={() => handleTextAlign('center')} className={textAlign === 'center' ? activeIconBtnClass : iconBtnClass} title="Align Center">
                    <AlignCenter size={16} />
                  </button>
                  <button onClick={() => handleTextAlign('right')} className={textAlign === 'right' ? activeIconBtnClass : iconBtnClass} title="Align Right">
                    <AlignRight size={16} />
                  </button>
                </>
              )}

              {/* Shape Properties */}
              {(activeObject.type === 'rect' || activeObject.type === 'circle' || activeObject.type === 'i-text' || activeObject.type === 'text') && (
                <>
                  <div className={`h-5 w-px mx-1 ${theme === 'dark' ? 'bg-[#444]' : 'bg-[#ccc]'}`}></div>
                  
                  <div className="flex items-center gap-1" title="Fill Color">
                    <Palette size={16} className={theme === 'dark' ? 'text-[#aaa]' : 'text-[#555]'} />
                    <input 
                      type="color" 
                      value={fillColor === 'transparent' ? '#ffffff' : fillColor} 
                      onChange={handleFillColorChange}
                      className="w-6 h-6 p-0 border-0 rounded cursor-pointer"
                    />
                  </div>
                </>
              )}

              {(activeObject.type === 'rect' || activeObject.type === 'circle') && (
                <>
                  <div className="flex items-center gap-1" title="Stroke Color">
                    <Square size={16} className={theme === 'dark' ? 'text-[#aaa]' : 'text-[#555]'} />
                    <input 
                      type="color" 
                      value={strokeColor === 'transparent' ? '#ffffff' : strokeColor} 
                      onChange={handleStrokeColorChange}
                      className="w-6 h-6 p-0 border-0 rounded cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center gap-1" title="Stroke Width">
                    <span className={`text-xs ${theme === 'dark' ? 'text-[#aaa]' : 'text-[#555]'}`}>Border:</span>
                    <input 
                      type="number" 
                      value={strokeWidth} 
                      onChange={handleStrokeWidthChange}
                      className={`w-12 px-1 py-1 rounded text-sm border ${theme === 'dark' ? 'bg-[#111] border-[#444] text-white' : 'bg-white border-[#ccc] text-black'}`}
                      min="0" max="50"
                    />
                  </div>
                </>
              )}

              {/* Common Properties */}
              <div className={`h-5 w-px mx-1 ${theme === 'dark' ? 'bg-[#444]' : 'bg-[#ccc]'}`}></div>
              
              <div className="flex items-center gap-2" title="Opacity">
                <span className={`text-xs ${theme === 'dark' ? 'text-[#aaa]' : 'text-[#555]'}`}>Opacity:</span>
                <input 
                  type="range" 
                  min="0" max="1" step="0.05" 
                  value={opacity} 
                  onChange={handleOpacityChange}
                  className="w-20"
                />
              </div>

              <div className={`h-5 w-px mx-1 ${theme === 'dark' ? 'bg-[#444]' : 'bg-[#ccc]'}`}></div>

              <button onClick={bringForward} className={iconBtnClass} title="Bring Forward">
                <ArrowUp size={16} />
              </button>
              <button onClick={sendBackward} className={iconBtnClass} title="Send Backward">
                <ArrowDown size={16} />
              </button>

              <div className={`h-5 w-px mx-1 ${theme === 'dark' ? 'bg-[#444]' : 'bg-[#ccc]'}`}></div>

              <button onClick={() => deleteSelected()} className={`p-1.5 rounded-md transition-colors ${theme === 'dark' ? 'text-red-400 hover:bg-red-500/20' : 'text-red-500 hover:bg-red-100'}`} title="Delete">
                <Trash2 size={16} />
              </button>
            </>
          ) : (
            <div className={`text-sm italic ${theme === 'dark' ? 'text-[#666]' : 'text-[#999]'}`}>
              Select an object to edit its properties
            </div>
          )}
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar (Tools) */}
          <div className={`w-16 sm:w-20 flex flex-col items-center py-4 gap-4 border-r shrink-0 overflow-y-auto ${theme === 'dark' ? 'border-[#333] bg-[#111]' : 'border-[#eee] bg-[#fafafa]'}`}>
            <input type="file" accept=".pdf,.docx,.txt" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
            <button onClick={() => fileInputRef.current?.click()} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${theme === 'dark' ? 'text-[#aaa] hover:bg-[#222] hover:text-white' : 'text-[#555] hover:bg-[#e0e0e0] hover:text-black'}`} title="Import Document">
              <Upload size={20} />
              <span className="text-[10px]">Import</span>
            </button>

            <div className={`w-10 h-px ${theme === 'dark' ? 'bg-[#333]' : 'bg-[#ddd]'}`}></div>

            <button onClick={() => addTextToCanvas()} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${theme === 'dark' ? 'text-[#aaa] hover:bg-[#222] hover:text-white' : 'text-[#555] hover:bg-[#e0e0e0] hover:text-black'}`} title="Add Text">
              <TypeIcon size={20} />
              <span className="text-[10px]">Text</span>
            </button>
            
            <button onClick={addRect} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${theme === 'dark' ? 'text-[#aaa] hover:bg-[#222] hover:text-white' : 'text-[#555] hover:bg-[#e0e0e0] hover:text-black'}`} title="Add Rectangle">
              <Square size={20} />
              <span className="text-[10px]">Rect</span>
            </button>
            
            <button onClick={addCircle} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${theme === 'dark' ? 'text-[#aaa] hover:bg-[#222] hover:text-white' : 'text-[#555] hover:bg-[#e0e0e0] hover:text-black'}`} title="Add Circle">
              <Circle size={20} />
              <span className="text-[10px]">Circle</span>
            </button>
            
            <input type="file" accept="image/*" className="hidden" ref={imageInputRef} onChange={handleImageUpload} />
            <button onClick={() => imageInputRef.current?.click()} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${theme === 'dark' ? 'text-[#aaa] hover:bg-[#222] hover:text-white' : 'text-[#555] hover:bg-[#e0e0e0] hover:text-black'}`} title="Add Image">
              <ImageIcon size={20} />
              <span className="text-[10px]">Image</span>
            </button>

            <div className={`w-10 h-px ${theme === 'dark' ? 'bg-[#333]' : 'bg-[#ddd]'}`}></div>

            <button onClick={clearCanvas} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${theme === 'dark' ? 'text-red-400 hover:bg-red-500/20' : 'text-red-500 hover:bg-red-100'}`} title="Clear Canvas">
              <X size={20} />
              <span className="text-[10px]">Clear</span>
            </button>
          </div>

          {/* Canvas Area */}
          <div className={`flex-1 overflow-auto p-4 sm:p-8 flex justify-center items-start ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-[#e5e7eb]'}`} ref={canvasContainerRef}>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00ff9d]"></div>
                <p className={theme === 'dark' ? 'text-[#aaa]' : 'text-[#666]'}>Loading Canvas...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                {pdfDoc && (
                  <div className={`flex items-center gap-4 p-2 rounded-lg ${theme === 'dark' ? 'bg-[#222]' : 'bg-white shadow-sm'}`}>
                    <button onClick={handlePrevPage} disabled={currentPage === 1} className={`${iconBtnClass} disabled:opacity-50`}>
                      <ChevronLeft size={20} />
                    </button>
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Page {currentPage} of {totalPages}</span>
                    <button onClick={handleNextPage} disabled={currentPage === totalPages} className={`${iconBtnClass} disabled:opacity-50`}>
                      <ChevronRight size={20} />
                    </button>
                  </div>
                )}
                <div className="shadow-2xl bg-white relative">
                  <canvas ref={canvasRef} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Clear Confirm Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className={`p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4 ${theme === 'dark' ? 'bg-[#1a1a1a] border border-[#333]' : 'bg-white'}`}>
            <h3 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Clear Canvas?</h3>
            <p className={`mb-6 ${theme === 'dark' ? 'text-[#aaa]' : 'text-[#666]'}`}>Are you sure you want to clear the canvas? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowClearConfirm(false)}
                className={`px-4 py-2 rounded-xl font-medium transition-colors ${theme === 'dark' ? 'bg-[#333] text-white hover:bg-[#444]' : 'bg-gray-200 text-black hover:bg-gray-300'}`}
              >
                Cancel
              </button>
              <button 
                onClick={confirmClearCanvas}
                className="px-4 py-2 rounded-xl font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {errorMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className={`p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4 ${theme === 'dark' ? 'bg-[#1a1a1a] border border-[#333]' : 'bg-white'}`}>
            <h3 className={`text-xl font-semibold mb-4 text-red-500`}>Error</h3>
            <p className={`mb-6 ${theme === 'dark' ? 'text-[#aaa]' : 'text-[#666]'}`}>{errorMessage}</p>
            <div className="flex justify-end">
              <button 
                onClick={() => setErrorMessage('')}
                className={`px-4 py-2 rounded-xl font-medium transition-colors ${theme === 'dark' ? 'bg-[#333] text-white hover:bg-[#444]' : 'bg-gray-200 text-black hover:bg-gray-300'}`}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

