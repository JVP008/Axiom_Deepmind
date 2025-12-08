
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { Mic, MicOff, PhoneOff, Zap, PenTool, Eraser, Trash2, X, Activity } from 'lucide-react';
import { blobToBase64, base64ToUint8Array, floatTo16BitPCM, arrayBufferToBase64 } from '../services/ai';

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
    
    const whiteboardCanvasRef = useRef<HTMLCanvasElement>(null);
    
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

    // Whiteboard Drawing Logic (Local)
    const getCanvasCoordinates = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        
        // Calculate scale factor in case canvas is resized via CSS
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

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawingRef.current || !whiteboardCanvasRef.current) return;
        const canvas = whiteboardCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { x, y } = getCanvasCoordinates(e, canvas);

        // Configure tool style
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
        
        // Reset composite operation to default
        ctx.globalCompositeOperation = 'source-over';

        lastPosRef.current = { x, y };
    };

    const stopDrawing = () => {
        isDrawingRef.current = false;
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
        ctx.strokeStyle = args.color || '#4F46E5'; // Default indigo
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';

        if (args.action === 'clear') {
            ctx.clearRect(0, 0, w, h);
        } else if (args.action === 'line') {
            ctx.beginPath();
            ctx.moveTo((args.x1 / 100) * w, (args.y1 / 100) * h);
            ctx.lineTo((args.x2 / 100) * w, (args.y2 / 100) * h);
            ctx.stroke();
        } else if (args.action === 'rect') {
            ctx.strokeRect((args.x1 / 100) * w, (args.y1 / 100) * h, (args.x2 / 100) * w, (args.y2 / 100) * h);
        } else if (args.action === 'text') {
            ctx.fillStyle = args.color || '#000000';
            ctx.font = '20px "Space Mono"';
            ctx.fillText(args.text || '', (args.x1 / 100) * w, (args.y1 / 100) * h);
        }
    };

    const connect = async () => {
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            alert("API Key missing");
            return;
        }

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContextClass(); 
        audioCtxRef.current = audioCtx;
        
        // Only request audio
        const inputStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const inputCtx = new AudioContextClass(); 
        inputCtxRef.current = inputCtx;

        const inputSource = inputCtx.createMediaStreamSource(inputStream);
        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
        
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
                    
                    // Start Streaming Whiteboard Frames
                    // We must flatten the transparent canvas onto a white background so the AI can see it
                    streamIntervalRef.current = window.setInterval(() => {
                        if (whiteboardCanvasRef.current) {
                            const sourceCanvas = whiteboardCanvasRef.current;
                            
                            // Create temporary canvas to flatten image
                            const tempCanvas = document.createElement('canvas');
                            tempCanvas.width = sourceCanvas.width;
                            tempCanvas.height = sourceCanvas.height;
                            const ctx = tempCanvas.getContext('2d');
                            
                            if (ctx) {
                                // 1. Fill white background
                                ctx.fillStyle = '#ffffff';
                                ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
                                
                                // 2. Draw the transparent whiteboard on top
                                ctx.drawImage(sourceCanvas, 0, 0);
                                
                                // 3. Send the flattened JPEG
                                tempCanvas.toBlob(async (blob) => {
                                    if (blob) {
                                        const base64Data = await blobToBase64(blob);
                                        sessionPromise.then(session => {
                                            session.sendRealtimeInput({
                                                media: { data: base64Data, mimeType: 'image/jpeg' }
                                            });
                                        });
                                    }
                                }, 'image/jpeg', 0.5);
                            }
                        }
                    }, 1000); 
                },
                onmessage: async (message: LiveServerMessage) => {
                    // Handle Tool Calls (Drawing)
                    if (message.toolCall) {
                        sessionPromise.then(session => {
                            const responses = message.toolCall?.functionCalls.map(fc => {
                                if (fc.name === 'drawOnWhiteboard') {
                                    executeAiDrawing(fc.args);
                                    return {
                                        id: fc.id,
                                        name: fc.name,
                                        response: { result: 'success' }
                                    };
                                }
                                return {
                                    id: fc.id,
                                    name: fc.name,
                                    response: { result: 'error: tool not found' }
                                };
                            });
                            session.sendToolResponse({ functionResponses: responses });
                        });
                    }

                    // Handle Audio
                    const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                    if (base64Audio && audioCtxRef.current) {
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
                        source.onended = () => sourcesRef.current.delete(source);
                    }

                    if (message.serverContent?.interrupted) {
                        sourcesRef.current.forEach(s => s.stop());
                        sourcesRef.current.clear();
                        nextStartTimeRef.current = 0;
                    }
                },
                onclose: () => {
                    setIsConnected(false);
                },
                onerror: (err) => {
                    console.error("AXIOM LIVE Error:", err);
                    setIsConnected(false);
                }
            },
            config: {
                tools: [{ functionDeclarations: [whiteboardTool] }],
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
                },
                systemInstruction: "You are AXIOM, an expert AI tutor helping a student on a digital whiteboard. You can see what the student draws because the system sends you snapshots. If the board looks blank, ask the student to draw something. If you need to explain a concept visually (like math, geometry, or diagrams), call the 'drawOnWhiteboard' tool. Be encouraging and helpful.",
            }
        });
        
        processor.onaudioprocess = (e) => {
            if (isMutedRef.current) return;
            const inputData = e.inputBuffer.getChannelData(0);
            
            const resampledData = resampleTo16k(inputData, inputCtx.sampleRate);
            const pcmBuffer = floatTo16BitPCM(resampledData);
            const base64String = arrayBufferToBase64(pcmBuffer);
            
            sessionPromise.then(session => {
                session.sendRealtimeInput({
                    media: { mimeType: 'audio/pcm;rate=16000', data: base64String }
                });
            });
        };
        
        sessionRef.current = sessionPromise;
    };

    const disconnect = async () => {
        if (sessionRef.current) {
            try {
                const session = await sessionRef.current;
                session.close();
            } catch (e) {
                console.error("Error closing session:", e);
            }
        }
        if (audioCtxRef.current) audioCtxRef.current.close();
        if (inputCtxRef.current) inputCtxRef.current.close();
        if (processorRef.current) processorRef.current.disconnect();
        if (inputSourceRef.current) inputSourceRef.current.disconnect();
        if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
        
        setIsConnected(false);
    };

    const clearWhiteboard = () => {
        const canvas = whiteboardCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    return (
        <div className="h-full flex flex-col bg-white relative overflow-hidden border-2 border-slate-900 shadow-hard">
            {/* Dot Grid Background */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-20" style={{
                backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)',
                backgroundSize: '20px 20px'
            }}></div>

            {/* Whiteboard Layer */}
            <canvas 
                ref={whiteboardCanvasRef}
                width={1200}
                height={800}
                className="absolute inset-0 w-full h-full cursor-crosshair touch-none z-10"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
            />

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
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
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
                             <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                             <span className="text-white font-bold text-xs uppercase tracking-wider">Live</span>
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
            
            {/* Status Indicator when drawing */}
            {isConnected && (
                <div className="absolute top-6 left-6 z-20 bg-white/90 backdrop-blur border-2 border-slate-900 p-3 shadow-hard-sm">
                    <p className="font-mono text-xs font-bold text-slate-500 uppercase mb-1">AI Status</p>
                    <div className="flex items-center gap-2">
                        <Activity size={16} className="text-indigo-600" />
                        <span className="text-sm font-bold">Observing Board...</span>
                    </div>
                </div>
            )}
        </div>
    );
};
