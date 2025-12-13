
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { 
  Mic, MicOff, PhoneOff, Zap, PenTool, Eraser, Trash2, Download, 
  Share2, Activity, Undo2, Redo2, Users, Inbox, 
  X, Check, Send, User, ChevronRight, MousePointer2, Radio, Signal,
  Copy, CheckCircle2, Hand, Camera, Sparkles, ImagePlus, Loader2
} from 'lucide-react';

// --- HELPERS ---

// Helper to base64 encode Uint8Array
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Modified createBlob to return { data: string, mimeType: string } as required by sendRealtimeInput
function createBlob(data: Float32Array): { data: string; mimeType: string } {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        // Clamp values to -1 to 1 before converting to PCM16
        let val = Math.max(-1, Math.min(1, data[i]));
        int16[i] = val < 0 ? val * 0x8000 : val * 0x7FFF;
    }
    // Convert Int16Array buffer to Uint8Array, then base64 encode
    const uint8 = new Uint8Array(int16.buffer);
    return {
      data: encode(uint8),
      mimeType: 'audio/pcm;rate=16000',
    };
}

function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
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

const inboxItems = [
    { id: 1, sender: 'Prof. A. Singh', role: 'Teacher', subject: 'Graph Theory Notes', time: '10:30 AM', read: false },
    { id: 2, sender: 'System', role: 'Admin', subject: 'Session Recording Ready', time: 'Yesterday', read: true },
    { id: 3, sender: 'Jayesh P.', role: 'Student', subject: 'Homework Query', time: 'Yesterday', read: true },
];

// Types for History System
interface Point { x: number; y: number; }
interface Stroke {
    points: Point[];
    color: string;
    width: number;
    tool: 'pen' | 'eraser' | 'image';
    // Image properties
    imageData?: string; // base64
    imgElement?: HTMLImageElement;
    imageRect?: { x: number, y: number, w: number, h: number };
}

export const LiveTutor: React.FC = () => {
    const [isConnecting, setIsConnecting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    
    // Tools State
    const [wbColor, setWbColor] = useState('#000000');
    const [wbTool, setWbTool] = useState<'select' | 'pan' | 'pen' | 'eraser'>('pen');
    
    // UI State
    const [activeModal, setActiveModal] = useState<'inbox' | 'users' | 'generate' | null>(null);
    const [isGenMenuOpen, setIsGenMenuOpen] = useState(false);
    const [notification, setNotification] = useState<string | null>(null);

    // Generation State
    const [genType, setGenType] = useState<'infographic' | 'image'>('image');
    const [genPrompt, setGenPrompt] = useState('');
    const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Canvas State - Infinite & History
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [strokes, setStrokes] = useState<Stroke[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1); // -1 means empty
    const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
    
    // Panning State
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const panOffsetRef = useRef({ x: 0, y: 0 }); // Ref for async access
    const [isPanning, setIsPanning] = useState(false);
    const lastMousePos = useRef<{ x: number, y: number } | null>(null);

    // Sync Ref
    useEffect(() => {
        panOffsetRef.current = panOffset;
    }, [panOffset]);

    // Audio State
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const inputAudioCtxRef = useRef<AudioContext | null>(null);
    const outputAudioCtxRef = useRef<AudioContext | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    
    // --- ACTIONS ---
    const showNotification = (msg: string) => {
        setNotification(msg);
        setTimeout(() => setNotification(null), 3000);
    };

    // Redraw Canvas whenever state changes
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear entire canvas using absolute coordinates (ignoring translate)
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        // Apply Pan Offset
        ctx.translate(panOffset.x, panOffset.y);

        // Draw Line Cap Style
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Helper to draw a stroke
        const drawStroke = (stroke: Stroke) => {
            if (stroke.tool === 'image' && stroke.imgElement && stroke.imageRect) {
                try {
                    ctx.drawImage(
                        stroke.imgElement, 
                        stroke.imageRect.x, 
                        stroke.imageRect.y, 
                        stroke.imageRect.w, 
                        stroke.imageRect.h
                    );
                } catch(e) {
                    // Image might not be loaded yet, skip
                }
                return;
            }

            if (stroke.points.length < 2) return;
            ctx.beginPath();
            ctx.strokeStyle = stroke.tool === 'eraser' ? '#f8fafc' : stroke.color;
            ctx.lineWidth = stroke.width;
            
            ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
            for (let i = 1; i < stroke.points.length; i++) {
                ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
            }
            ctx.stroke();
        };

        // Draw History Strokes
        const visibleStrokes = strokes.slice(0, historyIndex + 1);
        visibleStrokes.forEach(drawStroke);

        // Draw Current Stroke
        if (currentStroke) {
            drawStroke(currentStroke);
        }

        ctx.restore();
    }, [strokes, historyIndex, currentStroke, panOffset]);


    const handleUndo = () => {
        if (historyIndex >= 0) {
            setHistoryIndex(prev => prev - 1);
        }
    };

    const handleRedo = () => {
        if (historyIndex < strokes.length - 1) {
            setHistoryIndex(prev => prev + 1);
        }
    };

    const handleDownload = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            try {
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = canvas.width;
                tempCanvas.height = canvas.height;
                const ctx = tempCanvas.getContext('2d');
                if (!ctx) return;

                // Fill background
                ctx.fillStyle = '#f8fafc'; 
                ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
                
                // Draw current view
                ctx.drawImage(canvas, 0, 0);

                const link = document.createElement('a');
                link.download = `axiom-whiteboard-${Date.now()}.png`;
                link.href = tempCanvas.toDataURL('image/png');
                link.click();
                showNotification("Whiteboard saved to device!");
            } catch (e) {
                console.error(e);
                showNotification("Failed to save image");
            }
        }
    };

    const getCanvasBase64 = (maxDim: number = 0, mimeType: string = 'image/png', quality: number = 1.0): string | null => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        
        let w = canvas.width;
        let h = canvas.height;

        // Downscale if maxDim is set and dimensions exceed it
        // This is crucial for AI payloads to prevent RPC 500/XHR errors with large high-dpi screenshots
        if (maxDim > 0 && (w > maxDim || h > maxDim)) {
            const scale = Math.min(maxDim / w, maxDim / h);
            w *= scale;
            h *= scale;
        }

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = w;
        tempCanvas.height = h;
        const ctx = tempCanvas.getContext('2d');
        if (!ctx) return null;
        
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        ctx.drawImage(canvas, 0, 0, w, h);
        return tempCanvas.toDataURL(mimeType, quality).split(',')[1];
    };

    const prepareGeneration = (type: 'infographic' | 'image') => {
        setIsGenMenuOpen(false);
        // Optimize payload: Max 1024px, JPEG 0.8 quality to avoid 4MB+ payload limits (RPC errors)
        const base64 = getCanvasBase64(1024, 'image/jpeg', 0.8); 
        if (base64) {
            setScreenshotPreview(`data:image/jpeg;base64,${base64}`);
            setGenType(type);
            setActiveModal('generate');
        } else {
            showNotification("Failed to capture board");
        }
    };

    const handleGenerate = async () => {
        if (!screenshotPreview || !genPrompt) return;

        setIsGenerating(true);

        try {
            // Re-initialize to ensure fresh key from env
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
            const base64Data = screenshotPreview.split(',')[1];
            // Extract mime type dynamically
            const mimeType = screenshotPreview.substring(5, screenshotPreview.indexOf(';'));
            
            // Construct Prompt
            let finalPrompt = genPrompt;
            if (genType === 'infographic') {
                finalPrompt = `Analyze this whiteboard screenshot and create a clean, educational infographic summarizing the key concepts. Context: ${genPrompt}`;
            }

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: {
                    parts: [
                        { text: finalPrompt },
                        { inlineData: { mimeType: mimeType, data: base64Data } }
                    ]
                }
            });

            // Find image part
            let newImageBase64 = null;
            let newImageMimeType = 'image/png';

            if (response.candidates?.[0]?.content?.parts) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData) {
                        newImageBase64 = part.inlineData.data;
                        newImageMimeType = part.inlineData.mimeType || 'image/png';
                        break;
                    }
                }
            }

            if (newImageBase64) {
                // CLEAR PREVIOUS DRAWINGS to avoid overlap (pass true)
                addImageToBoard(newImageBase64, newImageMimeType, true);
                showNotification("Image Generated!");
                setActiveModal(null);
                setGenPrompt('');
            } else {
                showNotification("No image generated.");
            }

        } catch (e: any) {
            console.error(e);
            if (e.message?.includes('403') || JSON.stringify(e).includes('PERMISSION_DENIED')) {
                 showNotification("Permission Denied. Model unavailable.");
            } else if (e.message?.includes('500') || JSON.stringify(e).includes('Rpc failed')) {
                showNotification("Server Error. Try reducing prompt complexity.");
            } else {
                showNotification("Generation Failed");
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const addImageToBoard = (base64: string, mimeType: string = 'image/png', clearBoard: boolean = false) => {
        const img = new Image();
        img.src = `data:${mimeType};base64,${base64}`;
        img.onload = () => {
             // Center image in current view
             const canvas = canvasRef.current;
             if (!canvas) return;
             
             // Scale down if too big relative to view
             let w = img.width;
             let h = img.height;
             const maxSize = Math.min(canvas.width, canvas.height) * 0.8;
             if (w > maxSize || h > maxSize) {
                 const ratio = Math.min(maxSize/w, maxSize/h);
                 w *= ratio;
                 h *= ratio;
             }

             // Center in current pan view
             // View center is (-panOffset.x + canvas.width/2, -panOffset.y + canvas.height/2)
             const centerX = -panOffset.x + (canvas.width / 2);
             const centerY = -panOffset.y + (canvas.height / 2);

             const newStroke: Stroke = {
                 tool: 'image',
                 color: '',
                 width: 0,
                 points: [],
                 imageData: base64,
                 imgElement: img,
                 imageRect: {
                     x: centerX - w/2,
                     y: centerY - h/2,
                     w: w,
                     h: h
                 }
             };

             setStrokes(prev => {
                const newHistory = clearBoard ? [] : prev.slice(0, historyIndex + 1);
                newHistory.push(newStroke);
                setHistoryIndex(newHistory.length - 1);
                return newHistory;
            });
        };
    };

    const handleShare = async () => {
        const shareLinkFallback = async (fallbackMsg: string = "Link copied to clipboard") => {
             const shareData = {
                title: 'AXIOM Live Session',
                text: 'Join my live tutoring session on AXIOM! Access Code: 8372-9182',
                url: window.location.href
            };

            if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                try {
                    await navigator.share(shareData);
                } catch (err) {
                    if ((err as Error).name !== 'AbortError') {
                        navigator.clipboard.writeText("https://axiom.edu/live/session/8372-9182");
                        showNotification(fallbackMsg);
                    }
                }
            } else {
                navigator.clipboard.writeText("https://axiom.edu/live/session/8372-9182");
                showNotification(fallbackMsg);
            }
        };

        const canvas = canvasRef.current;
        if (!canvas) {
            await shareLinkFallback();
            return;
        }

        try {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const ctx = tempCanvas.getContext('2d');
            if (!ctx) return;

            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            ctx.drawImage(canvas, 0, 0);

            tempCanvas.toBlob(async (blob) => {
                if (!blob) {
                    await shareLinkFallback("Image processing failed. Link copied.");
                    return;
                }

                const file = new File([blob], "axiom-whiteboard.png", { type: "image/png" });
                const shareData = {
                    files: [file],
                    title: 'AXIOM Whiteboard',
                    text: 'My notes from the session.'
                };

                if (navigator.canShare && navigator.canShare(shareData)) {
                    try {
                        await navigator.share(shareData);
                        showNotification("Whiteboard shared!");
                    } catch (err) {
                        if ((err as Error).name !== 'AbortError') {
                            await shareLinkFallback("Sharing failed. Link copied.");
                        }
                    }
                } else {
                    await shareLinkFallback("Image share not supported. Link copied.");
                }
            }, 'image/png');
        } catch (e) {
            console.error("Share Error", e);
            await shareLinkFallback("Error sharing. Link copied.");
        }
    };

    const loadInboxAttachment = () => {
        // Add a mock "image" stroke or simply text stroke
        const newStroke: Stroke = {
            points: [{ x: -panOffset.x + 200, y: -panOffset.y + 200 }, { x: -panOffset.x + 220, y: -panOffset.y + 220 }], // Dummy points
            color: '#000000',
            width: 2,
            tool: 'pen'
        };
        // In a real app we'd support Image objects in the stroke history
        showNotification("Attachment loaded (Simulation)");
        setActiveModal(null);
    };

    // --- CONNECTION LOGIC ---
    const disconnect = () => {
        sessionPromiseRef.current?.then(session => session.close());
        sessionPromiseRef.current = null;
        
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }

        if (inputAudioCtxRef.current) {
            inputAudioCtxRef.current.close();
            inputAudioCtxRef.current = null;
        }
        if (outputAudioCtxRef.current) {
            outputAudioCtxRef.current.close();
            outputAudioCtxRef.current = null;
        }
        setIsConnected(false);
        setIsConnecting(false);
    };

    const connect = async () => {
        if (isConnected || isConnecting) return;
        setIsConnecting(true);

        if (!process.env.API_KEY) {
            if ((window as any).aistudio && (window as any).aistudio.openSelectKey) {
                showNotification("Please select an API Key.");
                await (window as any).aistudio.openSelectKey();
            } else {
                showNotification("API Key is missing.");
                setIsConnecting(false);
                return;
            }
        }
        
        try {
            // 1. Get Mic Permissions
            let stream: MediaStream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaStreamRef.current = stream;
            } catch (err: any) {
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    showNotification("Microphone permission denied.");
                } else {
                    showNotification("Microphone not found.");
                }
                setIsConnecting(false);
                return;
            }

            // 2. Initialize Audio Contexts
            const InputCtxClass = window.AudioContext || (window as any).webkitAudioContext;
            inputAudioCtxRef.current = new InputCtxClass({ sampleRate: 16000 });
            
            const OutputCtxClass = window.AudioContext || (window as any).webkitAudioContext;
            outputAudioCtxRef.current = new OutputCtxClass({ sampleRate: 24000 });
            nextStartTimeRef.current = 0;
            if (outputAudioCtxRef.current.state === 'suspended') {
                await outputAudioCtxRef.current.resume();
            }

            // 3. Setup AI Session
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
                    },
                    systemInstruction: "You are an expert tutor. Use the whiteboard tool to draw graphs, formulas, and diagrams while you speak.",
                    tools: [{ functionDeclarations: [whiteboardTool] }],
                },
                callbacks: {
                    onopen: () => {
                        console.log("Session Opened");
                        setIsConnected(true);
                        setIsConnecting(false);
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (audioData && outputAudioCtxRef.current) {
                            const ctx = outputAudioCtxRef.current;
                            if (ctx.state === 'suspended') await ctx.resume();
                            
                            try {
                                const audioBuffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
                                const source = ctx.createBufferSource();
                                source.buffer = audioBuffer;
                                source.connect(ctx.destination);
                                
                                const now = ctx.currentTime;
                                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, now);
                                source.start(nextStartTimeRef.current);
                                nextStartTimeRef.current += audioBuffer.duration;
                                
                                source.onended = () => { sourcesRef.current.delete(source); };
                                sourcesRef.current.add(source);
                            } catch(e) {
                                console.error("Audio Decode Error", e);
                            }
                        }

                        if (msg.toolCall) {
                            const responses = [];
                            for (const call of msg.toolCall.functionCalls) {
                                if (call.name === 'drawOnWhiteboard') {
                                    drawFromAI(call.args);
                                    responses.push({
                                        id: call.id,
                                        name: call.name,
                                        response: { result: "drawing_executed_successfully" }
                                    });
                                }
                            }
                            sessionPromise.then(session => session.sendToolResponse({ functionResponses: responses }));
                        }

                        if (msg.serverContent?.interrupted) {
                            sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
                            sourcesRef.current.clear();
                            nextStartTimeRef.current = 0;
                        }
                    },
                    onclose: () => {
                        console.log("Session Closed");
                        disconnect();
                    },
                    onerror: (err) => {
                        console.error("Session Error", err);
                        showNotification("Session error. Disconnected.");
                        disconnect();
                    }
                }
            });
            sessionPromiseRef.current = sessionPromise;

            // 4. Connect Mic to AI
            const source = inputAudioCtxRef.current.createMediaStreamSource(stream);
            const processor = inputAudioCtxRef.current.createScriptProcessor(4096, 1, 1);
            
            processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const pcmData = createBlob(inputData);
                sessionPromise.then(session => session.sendRealtimeInput({ media: pcmData }));
            };
            
            source.connect(processor);
            processor.connect(inputAudioCtxRef.current.destination);

        } catch (e: any) {
            console.error("Connection Failed", e);
            showNotification("Failed to connect. Please try again.");
            disconnect();
        }
    };

    // --- DRAWING LOGIC ---
    const drawFromAI = (args: any) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const w = canvas.width;
        const h = canvas.height;
        const offset = panOffsetRef.current;
        
        const toWorldX = (pct: number) => (pct / 100) * w - offset.x;
        const toWorldY = (pct: number) => (pct / 100) * h - offset.y;

        const newStroke: Stroke = {
            points: [],
            color: args.color || '#000000',
            width: 3 * (window.devicePixelRatio || 1),
            tool: 'pen'
        };

        if (args.action === 'clear') {
            setStrokes([]);
            setHistoryIndex(-1);
            return;
        } else if (args.action === 'line') {
            newStroke.points.push({ x: toWorldX(args.x1), y: toWorldY(args.y1) });
            newStroke.points.push({ x: toWorldX(args.x2), y: toWorldY(args.y2) });
        } else if (args.action === 'rect') {
            const x1 = toWorldX(args.x1), y1 = toWorldY(args.y1);
            const w_rect = (args.x2 / 100) * w;
            const h_rect = (args.y2 / 100) * h;
            
            newStroke.points.push({ x: x1, y: y1 });
            newStroke.points.push({ x: x1 + w_rect, y: y1 });
            newStroke.points.push({ x: x1 + w_rect, y: y1 + h_rect });
            newStroke.points.push({ x: x1, y: y1 + h_rect });
            newStroke.points.push({ x: x1, y: y1 });
        }

        if (newStroke.points.length > 0) {
            setStrokes(prev => {
                const newHistory = prev.slice(0, historyIndex + 1);
                newHistory.push(newStroke);
                setHistoryIndex(newHistory.length - 1);
                return newHistory;
            });
        }
    };

    const getScale = () => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 1, y: 1 };
        const rect = canvas.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return { x: 1, y: 1 };
        return { x: canvas.width / rect.width, y: canvas.height / rect.height };
    };

    const getWorldCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const scale = getScale();
        const screenX = (e.clientX - rect.left) * scale.x;
        const screenY = (e.clientY - rect.top) * scale.y;
        return { x: screenX - panOffset.x, y: screenY - panOffset.y };
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (wbTool === 'select') return;

        if (wbTool === 'pan') {
            setIsPanning(true);
            lastMousePos.current = { x: e.clientX, y: e.clientY };
            return;
        }

        const worldPos = getWorldCoordinates(e);
        setCurrentStroke({
            points: [worldPos],
            color: wbColor,
            width: (wbTool === 'eraser' ? 20 : 3) * (window.devicePixelRatio || 1),
            tool: wbTool as 'pen' | 'eraser'
        });
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (isPanning && lastMousePos.current) {
            const scale = getScale();
            const dx = (e.clientX - lastMousePos.current.x) * scale.x;
            const dy = (e.clientY - lastMousePos.current.y) * scale.y;
            const newOffset = { x: panOffset.x + dx, y: panOffset.y + dy };
            setPanOffset(newOffset);
            panOffsetRef.current = newOffset;
            lastMousePos.current = { x: e.clientX, y: e.clientY };
            return;
        }

        if (currentStroke && wbTool !== 'pan') {
            const worldPos = getWorldCoordinates(e);
            setCurrentStroke(prev => {
                if (!prev) return null;
                return { ...prev, points: [...prev.points, worldPos] };
            });
        }
    };

    const handleMouseUp = () => {
        if (isPanning) {
            setIsPanning(false);
            lastMousePos.current = null;
        }

        if (currentStroke && wbTool !== 'pan') {
            const newHistory = strokes.slice(0, historyIndex + 1);
            newHistory.push(currentStroke);
            setStrokes(newHistory);
            setHistoryIndex(newHistory.length - 1);
            setCurrentStroke(null);
        }
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const observer = new ResizeObserver(entries => {
             const entry = entries[0];
             // CRITICAL FIX: Do not resize if the element is hidden (width/height is 0)
             // This prevents the canvas from clearing when the user switches tabs
             if(entry && entry.contentRect.width > 0 && entry.contentRect.height > 0) {
                 const dpr = window.devicePixelRatio || 1;
                 canvas.width = entry.contentRect.width * dpr;
                 canvas.height = entry.contentRect.height * dpr;
                 setPanOffset(prev => ({ ...prev }));
             }
        });
        observer.observe(canvas);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        return () => disconnect();
    }, []);

    const ToolButton = ({ icon, active, onClick }: any) => (
        <button 
            onClick={onClick}
            className={`p-2.5 rounded-lg transition-all ${active ? 'bg-indigo-100 text-indigo-700 shadow-inner' : 'text-slate-600 hover:bg-slate-100'}`}
        >
            {icon}
        </button>
    );

    const ActionButton = ({ icon, onClick, active, badge }: any) => (
        <button 
            onClick={onClick}
            className={`p-2.5 rounded-lg border-2 shadow-hard hover:shadow-none hover:translate-y-0.5 transition-all relative ${
                active ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-900 border-slate-900'
            }`}
        >
            {icon}
            {badge && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white"></span>}
        </button>
    );

    return (
        <div className="relative h-full w-full bg-[#f8fafc] overflow-hidden flex flex-col font-sans text-slate-900">
            {/* Notification Toast */}
            {notification && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
                    <div className="bg-slate-900 text-white px-6 py-3 border-2 border-white shadow-hard-white flex items-center gap-3">
                        <CheckCircle2 size={20} className="text-neo-green" />
                        <span className="font-bold uppercase tracking-wide text-sm">{notification}</span>
                    </div>
                </div>
            )}
            
            {/* Infinite Canvas Background Pattern */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-40 transition-none will-change-[background-position]"
                style={{
                    backgroundImage: 'radial-gradient(#94a3b8 1.5px, transparent 1.5px)',
                    backgroundSize: '24px 24px',
                    backgroundPosition: `${panOffset.x}px ${panOffset.y}px`
                }}
            />

            {/* Canvas Layer */}
            <canvas 
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ width: '100%', height: '100%' }}
                className={`absolute inset-0 z-10 w-full h-full touch-none ${
                    wbTool === 'pen' || wbTool === 'eraser' ? 'cursor-crosshair' : 
                    wbTool === 'pan' ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
                }`}
            />

            {/* --- FLOATING UI LAYER (z-20) --- */}

            {/* Top Left: Title & History */}
            <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                <div className="bg-white px-4 py-2 border-2 border-slate-900 shadow-hard flex items-center gap-3 rounded-xl">
                    <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-neo-green animate-pulse' : isConnecting ? 'bg-neo-yellow animate-pulse' : 'bg-red-500'} border border-slate-900`}></div>
                    <h1 className="font-black uppercase tracking-wider text-sm select-none">AXIOM Live</h1>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={handleUndo}
                        disabled={historyIndex < 0}
                        className="p-2 bg-white border-2 border-slate-900 shadow-hard hover:translate-y-0.5 hover:shadow-none transition-all rounded-lg text-slate-700 hover:text-slate-900 disabled:opacity-50 disabled:shadow-none disabled:translate-y-0.5"
                    >
                        <Undo2 size={18} />
                    </button>
                    <button 
                        onClick={handleRedo}
                        disabled={historyIndex >= strokes.length - 1}
                        className="p-2 bg-white border-2 border-slate-900 shadow-hard hover:translate-y-0.5 hover:shadow-none transition-all rounded-lg text-slate-700 hover:text-slate-900 disabled:opacity-50 disabled:shadow-none disabled:translate-y-0.5"
                    >
                        <Redo2 size={18} />
                    </button>
                </div>
            </div>

            {/* Top Center: Toolbar Island */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-white p-1.5 border-2 border-slate-900 shadow-hard rounded-2xl flex items-center gap-1">
                <ToolButton icon={<MousePointer2 size={18} />} active={wbTool === 'select'} onClick={() => setWbTool('select')} />
                <ToolButton icon={<Hand size={18} />} active={wbTool === 'pan'} onClick={() => setWbTool('pan')} />
                <div className="w-px h-6 bg-slate-200 mx-1"></div>
                <ToolButton icon={<PenTool size={18} />} active={wbTool === 'pen'} onClick={() => setWbTool('pen')} />
                <ToolButton icon={<Eraser size={18} />} active={wbTool === 'eraser'} onClick={() => setWbTool('eraser')} />
                <div className="w-px h-6 bg-slate-200 mx-1"></div>
                {/* Colors */}
                <div className="flex items-center gap-1.5 px-1">
                    {['#000000', '#EF4444', '#22C55E', '#3B82F6'].map(color => (
                        <button 
                            key={color}
                            onClick={() => { setWbColor(color); setWbTool('pen'); }}
                            className={`w-5 h-5 rounded-full border border-slate-200 hover:scale-110 transition-transform relative ${wbColor === color && wbTool === 'pen' ? 'ring-2 ring-offset-1 ring-slate-900' : ''}`}
                            style={{ backgroundColor: color }}
                        />
                    ))}
                </div>
                <div className="w-px h-6 bg-slate-200 mx-1"></div>
                <button 
                    onClick={() => {
                        setStrokes([]);
                        setHistoryIndex(-1);
                        showNotification("Canvas Cleared");
                    }}
                    className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                    title="Clear Canvas"
                >
                    <Trash2 size={18} />
                </button>
            </div>

            {/* Top Right: Actions Island */}
            <div className="absolute top-4 right-4 z-20 flex gap-2">
                <ActionButton icon={<Inbox size={20} />} onClick={() => setActiveModal(activeModal === 'inbox' ? null : 'inbox')} active={activeModal === 'inbox'} badge={inboxItems.some(i => !i.read)} />
                <ActionButton icon={<Users size={20} />} onClick={() => setActiveModal(activeModal === 'users' ? null : 'users')} active={activeModal === 'users'} />
                
                {/* Magic Camera Button */}
                <div className="relative">
                    <ActionButton 
                        icon={<Camera size={20} />} 
                        onClick={() => setIsGenMenuOpen(!isGenMenuOpen)} 
                        active={isGenMenuOpen} 
                    />
                    {isGenMenuOpen && (
                        <div className="absolute top-full right-0 mt-2 w-56 bg-white border-2 border-slate-900 shadow-hard rounded-lg overflow-hidden animate-in slide-in-from-top-2">
                            <button 
                                onClick={() => prepareGeneration('infographic')}
                                className="w-full text-left p-3 hover:bg-indigo-50 flex items-center gap-3 border-b border-slate-200"
                            >
                                <div className="p-1.5 bg-neo-yellow border border-slate-900 rounded-md">
                                    <Sparkles size={16} className="text-slate-900" />
                                </div>
                                <span className="text-sm font-bold uppercase">Make Infographic</span>
                            </button>
                            <button 
                                onClick={() => prepareGeneration('image')}
                                className="w-full text-left p-3 hover:bg-indigo-50 flex items-center gap-3"
                            >
                                <div className="p-1.5 bg-neo-blue border border-slate-900 rounded-md">
                                    <ImagePlus size={16} className="text-white" />
                                </div>
                                <span className="text-sm font-bold uppercase">Generate Image</span>
                            </button>
                        </div>
                    )}
                </div>

                <ActionButton icon={<Share2 size={20} />} onClick={handleShare} />
                <ActionButton icon={<Download size={20} />} onClick={handleDownload} />
            </div>

            {/* Inbox Popover */}
            {activeModal === 'inbox' && (
                <div className="absolute top-20 right-4 w-96 bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-100 shadow-hard z-30 animate-in slide-in-from-top-2">
                    <div className="flex items-center justify-between p-3 border-b-2 border-slate-900 bg-slate-100 dark:bg-slate-800">
                        <h3 className="font-black uppercase flex items-center gap-2"><Inbox size={16} /> Class Mailbox</h3>
                        <button onClick={() => setActiveModal(null)} className="hover:bg-slate-200 p-1"><X size={16} /></button>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                        {inboxItems.map(item => (
                            <div key={item.id} className="p-3 border-b border-slate-200 hover:bg-slate-50 cursor-pointer">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-xs uppercase text-neo-blue">{item.subject}</span>
                                    <span className="text-[10px] font-mono text-slate-500">{item.time}</span>
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[8px] font-bold">{item.role[0]}</span>
                                    <span className="text-xs font-medium">{item.sender}</span>
                                </div>
                                <div className="bg-slate-100 border border-slate-300 p-2 flex items-center gap-2 group">
                                    <div className="w-8 h-8 bg-white border border-slate-300 flex items-center justify-center">
                                        <Activity size={12} className="text-slate-400" />
                                    </div>
                                    <span className="text-xs font-mono flex-1 truncate">graph_ref_01.png</span>
                                    <button 
                                        onClick={loadInboxAttachment}
                                        className="text-xs font-bold text-indigo-600 hover:underline hover:text-indigo-800"
                                    >
                                        VIEW
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Users Popover */}
            {activeModal === 'users' && (
                <div className="absolute top-20 right-4 w-64 bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-100 shadow-hard z-30 animate-in slide-in-from-top-2">
                    <div className="flex items-center justify-between p-3 border-b-2 border-slate-900 bg-slate-100 dark:bg-slate-800">
                        <h3 className="font-black uppercase flex items-center gap-2"><Users size={16} /> Participants</h3>
                        <button onClick={() => setActiveModal(null)} className="hover:bg-slate-200 p-1"><X size={16} /></button>
                    </div>
                    <div className="p-2 space-y-1">
                        <div className="flex items-center gap-3 p-2 bg-slate-50 border border-slate-200">
                            <div className="w-8 h-8 bg-neo-yellow border-2 border-slate-900 flex items-center justify-center font-bold text-xs">YOU</div>
                            <div className="flex-1">
                                <p className="text-sm font-bold">Jayesh Patil</p>
                                <p className="text-[10px] text-green-600 font-bold uppercase flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Online</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-2 bg-slate-50 border border-slate-200">
                            <div className="w-8 h-8 bg-neo-blue border-2 border-slate-900 flex items-center justify-center font-bold text-xs text-white">AI</div>
                            <div className="flex-1">
                                <p className="text-sm font-bold">Axiom Tutor</p>
                                {isConnected ? (
                                    <p className="text-[10px] text-green-600 font-bold uppercase flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Live</p>
                                ) : (
                                    <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1"><span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span> Offline</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Generation Dialog */}
            {activeModal === 'generate' && screenshotPreview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in zoom-in duration-200">
                    <div className="bg-white w-full max-w-2xl border-2 border-slate-900 shadow-hard rounded-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b-2 border-slate-900 bg-slate-100 flex justify-between items-center">
                            <h3 className="font-black uppercase flex items-center gap-2">
                                <Sparkles size={18} className="text-neo-purple" />
                                {genType === 'infographic' ? 'Create Infographic' : 'Generate Image'}
                            </h3>
                            <button onClick={() => setActiveModal(null)} className="p-1 hover:bg-slate-200 rounded"><X size={20} /></button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="grid grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-xs font-bold uppercase mb-2 text-slate-500">Source Context</label>
                                    <div className="border-2 border-slate-200 rounded-lg overflow-hidden bg-slate-50 aspect-video flex items-center justify-center">
                                        <img src={screenshotPreview} alt="Board Context" className="max-w-full max-h-full object-contain" />
                                    </div>
                                </div>
                                <div className="flex flex-col justify-center">
                                    <h4 className="font-bold text-lg mb-2">Instructions</h4>
                                    <p className="text-sm text-slate-600 mb-4">
                                        The AI will analyze your current whiteboard and generate a new visual asset based on your prompt.
                                    </p>
                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
                                        <strong>Tip:</strong> Be specific about style (e.g., "minimalist chart", "3D diagram").
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold uppercase mb-2 text-slate-900 text-left bg-white">
                                    {genType === 'infographic' ? 'Infographic Topic / Goal' : 'Image Description'}
                                </label>
                                <textarea 
                                    value={genPrompt}
                                    onChange={(e) => setGenPrompt(e.target.value)}
                                    placeholder={genType === 'infographic' ? "Summarize the physics formulas shown..." : "A futuristic city based on the sketch..."}
                                    className="w-full p-3 bg-white text-slate-900 border-2 border-slate-300 rounded-lg focus:border-slate-900 outline-none min-h-[100px] font-medium resize-none placeholder:text-slate-400"
                                />
                            </div>
                        </div>

                        <div className="p-4 border-t-2 border-slate-900 bg-slate-50 flex justify-end gap-3">
                            <button 
                                onClick={() => setActiveModal(null)}
                                className="px-4 py-2 font-bold uppercase text-slate-500 hover:text-slate-900"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleGenerate}
                                disabled={!genPrompt || isGenerating}
                                className="px-6 py-2 bg-slate-900 text-white font-bold uppercase rounded-lg shadow-md hover:shadow-none hover:translate-y-0.5 transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                {isGenerating ? 'Generating...' : 'Generate Asset'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Bottom Center: Connection Widget (Floating) */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 z-30 w-full max-w-md px-4 pointer-events-none">
                {/* Status Indicator */}
                {isConnected && (
                        <div className="bg-slate-900 text-white px-4 py-2 font-mono text-xs font-bold flex items-center gap-3 shadow-hard pointer-events-auto border-2 border-white animate-in slide-in-from-bottom-2 rounded-full">
                            <span className="flex items-center gap-1 text-neo-green"><Signal size={12} /> LIVE</span>
                            <span className="w-px h-3 bg-white/20"></span>
                            <span className="animate-pulse">{currentStroke ? 'User Drawing...' : 'Listening...'}</span>
                        </div>
                )}

                <div className="pointer-events-auto">
                        {isConnected ? (
                        <div className="flex items-center gap-2 p-1.5 bg-slate-900 border-2 border-slate-900 shadow-hard transition-all animate-in slide-in-from-bottom-4 rounded-full px-6">
                            <button 
                                onClick={() => setIsMuted(!isMuted)}
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors border-2 border-transparent ${isMuted ? 'bg-red-500 text-white' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
                            >
                                {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                            </button>
                            <div className="h-10 flex-1 min-w-[120px] bg-slate-800 flex items-center justify-center px-4 mx-1 border-2 border-slate-700 rounded-lg overflow-hidden">
                                    {/* Fake Waveform */}
                                    <div className="flex gap-1 items-center h-full">
                                        {[1,2,3,4,5,4,3,2,1,2,3].map((h, i) => (
                                            <div key={i} className="w-1 bg-neo-green animate-bounce rounded-full" style={{ height: `${h * 3}px`, animationDelay: `${i * 0.1}s` }}></div>
                                        ))}
                                    </div>
                            </div>
                            <button 
                                onClick={disconnect}
                                className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 border-2 border-transparent hover:border-white transition-all"
                            >
                                <PhoneOff size={18} />
                            </button>
                        </div>
                        ) : (
                            <button 
                            onClick={connect}
                            disabled={isConnecting}
                            className="group relative bg-white border-2 border-slate-900 rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all duration-200 overflow-hidden px-6 py-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                                        {isConnecting ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} className="fill-current" />}
                                    </div>
                                    <div className="text-left">
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            <span className={`w-1.5 h-1.5 rounded-full ${isConnecting ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></span>
                                            <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                                                {isConnecting ? 'Establishing Link...' : 'System Online'}
                                            </span>
                                        </div>
                                        <span className="text-sm font-black font-mono uppercase tracking-tight text-slate-900 block leading-none">
                                            {isConnecting ? 'Connecting' : 'Connect AI'}
                                        </span>
                                    </div>
                                    <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-900 group-hover:translate-x-1 transition-all ml-1" />
                                </div>
                            </button>
                        )}
                </div>
            </div>
        </div>
    );
};
