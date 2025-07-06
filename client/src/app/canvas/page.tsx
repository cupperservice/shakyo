"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";

interface Stroke {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  width: number;
  isHighlighter: boolean;
}

export default function CanvasPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const groupId = searchParams.get('groupId');
  const editId = searchParams.get('editId');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [penColor, setPenColor] = useState("#000000");
  const [isEraser, setIsEraser] = useState(false);
  const [isHighlighter, setIsHighlighter] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [penWidth, setPenWidth] = useState(2);
  const [title, setTitle] = useState("Shakyo");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState("");
  
  // 通常ペンと蛍光ペンの設定を個別に記憶
  const [penSettings, setPenSettings] = useState({
    color: "#000000",
    width: 2
  });
  const [highlighterSettings, setHighlighterSettings] = useState({
    color: "#ffff00",
    width: 8
  });

  // 編集モードの場合、既存のドキュメントデータを読み込み
  useEffect(() => {
    if (editId) {
      const savedDocuments = localStorage.getItem('documents') || '[]';
      const documents = JSON.parse(savedDocuments);
      const documentToEdit = documents.find((doc: any) => doc.id === editId);
      
      if (documentToEdit) {
        setTitle(documentToEdit.title);
        // ストロークデータがあれば読み込み
        if (documentToEdit.strokes) {
          setStrokes(documentToEdit.strokes);
        }
      }
    }
  }, [editId]);

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const gridSize = 30; // 罫線の間隔（1.5倍）
    
    // 和紙のような背景色を設定
    ctx.fillStyle = "#f5f1e8"; // 和紙色
    ctx.fillRect(0, 0, width, height);
    
    // 和紙のテクスチャ効果を追加
    ctx.globalAlpha = 0.1;
    for (let i = 0; i < width; i += 2) {
      for (let j = 0; j < height; j += 2) {
        if (Math.random() > 0.5) {
          ctx.fillStyle = "#8b7355"; // 茶色のノイズ
          ctx.fillRect(i, j, 1, 1);
        }
      }
    }
    ctx.globalAlpha = 1.0;
    
    // 罫線を和紙に合わせた色に変更
    ctx.strokeStyle = "#d4c4a8"; // 薄い茶色
    ctx.lineWidth = 1;
    
    // 横線のみ描画
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 和紙のような背景色を設定
    ctx.fillStyle = "#f5f1e8"; // 和紙色
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 和紙のテクスチャ効果を追加
    ctx.globalAlpha = 0.1;
    for (let i = 0; i < canvas.width; i += 2) {
      for (let j = 0; j < canvas.height; j += 2) {
        if (Math.random() > 0.5) {
          ctx.fillStyle = "#8b7355"; // 茶色のノイズ
          ctx.fillRect(i, j, 1, 1);
        }
      }
    }
    ctx.globalAlpha = 1.0;

    // 罫線を描画
    drawGrid(ctx, canvas.width, canvas.height);

    // 全てのストロークを再描画
    strokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      
      // 蛍光ペンの場合は透明度を設定
      if (stroke.isHighlighter) {
        ctx.globalAlpha = 0.3;
      }
      
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      
      ctx.stroke();
      
      // 透明度をリセット
      ctx.globalAlpha = 1.0;
    });
  }, [strokes]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // ウィンドウサイズからcanvasサイズを計算（余白を考慮）
    const newWidth = Math.min(window.innerWidth - 100, 1200); // 最大1200px
    const newHeight = Math.min(window.innerHeight - 200, 800); // 最大800px
    
    canvas.width = newWidth;
    canvas.height = newHeight;
    setCanvasSize({ width: newWidth, height: newHeight });
    
    // キャンバスを即座に再描画
    redrawCanvas();
  }, [redrawCanvas]);

  useEffect(() => {
    // 初期サイズ設定
    resizeCanvas();
    
    // ウィンドウリサイズイベントリスナーを追加
    window.addEventListener('resize', resizeCanvas);
    
    // クリーンアップ
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [resizeCanvas]);

  // ストロークまたはキャンバスサイズが変更された時に再描画
  useEffect(() => {
    redrawCanvas();
  }, [strokes, canvasSize]);

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(e);
    
    if (isEraser) {
      // 消しゴムモード：近いストロークを削除
      const threshold = 20; // 削除判定の距離
      const newStrokes = strokes.filter(stroke => {
        return !stroke.points.some(point => {
          const distance = Math.sqrt(
            Math.pow(point.x - coords.x, 2) + Math.pow(point.y - coords.y, 2)
          );
          return distance < threshold;
        });
      });
      setStrokes(newStrokes);
    } else {
      // ペンモード：新しいストロークを開始
      const newStroke: Stroke = {
        id: Date.now().toString(),
        points: [coords],
        color: penColor,
        width: penWidth,
        isHighlighter: isHighlighter
      };
      setCurrentStroke(newStroke);
      setLastX(coords.x);
      setLastY(coords.y);
      setIsDrawing(true);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentStroke || isEraser) return;
    
    const coords = getCanvasCoordinates(e);
    
    // 現在のストロークにポイントを追加
    const updatedStroke = {
      ...currentStroke,
      points: [...currentStroke.points, coords]
    };
    setCurrentStroke(updatedStroke);
    
    // リアルタイム描画
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.strokeStyle = updatedStroke.color;
    ctx.lineWidth = updatedStroke.width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    
    // 蛍光ペンの場合は透明度を設定
    if (updatedStroke.isHighlighter) {
      ctx.globalAlpha = 0.3;
    }
    
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    
    // 透明度をリセット
    ctx.globalAlpha = 1.0;
    
    setLastX(coords.x);
    setLastY(coords.y);
  };

  const stopDrawing = () => {
    if (currentStroke && !isEraser) {
      // 現在のストロークを保存
      setStrokes(prev => [...prev, currentStroke]);
      setCurrentStroke(null);
    }
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    setStrokes([]);
    setCurrentStroke(null);
  };

  const toggleEraser = () => {
    setIsEraser(!isEraser);
  };

  const startEditingTitle = () => {
    setEditingTitle(title);
    setIsEditingTitle(true);
  };

  const saveTitle = () => {
    if (editingTitle.trim()) {
      setTitle(editingTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const cancelTitleEdit = () => {
    setIsEditingTitle(false);
  };

  const presetColors = [
    "#000000", // 黒
    "#ff0000", // 赤
    "#00ff00", // 緑
    "#0000ff", // 青
    "#ffff00", // 黄
  ];

  const presetWidths = [1, 2, 4, 6, 8];
  const highlighterWidths = [4, 8, 12, 16, 20]; // 蛍光ペン用の太い太さ

  // 色変更
  const handleColorChange = (color: string) => {
    setPenColor(color);
    if (isHighlighter) {
      setHighlighterSettings((prev) => ({ ...prev, color }));
    } else {
      setPenSettings((prev) => ({ ...prev, color }));
    }
  };

  // 太さ変更
  const handleWidthChange = (width: number) => {
    setPenWidth(width);
    if (isHighlighter) {
      setHighlighterSettings((prev) => ({ ...prev, width }));
    } else {
      setPenSettings((prev) => ({ ...prev, width }));
    }
  };

  const handleBackToHome = () => {
    // ストロークがある場合のみドキュメントを保存
    if (strokes.length > 0) {
      const savedDocuments = JSON.parse(localStorage.getItem('documents') || '[]');
      
      if (editId) {
        // 編集モード：既存のドキュメントを更新
        const updatedDocuments = savedDocuments.map((doc: any) => {
          if (doc.id === editId) {
            return {
              ...doc,
              title: title,
              updatedAt: new Date().toISOString(),
              strokeCount: strokes.length,
              strokes: strokes // ストロークデータも保存
            };
          }
          return doc;
        });
        localStorage.setItem('documents', JSON.stringify(updatedDocuments));
      } else {
        // 新規作成モード：新しいドキュメントを追加
        const newDocument = {
          id: Date.now().toString(),
          title: title,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          strokeCount: strokes.length,
          groupId: groupId || '1-2', // デフォルトは会議・ミーティング
          strokes: strokes // ストロークデータも保存
        };
        
        savedDocuments.push(newDocument);
        localStorage.setItem('documents', JSON.stringify(savedDocuments));
      }
      
      // 選択されたグループIDも保存
      if (groupId) {
        localStorage.setItem('selectedGroupId', groupId);
      }
    }
    
    router.push('/');
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen relative">
        {/* 左上に配置する戻るボタン */}
        <div className="absolute top-4 left-4 z-10">
          <button
            onClick={handleBackToHome}
            className="rounded-full border border-solid border-gray-300 text-white bg-black hover:bg-gray-800 transition-colors flex items-center justify-center font-medium text-sm h-8 w-8 shadow"
            title="前のページに戻る"
          >
            ←
          </button>
        </div>

        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          {/* タイトル（編集可能） */}
          <div className="mb-4">
            {isEditingTitle ? (
              <input
                type="text"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveTitle();
                  if (e.key === 'Escape') cancelTitleEdit();
                }}
                className="text-2xl font-bold text-center bg-white border border-gray-300 rounded px-2 py-1 text-gray-900"
                autoFocus
              />
            ) : (
              <h1 
                className="text-2xl font-bold text-white cursor-pointer hover:text-gray-200 transition-colors"
                onClick={startEditingTitle}
                title="クリックしてタイトルを編集"
              >
                {title}
              </h1>
            )}
          </div>
          
          {/* ツールバー */}
          <div className="mb-4 flex gap-4 items-center flex-wrap justify-center">
            {/* ペン/蛍光ペン/消しゴム切り替え */}
            <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 p-1">
              <button
                onClick={() => {
                  setIsEraser(false);
                  setIsHighlighter(false);
                  // 通常ペンモードに切り替えた時は前の設定を復元
                  setPenColor(penSettings.color);
                  setPenWidth(penSettings.width);
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  !isEraser && !isHighlighter
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                ✏️
              </button>
              <button
                onClick={() => {
                  setIsEraser(false);
                  setIsHighlighter(true);
                  // 蛍光ペンモードに切り替えた時は前の設定を復元
                  setPenColor(highlighterSettings.color);
                  setPenWidth(highlighterSettings.width);
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isHighlighter
                    ? 'bg-yellow-500 text-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                🖍️
              </button>
              <button
                onClick={() => {
                  setIsEraser(true);
                  setIsHighlighter(false);
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isEraser 
                    ? 'bg-gray-600 text-white' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                🧽
              </button>
            </div>
            
            {/* ペンの太さプリセット */}
            <div className="flex gap-1">
              {(isHighlighter ? highlighterWidths : presetWidths).map((width) => (
                <button
                  key={width}
                  onClick={() => handleWidthChange(width)}
                  disabled={isEraser}
                  className={`flex items-center justify-center rounded border-2 transition-all ${
                    penWidth === width && !isEraser ? 'border-blue-600 bg-blue-100' : 'border-gray-300 hover:bg-gray-100'
                  } ${isEraser ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={{ 
                    width: `${Math.max(20, (isHighlighter ? 4 : width) * 2)}px`, 
                    height: `${Math.max(20, (isHighlighter ? 4 : width) * 2)}px` 
                  }}
                  title={`太さ: ${width}px`}
                >
                  <div 
                    className="rounded-full"
                    style={{ 
                      width: `${width}px`, 
                      height: `${width}px`,
                      backgroundColor: penColor
                    }}
                  />
                </button>
              ))}
            </div>
            
            {/* カラーピッカー（消しゴムモードでは無効化） */}
            <div className="flex items-center gap-2">
              <input
                id="colorPicker"
                type="color"
                value={penColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
                disabled={isEraser}
              />
            </div>
            
            {/* プリセットカラー（消しゴムモードでは無効化） */}
            <div className="flex gap-1">
              {presetColors.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorChange(color)}
                  disabled={isEraser}
                  className={`w-6 h-6 rounded border-2 transition-all ${
                    penColor === color && !isEraser ? 'border-gray-800 scale-110' : 'border-gray-300 hover:scale-105'
                  } ${isEraser ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={{ backgroundColor: color }}
                  title={`色: ${color}`}
                />
              ))}
            </div>
          </div>
          
          <canvas
            ref={canvasRef}
            className={`border border-gray-300 rounded shadow bg-[#f5f1e8] ${
              isEraser 
                ? 'cursor-eraser' 
                : isHighlighter 
                  ? 'cursor-highlighter' 
                  : 'cursor-pen'
            }`}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
} 