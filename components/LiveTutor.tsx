
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { 
  Mic, MicOff, PhoneOff, Zap, PenTool, Eraser, Trash2, Download, 
  Share2, MessageSquareText, Activity, Undo2, Redo2, Users, Inbox, 
  X, Check, Send, User, ChevronRight, MousePointer2, Radio, Signal
} from 'lucide-react';
import { blobToBase64, base64ToUint8Array, floatTo16BitPCM, arrayBufferToBase64 } from '../services/ai';
import { STUDENTS } from '../constants';

// Helper to downsample audio to 16kHz
function resampleTo16k(audioData: Float32Array, origSampleRate: number): Float32Array {
  if (origSampleRate === 16000) return audioData;
  const targetSampleRate = 16000;
  const ratio = origSampleRate / targetSampleRate;
  const newLength = Math.round(audioData.length / ratio);
  const result = new Float32Array(newLength);
  
  for (let i = 0; i < newLength; i++) {
      const originalIndex = i * ratio;
      const index1 = Math.floor(originalIndex);
      const index2 = Math.ceil(originalIndex);
      const weight = originalIndex - index1;
      const val1 = audioData[index1] || 0;
      const val2 = audioData[index2] || 0;
      result[i] = val1 * (1 - weight) + val2 * weight;
  }
  return result;
}

// Tool Definition for AI Drawing
const whiteboardTool: FunctionDeclaration = {
  name: 'drawOnWhiteboard',
  description: 'Draw on the student\'s whiteboard to explain concepts. Use 0-100 coordinate system (percentage of screen).',
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: { type: Type.STRING, enum: ['line', 'rect', 'text', 'clear'], description: 'Type of drawing action' },
      x1: { type: Type.NUMBER, description: 'Start X (0-100)' },
      y1: { type: Type.NUMBER, description: 'Start Y (0-100)' },
      x2: { type: Type.NUMBER, description: 'End X (0-100) or Width' },
      y2: { type: Type.NUMBER, description: 'End Y (0-100) or Height' },
      text: { type: Type.STRING, description: 'Text content for text action' },
      color: { type: Type.STRING, description: 'Hex color code' }
    },
    required: ['action']
  }
};

export const LiveTutor: React.FC = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    
    // Whiteboard State
    const [wbColor, setWbColor] = useState('#000000'); // Default black
    const [wbTool, setWbTool] = useState<'pen' | 'eraser'>('pen');
    
    // History State
    const [history, setHistory] = useState<ImageData[]>([]);
    const [historyStep, setHistoryStep] = useState(-1);

    // Collaboration State
    const [myId] = useState(Math.random().toString(36).substr(2, 9));
    const [collaborators, setCollaborators] = useState<Record<string, {x: number, y: number, color: string, name: string, lastActive: number}>>({});
    const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

    // Sharing & Inbox State
    const [showInbox, setShowInbox] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [inboxItems, setInboxItems] = useState([
        { 
            id: 101, 
            sender: 'Dr. S. Rao', 
            role: 'Faculty',
            subject: 'Calculus Reference Graph', 
            time: '10:30 AM', 
            read: false,
            // Functional base64 image (Simple chart)
            image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAACWCAYAAAA8AXHiAAAACXBIWXMAAAsTAAALEwEAmpwYAAACx0lEQVR4nO3dMW7CQBCA4V0lCq6QczhH4Bw5J+EKnIMoEopyB0R0tJAsS/wT2w4zv5f2i5aF/Xn22rI7s67rGkR12643gLAIlrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAImrAIms67r+v78R+8t+A1E0uYx/oY6JAAAAAElFTkSuQmCC'
        }
    ]);
    const [toast, setToast] = useState<{msg: string, type: 'success' | 'info'} | null>(null);
    
    // AI Feedback State
    const [aiState, setAiState] = useState<'idle' | 'listening' | 'speaking'>('idle');
    const [transcript, setTranscript] = useState<string>('');

    const whiteboardCanvasRef = useRef<HTMLCanvasElement>(null);
    const hasUnsentChangesRef = useRef(false);
    
    const audioCtxRef = useRef<AudioContext | null>(null);
    const inputCtxRef = useRef<AudioContext | null>(null);
    const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sessionRef = useRef<Promise<any> | null>(null); 
    
    // Playback state
    const nextStartTimeRef = useRef<number>(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    // Refs for closures
    const isMutedRef = useRef(false);

    useEffect(() => {
        isMutedRef.current = isMuted;
    }, [isMuted]);

    // Drawing Refs
    const isDrawingRef = useRef(false);
    const lastPosRef = useRef({ x: 0, y: 0 });

    // Streaming Interval
    const streamIntervalRef = useRef<number | null>(null);

    // --- Collaboration Setup ---
    useEffect(() => {
        const channel = new BroadcastChannel('axiom_live_whiteboard');
        broadcastChannelRef.current = channel;

        channel.onmessage = (event) => {
            const { type, payload, userId, userName, userColor } = event.data;
            if (userId === myId) return; // Ignore self

            if (type === 'CURSOR_MOVE') {
                 setCollaborators(prev => ({
                     ...prev,
                     [userId]: { x: payload.x, y: payload.y, color: userColor, name: userName, lastActive: Date.now() }
                 }));
            } else if (type === 'DRAW_SEGMENT') {
                const canvas = whiteboardCanvasRef.current;
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;
                
                const { from, to, color, tool } = payload;
                
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                if (tool === 'eraser') {
                     ctx.globalCompositeOperation = 'destination-out';
                     ctx.lineWidth = 20;
                } else {
                     ctx.globalCompositeOperation = 'source-over';
                     ctx.strokeStyle = color;
                     ctx.lineWidth = 3;
                }
                
                ctx.beginPath();
                ctx.moveTo(from.x, from.y);
                ctx.lineTo(to.x, to.y);
                ctx.stroke();
                ctx.globalCompositeOperation = 'source-over';
                
                hasUnsentChangesRef.current = true;
            } else if (type === 'CLEAR') {
                const canvas = whiteboardCanvasRef.current;
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
                    saveHistory();
                }
            }
        };

        // Clean up inactive cursors
        const interval = setInterval(() => {
            const now = Date.now();
            setCollaborators(prev => {
                const next = { ...prev };
                let changed = false;
                Object.keys(next).forEach(key => {
                    if (now - next[key].lastActive > 5000) {
                        delete next[key];
                        changed = true;
                    }
                });
                return changed ? next : prev;
            });
        }, 1000);

        return () => {
            channel.close();
            clearInterval(interval);
        };
    }, [myId]);

    // --- History Management ---
    const saveHistory = () => {
        const canvas = whiteboardCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        setHistory(prev => {
            const newHistory = prev.slice(0, historyStep + 1);
            // Limit history size to 20 to prevent memory issues
            if (newHistory.length > 20) newHistory.shift();
            return [...newHistory, imageData];
        });
        setHistoryStep(prev => {
            const newStep = prev + 1;
            return newStep > 20 ? 20 : newStep;
        });
    };

    const undo = () => {
        if (historyStep > 0) {
            const newStep = historyStep - 1;
            setHistoryStep(newStep);
            restoreCanvas(history[newStep]);
        }
    };

    const redo = () => {
        if (historyStep < history.length - 1) {
            const newStep = historyStep + 1;
            setHistoryStep(newStep);
            restoreCanvas(history[newStep]);
        }
    };

    const restoreCanvas = (imageData: ImageData) => {
        const canvas = whiteboardCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.putImageData(imageData, 0, 0);
            hasUnsentChangesRef.current = true;
        }
    };

    // Initialize history with blank canvas
    useEffect(() => {
        // Short delay to ensure canvas is mounted
        const timer = setTimeout(() => {
            if (whiteboardCanvasRef.current && history.length === 0) {
                saveHistory(); 
            }
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    // --- Toast Helper ---
    const showToast = (msg: string, type: 'success' | 'info' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    // --- Sharing Logic ---
    const handleShareToStudent = (studentName: string) => {
        // Mock sending action
        setShowShareModal(false);
        showToast(`Sent drawing to ${studentName}`, 'success');
        // In a real app, this would upload the image to a backend
    };

    const handleLoadFromInbox = (item: typeof inboxItems[0]) => {
        const canvas = whiteboardCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.onload = () => {
            // Overwrite canvas with loaded image
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            // Add text to indicate load
            ctx.font = '20px "Space Mono", monospace';
            ctx.fillStyle = '#64748b';
            ctx.fillText(`Loaded: ${item.subject}`, 20, 30);
            
            saveHistory();
            hasUnsentChangesRef.current = true;
            
            // Mark as read
            setInboxItems(prev => prev.map(i => i.id === item.id ? { ...i, read: true } : i));
            setShowInbox(false);
            showToast("Drawing loaded from Inbox");
        };
        img.onerror = () => {
            showToast("Failed to load image", 'info');
        };
        img.src = item.image;
    };


    // Whiteboard Drawing Logic (Local)
    const getCanvasCoordinates = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = whiteboardCanvasRef.current;
        if (!canvas) return;
        
        isDrawingRef.current = true;
        lastPosRef.current = getCanvasCoordinates(e, canvas);
    };

    const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = whiteboardCanvasRef.current;
        if (!canvas) return;
        
        const { x, y } = getCanvasCoordinates(e, canvas);
        
        // Broadcast cursor
        if (broadcastChannelRef.current) {
            broadcastChannelRef.current.postMessage({
                type: 'CURSOR_MOVE',
                userId: myId,
                userName: 'Jayesh', // Hardcoded as current user
                userColor: wbColor,
                payload: { x, y }
            });
        }

        // Drawing Logic
        if (isDrawingRef.current) {
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            if (wbTool === 'eraser') {
                ctx.globalCompositeOperation = 'destination-out';
                ctx.lineWidth = 20;
            } else {
                ctx.globalCompositeOperation = 'source-over';
                ctx.strokeStyle = wbColor;
                ctx.lineWidth = 3;
            }

            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.beginPath();
            ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
            ctx.lineTo(x, y);
            ctx.stroke();
            
            ctx.globalCompositeOperation = 'source-over';

            // Broadcast Draw
            if (broadcastChannelRef.current) {
                broadcastChannelRef.current.postMessage({
                    type: 'DRAW_SEGMENT',
                    userId: myId,
                    payload: { from: lastPosRef.current, to: {x,y}, color: wbColor, tool: wbTool }
                });
            }

            lastPosRef.current = { x, y };
            hasUnsentChangesRef.current = true; 
        }
    };

    const stopDrawing = () => {
        if (isDrawingRef.current) {
            isDrawingRef.current = false;
            saveHistory(); // Save state on mouse up
        }
    };

    // AI Drawing Execution
    const executeAiDrawing = (args: any) => {
        const canvas = whiteboardCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const w = canvas.width;
        const h = canvas.height;

        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = args.color || '#4F46E5'; 
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const drawHandwrittenLine = (x1: number, y1: number, x2: number, y2: number) => {
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            
            const length = Math.hypot(x2 - x1, y2 - y1);
            if (length > 20) {
                const deviation = Math.min(length * 0.05, 15) * (Math.random() < 0.5 ? 1 : -1);
                const midX = (x1 + x2) / 2 + (Math.random() - 0.5) * 5; 
                const midY = (y1 + y2) / 2 + (Math.random() - 0.5) * 5;
                
                ctx.quadraticCurveTo(midX + deviation, midY + deviation, x2, y2);
            } else {
                ctx.lineTo(x2, y2);
            }
            ctx.stroke();
        };

        if (args.action === 'clear') {
            ctx.clearRect(0, 0, w, h);
            if (broadcastChannelRef.current) {
                 broadcastChannelRef.current.postMessage({ type: 'CLEAR', userId: myId });
            }
        } else if (args.action === 'line') {
            drawHandwrittenLine((args.x1 / 100) * w, (args.y1 / 100) * h, (args.x2 / 100) * w, (args.y2 / 100) * h);
        } else if (args.action === 'rect') {
             const x1 = (args.x1 / 100) * w;
             const y1 = (args.y1 / 100) * h;
             const x2 = (args.x2 / 100) * w;
             const y2 = (args.y2 / 100) * h;
             
             drawHandwrittenLine(x1, y1, x2, y1); 
             drawHandwrittenLine(x2, y1, x2, y2); 
             drawHandwrittenLine(x2, y2, x1, y2); 
             drawHandwrittenLine(x1, y2, x1, y1); 
        } else if (args.action === 'text') {
            ctx.fillStyle = args.color || '#000000';
            ctx.font = '28px "Permanent Marker", cursive'; 
            ctx.fillText(args.text || '', (args.x1 / 100) * w, (args.y1 / 100) * h);
        }
        hasUnsentChangesRef.current = true;
        saveHistory(); // Save after AI operation
    };

    const handleSave = () => {
        const canvas = whiteboardCanvasRef.current;
        if (!canvas) return;
        
        const link = document.createElement('a');
        link.download = `axiom-tutor-${Date.now()}.png`;
        
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tCtx = tempCanvas.getContext('2d');
        if (tCtx) {
            tCtx.fillStyle = '#ffffff';
            tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            tCtx.drawImage(canvas, 0, 0);
            link.href = tempCanvas.toDataURL('image/png');
            link.click();
        }
    };

    const handleExternalShare = async () => {
        const canvas = whiteboardCanvasRef.current;
        if (!canvas) return;
        
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tCtx = tempCanvas.getContext('2d');
        if (!tCtx) return;
        
        tCtx.fillStyle = '#ffffff';
        tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        tCtx.drawImage(canvas, 0, 0);

        tempCanvas.toBlob(async (blob) => {
            if (!blob) return;
            try {
                if (navigator.share) {
                    await navigator.share({
                        files: [new File([blob], 'axiom-notes.png', { type: 'image/png' })]
                    });
                } else {
                    const item = new ClipboardItem({ "image/png": blob });
                    await navigator.clipboard.write([item]);
                    showToast("Copied to clipboard");
                }
            } catch (e) {
                console.error("Share failed", e);
            }
        });
    };

    const disconnect = async () => {
        if (sessionRef.current) {
            const currentSessionPromise = sessionRef.current;
            sessionRef.current = null;
            try {
                const session = await currentSessionPromise;
                session.close();
            } catch (e) {
                console.error("Error closing session:", e);
            }
        }
        
        if (audioCtxRef.current) {
            if (audioCtxRef.current.state !== 'closed') {
                try {
                    await audioCtxRef.current.close();
                } catch(e) {
                    console.error("Error closing audioCtx:", e);
                }
            }
            audioCtxRef.current = null;
        }

        if (inputCtxRef.current) {
            if (inputCtxRef.current.state !== 'closed') {
                try {
                    await inputCtxRef.current.close();
                } catch(e) {
                     console.error("Error closing inputCtx:", e);
                }
            }
            inputCtxRef.current = null;
        }
        
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }
        if (inputSourceRef.current) {
            inputSourceRef.current.disconnect();
            inputSourceRef.current = null;
        }
        if (streamIntervalRef.current) {
            clearInterval(streamIntervalRef.current);
            streamIntervalRef.current = null;
        }
        
        sourcesRef.current.forEach(s => {
            try { s.stop(); } catch(e) {}
        });
        sourcesRef.current.clear();

        setIsConnected(false);
        setAiState('idle');
        setTranscript(''); 
        hasUnsentChangesRef.current = false;
    };

    const connect = async () => {
        await disconnect(); 

        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            alert("API Key missing");
            return;
        }

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContextClass(); 
        audioCtxRef.current = audioCtx;
        
        const inputStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const inputCtx = new AudioContextClass(); 
        inputCtxRef.current = inputCtx;
        
        await audioCtx.resume();
        await inputCtx.resume();

        const inputSource = inputCtx.createMediaStreamSource(inputStream);
        const processor = inputCtx.createScriptProcessor(2048, 1, 1);
        
        inputSourceRef.current = inputSource;
        processorRef.current = processor;

        inputSource.connect(processor);
        processor.connect(inputCtx.destination);

        const client = new GoogleGenAI({ apiKey });
        
        const sessionPromise = client.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            callbacks: {
                onopen: () => {
                    console.log("AXIOM LIVE: Connected");
                    setIsConnected(true);
                    setAiState('listening');
                    setTranscript("Connected. Say 'Hello' to start!");
                    
                    hasUnsentChangesRef.current = true;

                    // Increased interval to 200ms to avoid network congestion (Network Error)
                    streamIntervalRef.current = window.setInterval(() => {
                        if (whiteboardCanvasRef.current && hasUnsentChangesRef.current) {
                            const sourceCanvas = whiteboardCanvasRef.current;
                            const scale = Math.min(1, 640 / sourceCanvas.width);
                            const targetWidth = sourceCanvas.width * scale;
                            const targetHeight = sourceCanvas.height * scale;

                            const tempCanvas = document.createElement('canvas');
                            tempCanvas.width = targetWidth;
                            tempCanvas.height = targetHeight;
                            const ctx = tempCanvas.getContext('2d');
                            
                            if (ctx) {
                                ctx.fillStyle = '#ffffff';
                                ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
                                ctx.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight);
                                
                                tempCanvas.toBlob(async (blob) => {
                                    if (blob) {
                                        const base64Data = await blobToBase64(blob);
                                        // Check if session is still the active one
                                        if (sessionRef.current === sessionPromise) {
                                            sessionPromise.then(session => {
                                                try {
                                                    session.sendRealtimeInput({
                                                        media: { data: base64Data, mimeType: 'image/jpeg' }
                                                    });
                                                } catch(e) {
                                                    console.warn("Failed to send video frame", e);
                                                }
                                            });
                                            hasUnsentChangesRef.current = false;
                                        }
                                    }
                                }, 'image/jpeg', 0.4); 
                            }
                        }
                    }, 200); 
                },
                onmessage: async (message: LiveServerMessage) => {
                    if (message.toolCall) {
                        sessionPromise.then(session => {
                            const functionResponses = message.toolCall!.functionCalls.map(fc => {
                                if (fc.name === 'drawOnWhiteboard') {
                                    try {
                                        executeAiDrawing(fc.args);
                                        return {
                                            id: fc.id,
                                            name: fc.name,
                                            response: { result: 'success' }
                                        };
                                    } catch (e) {
                                        console.error(e);
                                        return {
                                            id: fc.id,
                                            name: fc.name,
                                            response: { error: 'drawing failed' }
                                        };
                                    }
                                }
                                return {
                                    id: fc.id,
                                    name: fc.name,
                                    response: { error: 'tool not found' }
                                };
                            });

                            session.sendToolResponse({
                                functionResponses: functionResponses
                            });
                        });
                    }

                    const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                    if (base64Audio && audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
                        setAiState('speaking'); // Update state immediately when audio receives
                        
                        const ctx = audioCtxRef.current;
                        const audioData = base64ToUint8Array(base64Audio);
                        const dataInt16 = new Int16Array(audioData.buffer);
                        const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
                        const channelData = buffer.getChannelData(0);
                        for (let i = 0; i < dataInt16.length; i++) {
                            channelData[i] = dataInt16[i] / 32768.0;
                        }

                        const source = ctx.createBufferSource();
                        source.buffer = buffer;
                        source.connect(ctx.destination);
                        
                        const currentTime = ctx.currentTime;
                        if (nextStartTimeRef.current < currentTime) {
                            nextStartTimeRef.current = currentTime;
                        }
                        source.start(nextStartTimeRef.current);
                        nextStartTimeRef.current += buffer.duration;
                        
                        sourcesRef.current.add(source);
                        source.onended = () => {
                            sourcesRef.current.delete(source);
                            if (sourcesRef.current.size === 0) {
                                setAiState('listening');
                            }
                        };
                    }

                    if (message.serverContent?.interrupted) {
                        sourcesRef.current.forEach(s => s.stop());
                        sourcesRef.current.clear();
                        nextStartTimeRef.current = 0;
                        setAiState('listening');
                    }
                },
                onclose: () => {
                    disconnect();
                },
                onerror: (err) => {
                    console.error("AXIOM LIVE Error:", err);
                    disconnect();
                    setTranscript("Connection Error. Please retry.");
                }
            },
            config: {
                tools: [{ functionDeclarations: [whiteboardTool] }],
                responseModalities: [Modality.AUDIO],
                // outputAudioTranscription removed to prevent Network Error
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
                },
                systemInstruction: "You are AXIOM. 1) Use 'drawOnWhiteboard' for all visuals. 2) Speak briefly. 3) Use 'action: text' for text.",
                temperature: 0.4
            }
        });
        
        processor.onaudioprocess = (e) => {
            if (isMutedRef.current || !sessionRef.current) return;
            const inputData = e.inputBuffer.getChannelData(0);
            
            const resampledData = resampleTo16k(inputData, inputCtx.sampleRate);
            const pcmBuffer = floatTo16BitPCM(resampledData);
            const base64String = arrayBufferToBase64(pcmBuffer);
            
            sessionPromise.then(session => {
                if (sessionRef.current === sessionPromise) {
                     session.sendRealtimeInput({
                        media: { mimeType: 'audio/pcm;rate=16000', data: base64String }
                    });
                }
            });
        };
        
        sessionRef.current = sessionPromise;
    };

    const clearWhiteboard = () => {
        const canvas = whiteboardCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (broadcastChannelRef.current) {
             broadcastChannelRef.current.postMessage({ type: 'CLEAR', userId: myId });
        }
        
        hasUnsentChangesRef.current = true;
        saveHistory();
    };

    return (
        <div className="h-full flex flex-col bg-white relative overflow-hidden border-2 border-slate-900 shadow-hard">
            {/* Toast Notification */}
            {toast && (
                <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full font-bold uppercase shadow-hard text-sm animate-in fade-in slide-in-from-top-4 ${toast.type === 'success' ? 'bg-green-400 text-slate-900' : 'bg-neo-blue text-white'}`}>
                    {toast.msg}
                </div>
            )}

            {/* Inbox Modal */}
            {showInbox && (
                <div className="absolute inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg border-2 border-slate-900 shadow-hard flex flex-col max-h-[80vh]">
                        <div className="p-4 border-b-2 border-slate-900 flex justify-between items-center bg-slate-100">
                            <h3 className="font-black uppercase flex items-center gap-2"><Inbox size={20} /> Class Mailbox</h3>
                            <button onClick={() => setShowInbox(false)}><X size={20} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                            {inboxItems.length === 0 ? (
                                <p className="text-center p-8 font-mono text-slate-500">Inbox is empty.</p>
                            ) : (
                                inboxItems.map(item => (
                                    <div key={item.id} onClick={() => handleLoadFromInbox(item)} className="p-3 border-2 border-slate-900 hover:bg-slate-50 cursor-pointer flex gap-3 items-center group relative">
                                        <div className="w-16 h-12 bg-slate-200 border border-slate-900 overflow-hidden shrink-0">
                                            <img src={item.image} alt="preview" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between">
                                                <h4 className={`font-bold text-sm uppercase truncate ${!item.read ? 'text-neo-blue' : ''}`}>{item.subject}</h4>
                                                <span className="text-[10px] font-mono text-slate-500">{item.time}</span>
                                            </div>
                                            <p className="text-xs font-mono text-slate-600 truncate">From: {item.sender} ({item.role})</p>
                                        </div>
                                        {!item.read && <div className="w-2 h-2 bg-neo-blue rounded-full"></div>}
                                        <div className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Download size={16} className="text-slate-900" />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Share Modal */}
            {showShareModal && (
                <div className="absolute inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md border-2 border-slate-900 shadow-hard flex flex-col max-h-[70vh]">
                        <div className="p-4 border-b-2 border-slate-900 flex justify-between items-center bg-slate-100">
                            <h3 className="font-black uppercase flex items-center gap-2"><Users size={20} /> Share with Class</h3>
                            <button onClick={() => setShowShareModal(false)}><X size={20} /></button>
                        </div>
                        <div className="p-3 border-b border-slate-200 bg-yellow-50">
                            <p className="text-xs font-mono font-bold flex items-center gap-2 text-yellow-800">
                                <Signal size={14} className="animate-pulse" />
                                Real-time sync active. Changes are broadcast to connected peers.
                            </p>
                        </div>
                        <div className="p-2">
                             <input type="text" placeholder="SEARCH STUDENTS..." className="w-full p-2 border-2 border-slate-900 font-mono text-sm mb-2" />
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {STUDENTS.map(s => (
                                <button key={s.id} onClick={() => handleShareToStudent(s.name)} className="w-full p-3 border-2 border-transparent hover:border-slate-900 hover:bg-slate-50 flex items-center justify-between group text-left">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-neo-yellow border border-slate-900 flex items-center justify-center font-bold text-xs">{s.name.charAt(0)}</div>
                                        <div>
                                            <p className="font-bold text-sm uppercase">{s.name}</p>
                                            <p className="text-[10px] font-mono text-slate-500">ID: {s.rollNumber}</p>
                                        </div>
                                    </div>
                                    <Send size={16} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-900" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Dot Grid Background */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-20" style={{
                backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)',
                backgroundSize: '20px 20px'
            }}></div>

            {/* Render Remote Cursors */}
            {Object.entries(collaborators).map(([id, cursor]) => (
                <div 
                    key={id}
                    className="absolute z-30 pointer-events-none transition-transform duration-75"
                    style={{ 
                        left: `${(cursor.x / 1200) * 100}%`, 
                        top: `${(cursor.y / 800) * 100}%`,
                        transform: 'translate(-50%, -50%)'
                    }}
                >
                    <div className="relative">
                        <MousePointer2 
                            size={20} 
                            fill={cursor.color} 
                            color="#000" 
                            className="drop-shadow-sm transform -rotate-12"
                        />
                        <div 
                            className="absolute left-4 top-4 px-2 py-0.5 text-[10px] font-bold text-white uppercase rounded shadow-sm whitespace-nowrap"
                            style={{ backgroundColor: cursor.color }}
                        >
                            {cursor.name}
                        </div>
                    </div>
                </div>
            ))}

            {/* Whiteboard Layer */}
            <canvas 
                ref={whiteboardCanvasRef}
                width={1200}
                height={800}
                className="absolute inset-0 w-full h-full cursor-crosshair touch-none z-10"
                onMouseDown={startDrawing}
                onMouseMove={handlePointerMove}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={handlePointerMove}
                onTouchEnd={stopDrawing}
            />

            {/* Top Left: Undo/Redo & History Controls */}
            <div className="absolute top-6 left-6 z-20 flex items-center gap-2">
                <div className="bg-white p-1 border-2 border-slate-900 shadow-hard-sm flex rounded-full">
                    <button 
                        onClick={undo}
                        disabled={historyStep <= 0}
                        className="p-2 rounded-full hover:bg-slate-100 disabled:opacity-30 transition-colors"
                        title="Undo"
                    >
                        <Undo2 size={20} />
                    </button>
                    <button 
                        onClick={redo}
                        disabled={historyStep >= history.length - 1}
                        className="p-2 rounded-full hover:bg-slate-100 disabled:opacity-30 transition-colors"
                        title="Redo"
                    >
                        <Redo2 size={20} />
                    </button>
                </div>
                {/* Active Collaborator Count */}
                {Object.keys(collaborators).length > 0 && (
                    <div className="bg-neo-green p-2 px-3 border-2 border-slate-900 shadow-hard-sm rounded-full flex items-center gap-2 animate-in fade-in">
                        <Users size={16} />
                        <span className="font-bold text-xs">{Object.keys(collaborators).length + 1} Active</span>
                    </div>
                )}
            </div>

            {/* Top Right: Save, Share, Inbox */}
            <div className="absolute top-6 right-6 z-20 flex items-center gap-3">
                 <button 
                    onClick={() => setShowInbox(true)}
                    className="p-3 bg-white border-2 border-slate-900 rounded-full shadow-hard-sm hover:translate-y-1 hover:shadow-none transition-all relative"
                    title="Class Mailbox"
                 >
                     <Inbox size={20} />
                     {inboxItems.some(i => !i.read) && (
                         <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border border-slate-900 rounded-full"></span>
                     )}
                 </button>
                 <button 
                    onClick={() => setShowShareModal(true)}
                    className="p-3 bg-white border-2 border-slate-900 rounded-full shadow-hard-sm hover:translate-y-1 hover:shadow-none transition-all"
                    title="Share to Class"
                 >
                     <Users size={20} />
                 </button>
                 <button 
                    onClick={handleExternalShare}
                    className="p-3 bg-white border-2 border-slate-900 rounded-full shadow-hard-sm hover:translate-y-1 hover:shadow-none transition-all"
                    title="External Share"
                 >
                     <Share2 size={20} />
                 </button>
                 <button 
                    onClick={handleSave}
                    className="p-3 bg-white border-2 border-slate-900 rounded-full shadow-hard-sm hover:translate-y-1 hover:shadow-none transition-all"
                    title="Download Image"
                 >
                     <Download size={20} />
                 </button>
            </div>

            {/* Top Toolbar: Tools & Colors */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 bg-white p-2 border-2 border-slate-900 shadow-hard-sm rounded-full">
                <button 
                    onClick={() => setWbTool('pen')} 
                    className={`p-2 rounded-full transition-all ${wbTool === 'pen' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                    title="Pen"
                >
                    <PenTool size={20} />
                </button>
                
                <div className="w-px h-6 bg-slate-200"></div>
                
                {['#000000', '#ef4444', '#22c55e', '#3b82f6', '#eab308'].map(c => (
                    <button 
                    key={c}
                    onClick={() => { setWbColor(c); setWbTool('pen'); }}
                    className={`w-6 h-6 rounded-full border-2 ${wbColor === c && wbTool === 'pen' ? 'border-slate-900 scale-125' : 'border-transparent hover:scale-110'}`}
                    style={{ backgroundColor: c }}
                    />
                ))}
                
                <div className="w-px h-6 bg-slate-200"></div>

                <button 
                    onClick={() => setWbTool('eraser')} 
                    className={`p-2 rounded-full transition-all ${wbTool === 'eraser' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                    title="Eraser"
                >
                    <Eraser size={20} />
                </button>
                <button 
                    onClick={clearWhiteboard} 
                    className="p-2 rounded-full text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Clear Board"
                >
                    <Trash2 size={20} />
                </button>
            </div>

            {/* Bottom Toolbar: Connection Controls */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-4 w-full px-4">
                {/* Transcript Overlay */}
                {isConnected && transcript && (
                    <div className="max-w-xl w-full bg-slate-900/90 backdrop-blur text-white p-4 rounded-xl border-2 border-white/20 shadow-lg text-center animate-in slide-in-from-bottom-5">
                         <p className="font-medium text-sm md:text-base leading-relaxed">
                            {transcript}
                         </p>
                    </div>
                )}
                
                <div className="flex items-center gap-2">
                    {!isConnected ? (
                        <button 
                            onClick={connect}
                            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold uppercase border-2 border-slate-900 shadow-hard hover:translate-y-1 hover:shadow-none transition-all rounded-full"
                        >
                            <Zap size={20} className="fill-current" />
                            Connect AI Tutor
                        </button>
                    ) : (
                        <div className="flex items-center gap-4 bg-slate-900 p-2 pl-6 pr-2 rounded-full shadow-hard-sm border-2 border-slate-900">
                            <div className="flex items-center gap-2 mr-2">
                                <div className={`w-2 h-2 rounded-full ${aiState === 'speaking' ? 'bg-neo-pink animate-ping' : 'bg-green-400 animate-pulse'}`}></div>
                                <span className="text-white font-bold text-xs uppercase tracking-wider">
                                    {aiState === 'speaking' ? 'Speaking' : 'Listening'}
                                </span>
                            </div>
                            
                            <button 
                                onClick={() => setIsMuted(!isMuted)}
                                className={`p-3 rounded-full transition-colors ${isMuted ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                            >
                                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                            </button>
                            
                            <button 
                                onClick={disconnect}
                                className="px-4 py-2 bg-red-600 text-white font-bold uppercase text-xs rounded-full hover:bg-red-700 transition-colors flex items-center gap-2"
                            >
                                <PhoneOff size={16} /> End
                            </button>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Status Indicator */}
            {isConnected && (
                <div className="absolute top-24 left-6 z-20 bg-white/90 backdrop-blur border-2 border-slate-900 p-3 shadow-hard-sm">
                    <p className="font-mono text-xs font-bold text-slate-500 uppercase mb-1">AI Status</p>
                    <div className="flex items-center gap-2">
                        <Activity size={16} className={aiState === 'speaking' ? "text-neo-pink animate-pulse" : "text-indigo-600"} />
                        <span className="text-sm font-bold">
                            {aiState === 'speaking' ? 'Answering...' : 'Observing...'}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};
