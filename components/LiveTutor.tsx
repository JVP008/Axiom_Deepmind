

import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Zap, Activity } from 'lucide-react';
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

export const LiveTutor: React.FC = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [audioLevel, setAudioLevel] = useState(0);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const inputCtxRef = useRef<AudioContext | null>(null);
    const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sessionRef = useRef<any>(null); // To store the resolved session
    
    // Playback state
    const nextStartTimeRef = useRef<number>(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    // Mute Ref to handle closure staleness
    const isMutedRef = useRef(false);
    useEffect(() => {
        isMutedRef.current = isMuted;
    }, [isMuted]);

    // Video Streaming Interval
    const videoIntervalRef = useRef<number | null>(null);

    useEffect(() => {
        // Init Camera
        const initCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { width: 640, height: 480 },
                    audio: false // Audio handled separately for processing
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (e) {
                console.error("Camera access failed", e);
                setIsVideoEnabled(false);
            }
        };
        if (isVideoEnabled) initCamera();
        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
                tracks.forEach(t => t.stop());
            }
        };
    }, [isVideoEnabled]);

    const connect = async () => {
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            alert("API Key missing");
            return;
        }

        // Initialize Audio Contexts
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        
        // Output Context (Speaker) - Use system default rate to avoid mismatch errors
        const audioCtx = new AudioContextClass(); 
        audioCtxRef.current = audioCtx;
        
        // Input Audio (Mic) - Use system default rate
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
                    
                    // Start Video Streaming
                    if (canvasRef.current && videoRef.current) {
                        videoIntervalRef.current = window.setInterval(() => {
                            if (!videoRef.current || !canvasRef.current) return;
                            const ctx = canvasRef.current.getContext('2d');
                            if (!ctx) return;
                            
                            canvasRef.current.width = videoRef.current.videoWidth;
                            canvasRef.current.height = videoRef.current.videoHeight;
                            ctx.drawImage(videoRef.current, 0, 0);
                            
                            canvasRef.current.toBlob(async (blob) => {
                                if (blob) {
                                    const base64Data = await blobToBase64(blob);
                                    sessionPromise.then(session => {
                                        session.sendRealtimeInput({
                                            media: { data: base64Data, mimeType: 'image/jpeg' }
                                        });
                                    });
                                }
                            }, 'image/jpeg', 0.6);
                        }, 1000); // 1 FPS for stability
                    }
                },
                onmessage: async (message: LiveServerMessage) => {
                    // Handle Audio Response
                    const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                    if (base64Audio && audioCtxRef.current) {
                        const ctx = audioCtxRef.current;
                        const audioData = base64ToUint8Array(base64Audio);
                        
                        // Decode PCM
                        const dataInt16 = new Int16Array(audioData.buffer);
                        // Create buffer with the Model's sample rate (24kHz), context will handle resampling
                        const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
                        const channelData = buffer.getChannelData(0);
                        for (let i = 0; i < dataInt16.length; i++) {
                            channelData[i] = dataInt16[i] / 32768.0;
                        }

                        const source = ctx.createBufferSource();
                        source.buffer = buffer;
                        source.connect(ctx.destination);
                        
                        // Schedule
                        const currentTime = ctx.currentTime;
                        if (nextStartTimeRef.current < currentTime) {
                            nextStartTimeRef.current = currentTime;
                        }
                        source.start(nextStartTimeRef.current);
                        nextStartTimeRef.current += buffer.duration;
                        
                        sourcesRef.current.add(source);
                        source.onended = () => sourcesRef.current.delete(source);

                        // Visualizer fake (for demo)
                        setAudioLevel(Math.random() * 100);
                        setTimeout(() => setAudioLevel(0), buffer.duration * 1000);
                    }

                    // Handle Interruption
                    if (message.serverContent?.interrupted) {
                        sourcesRef.current.forEach(s => s.stop());
                        sourcesRef.current.clear();
                        nextStartTimeRef.current = 0;
                    }
                },
                onclose: () => {
                    setIsConnected(false);
                    console.log("AXIOM LIVE: Closed");
                },
                onerror: (err) => {
                    console.error("AXIOM LIVE Error:", err);
                    setIsConnected(false);
                }
            },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
                },
                systemInstruction: "You are AXIOM, a highly intelligent, real-time AI tutor. You are helpful, energetic, and concise. You can see the student via video. If they show you a math problem, guide them through it. If they look confused, ask if they need help.",
            }
        });
        
        // Audio Processor
        processor.onaudioprocess = (e) => {
            if (isMutedRef.current) return;
            const inputData = e.inputBuffer.getChannelData(0);
            
            // Visualizer logic (using original rate data)
            let sum = 0;
            for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
            setAudioLevel(Math.sqrt(sum / inputData.length) * 500);

            // Resample to 16kHz for model
            const resampledData = resampleTo16k(inputData, inputCtx.sampleRate);

            // Create PCM Blob using safer encoding
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
        if (videoIntervalRef.current) clearInterval(videoIntervalRef.current);
        
        setIsConnected(false);
        setAudioLevel(0);
    };

    return (
        <div className="h-full flex flex-col bg-black text-white relative overflow-hidden">
            {/* Background Grid */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{
                backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)',
                backgroundSize: '40px 40px'
            }}></div>

            {/* Main Video Area */}
            <div className="flex-1 relative flex items-center justify-center z-10">
                {!isConnected ? (
                    <div className="text-center space-y-6 animate-in zoom-in duration-300">
                        <div className="w-24 h-24 mx-auto bg-red-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(239,68,68,0.5)] animate-pulse">
                            <Zap size={48} className="text-black fill-current" />
                        </div>
                        <h1 className="text-4xl font-black uppercase tracking-widest">AXIOM LIVE</h1>
                        <p className="font-mono text-gray-400 max-w-md mx-auto">
                            Connect to the neural network for real-time, multimodal tutoring.
                            Camera and Microphone required.
                        </p>
                        <button 
                            onClick={connect}
                            className="px-8 py-4 bg-white text-black font-black uppercase text-xl hover:scale-105 transition-transform"
                        >
                            Initialize System
                        </button>
                    </div>
                ) : (
                    <div className="relative w-full h-full">
                        <video 
                            ref={videoRef} 
                            autoPlay 
                            muted 
                            playsInline 
                            className={`w-full h-full object-cover transition-opacity ${isVideoEnabled ? 'opacity-100' : 'opacity-0'}`} 
                        />
                        
                        {/* AI Hologram Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className={`w-32 h-32 rounded-full border-4 border-white/20 flex items-center justify-center backdrop-blur-sm transition-all duration-100`} 
                                 style={{ transform: `scale(${1 + audioLevel / 50})` }}>
                                <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center animate-pulse">
                                    <Activity size={48} className="text-red-500" />
                                </div>
                            </div>
                        </div>

                        {/* Status Overlay */}
                        <div className="absolute top-6 left-6 flex items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 border border-red-500 text-red-500 text-xs font-bold uppercase">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                                Live
                            </div>
                            <div className="font-mono text-xs text-white/50">
                                LATENCY: 124ms
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Hidden Canvas for Frame Capture */}
                <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Controls Bar */}
            {isConnected && (
                <div className="h-24 bg-black/80 border-t border-white/10 flex items-center justify-center gap-8 backdrop-blur-md z-20">
                    <button 
                        onClick={() => setIsMuted(!isMuted)}
                        className={`p-4 rounded-full border-2 ${isMuted ? 'bg-red-500 border-red-500 text-white' : 'border-white/20 text-white hover:bg-white/10'}`}
                    >
                        {isMuted ? <MicOff /> : <Mic />}
                    </button>
                    
                    <button 
                        onClick={disconnect}
                        className="px-8 py-4 bg-red-600 rounded-full text-white font-bold uppercase hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                        <PhoneOff size={20} /> End Session
                    </button>

                    <button 
                        onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                        className={`p-4 rounded-full border-2 ${!isVideoEnabled ? 'bg-red-500 border-red-500 text-white' : 'border-white/20 text-white hover:bg-white/10'}`}
                    >
                        {isVideoEnabled ? <Video /> : <VideoOff />}
                    </button>
                </div>
            )}
        </div>
    );
};
