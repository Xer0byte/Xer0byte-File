import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import jsPDF from 'jspdf';
import { Type, Download, ChevronLeft, ChevronRight, X, Eraser, Trash2 } from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface VisualPdfEditorProps {
  file: File;
  theme: 'dark' | 'light';
  onClose: () => void;
}

export function VisualPdfEditor({ file, theme, onClose }: VisualPdfEditorProps) {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [scale, setScale] = useState(1.5);

  useEffect(() => {
    const loadPdf = async () => {
      try {
        setIsLoading(true);
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        await renderPage(pdf, 1, scale);
      } catch (err) {
        console.error('Error loading PDF:', err);
        alert('Failed to load PDF file.');
        onClose();
      }
    };
    loadPdf();
    
    return () => {
      if (fabricCanvas) {
        fabricCanvas.dispose();
      }
    };
  }, [file]);

  const renderPage = async (pdf: any, pageNum: number, currentScale: number) => {
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

      if (canvasRef.current) {
        let fCanvas = fabricCanvas;
        if (!fCanvas) {
          fCanvas = new fabric.Canvas(canvasRef.current, {
            width: viewport.width,
            height: viewport.height,
            selection: true,
            preserveObjectStacking: true,
          });
          setFabricCanvas(fCanvas);
        } else {
          fCanvas.clear();
          fCanvas.setWidth(viewport.width);
          fCanvas.setHeight(viewport.height);
        }

        fabric.Image.fromURL(tempCanvas.toDataURL(), (img) => {
          fCanvas!.setBackgroundImage(img, fCanvas!.renderAll.bind(fCanvas));
          setIsLoading(false);
        });
      }
    } catch (err) {
      console.error('Error rendering page:', err);
      setIsLoading(false);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1 && pdfDoc) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      renderPage(pdfDoc, newPage, scale);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages && pdfDoc) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      renderPage(pdfDoc, newPage, scale);
    }
  };

  const addText = () => {
    if (!fabricCanvas) return;
    const text = new fabric.IText('Type here...', {
      left: 100,
      top: 100,
      fontFamily: 'Arial',
      fill: '#000000',
      fontSize: 20 * scale,
      padding: 5,
      transparentCorners: false,
      cornerColor: '#00ff9d',
      cornerStrokeColor: '#000',
      borderColor: '#00ff9d',
      cornerSize: 10,
    });
    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    fabricCanvas.renderAll();
  };

  const addWhiteout = () => {
    if (!fabricCanvas) return;
    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      fill: '#ffffff',
      width: 150 * scale,
      height: 30 * scale,
      strokeWidth: 0,
      transparentCorners: false,
      cornerColor: '#00ff9d',
      cornerStrokeColor: '#000',
      borderColor: '#00ff9d',
      cornerSize: 10,
    });
    fabricCanvas.add(rect);
    fabricCanvas.setActiveObject(rect);
    fabricCanvas.renderAll();
  };

  const deleteSelected = () => {
    if (!fabricCanvas) return;
    const activeObjects = fabricCanvas.getActiveObjects();
    if (activeObjects.length) {
      fabricCanvas.discardActiveObject();
      activeObjects.forEach((obj) => {
        fabricCanvas.remove(obj);
      });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (fabricCanvas) {
          const activeObj = fabricCanvas.getActiveObject();
          if (activeObj && activeObj.type !== 'i-text' || (activeObj && activeObj.type === 'i-text' && !(activeObj as fabric.IText).isEditing)) {
             deleteSelected();
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fabricCanvas]);

  const downloadPdf = () => {
    if (!fabricCanvas) return;
    
    // Deselect all before saving
    fabricCanvas.discardActiveObject();
    fabricCanvas.renderAll();

    const dataUrl = fabricCanvas.toDataURL({ format: 'jpeg', quality: 1 });
    
    const pdf = new jsPDF({
      orientation: fabricCanvas.width! > fabricCanvas.height! ? 'landscape' : 'portrait',
      unit: 'px',
      format: [fabricCanvas.width!, fabricCanvas.height!]
    });
    
    pdf.addImage(dataUrl, 'JPEG', 0, 0, fabricCanvas.width!, fabricCanvas.height!);
    pdf.save(`edited_${file.name}`);
  };

  return (
    <div className={`flex flex-col h-full w-full ${theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-[#f3f4f6] text-black'}`}>
      {/* Toolbar */}
      <div className={`flex items-center justify-between p-4 border-b ${theme === 'dark' ? 'border-[#333] bg-[#1a1a1a]' : 'border-gray-200 bg-white'}`}>
        <div className="flex items-center space-x-4">
          <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors" title="Close">
            <X size={20} />
          </button>
          <span className="font-medium truncate max-w-[200px]">{file.name}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button onClick={addText} className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors" title="Add Text">
            <Type size={18} />
            <span className="text-sm hidden sm:inline">Add Text</span>
          </button>
          <button onClick={addWhiteout} className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors" title="Whiteout (Hide existing text)">
            <Eraser size={18} />
            <span className="text-sm hidden sm:inline">Whiteout</span>
          </button>
          <button onClick={deleteSelected} className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-red-100 text-red-500 dark:hover:bg-red-900/30 transition-colors" title="Delete Selected">
            <Trash2 size={18} />
          </button>
          
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-2"></div>
          
          <button onClick={handlePrevPage} disabled={currentPage === 1} className="p-2 disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm w-24 text-center">Page {currentPage} / {totalPages}</span>
          <button onClick={handleNextPage} disabled={currentPage === totalPages} className="p-2 disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>

        <button 
          onClick={downloadPdf}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${theme === 'dark' ? 'bg-[#00ff9d] text-black hover:bg-[#00cc7d]' : 'bg-[#006633] text-white hover:bg-[#004d26]'}`}
        >
          <Download size={18} />
          <span className="hidden sm:inline">Download PDF</span>
        </button>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 overflow-auto p-8 flex justify-center items-start bg-gray-200 dark:bg-[#111]" ref={canvasContainerRef}>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00ff9d]"></div>
            <p className="text-gray-500">Loading PDF Page...</p>
          </div>
        ) : (
          <div className="shadow-2xl bg-white relative">
            <canvas ref={canvasRef} />
          </div>
        )}
      </div>
    </div>
  );
}
