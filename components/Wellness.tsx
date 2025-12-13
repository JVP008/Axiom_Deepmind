import React, { useState, useEffect, useRef } from 'react';
import { Heart, Moon, Smile, Wind, Music, Volume2, Cloud, Activity, Frown, Meh, BarChart2, Play, Pause, Coffee, Users, AlertCircle, CalendarCheck, Send, Sparkles } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { STUDENTS } from '../constants';
import { generateMeditationAudio } from '../services/ai';

// --- HELPER DECODE AUDIO ---
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
  // Use byteOffset and length to ensure we read valid data from the buffer view
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

export const Wellness: React.FC = () => {
    const [viewMode, setViewMode] = useState<'student' | 'counselor'>('student');
    
    // Student View State
    const [activeTab, setActiveTab] = useState<'checkin' | 'relax' | 'insights'>('checkin');
    const [mood, setMood] = useState(3);
    const [stress, setStress] = useState(2);
    const [sleep, setSleep] = useState(7);
    const [isBreathing, setIsBreathing] = useState(false);
    const [breathPhase, setBreathPhase] = useState<'idle' | 'inhale' | 'hold-in' | 'exhale' | 'hold-out'>('idle');
    const [breathInstruction, setBreathInstruction] = useState('Ready?');
    const [animationKey, setAnimationKey] = useState(0); 
    
    // AI Audio State
    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
    const [isPlayingAiAudio, setIsPlayingAiAudio] = useState(false);
    const [audioError, setAudioError] = useState<string | null>(null);
    const aiSourceRef = useRef<AudioBufferSourceNode | null>(null);
    
    // Audio Refs
    const audioCtxRef = useRef<AudioContext | null>(null);

    const checkinData = [
        { day: 'Mon', mood: 4, stress: 3 },
        { day: 'Tue', mood: 3, stress: 4 },
        { day: 'Wed', mood: 5, stress: 2 },
        { day: 'Thu', mood: 4, stress: 3 },
        { day: 'Fri', mood: 2, stress: 4 },
        { day: 'Sat', mood: 5, stress: 1 },
        { day: 'Sun', mood: 5, stress: 1 },
    ];

    // --- Box Breathing Logic ---
    useEffect(() => {
        let interval: any;
        if (isBreathing) {
            let phaseCounter = 0;
            const nextPhase = () => {
                const phase = phaseCounter % 4;
                setAnimationKey(prev => prev + 1); 
                switch(phase) {
                    case 0: setBreathPhase('inhale'); setBreathInstruction('Inhale... (4s)'); break;
                    case 1: setBreathPhase('hold-in'); setBreathInstruction('Hold... (4s)'); break;
                    case 2: setBreathPhase('exhale'); setBreathInstruction('Exhale... (4s)'); break;
                    case 3: setBreathPhase('hold-out'); setBreathInstruction('Hold... (4s)'); break;
                }
                phaseCounter++;
            };
            nextPhase();
            interval = setInterval(nextPhase, 4000);
        } else {
            setBreathPhase('idle');
            setBreathInstruction('Press Start');
            setAnimationKey(0);
        }
        return () => clearInterval(interval);
    }, [isBreathing]);

    const getAudioContext = () => {
        // Fix: Check if closed and recreate
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            audioCtxRef.current = new AudioContextClass(); // System default rate
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') {
            ctx.resume().catch(err => console.error("Failed to resume audio context", err));
        }
        return ctx;
    };

    const handleGenerateAiMeditation = async () => {
        setAudioError(null);
        if (isPlayingAiAudio) {
            if (aiSourceRef.current) {
                try { aiSourceRef.current.stop(); } catch(e) {}
                aiSourceRef.current = null;
            }
            setIsPlayingAiAudio(false);
            return;
        }

        setIsGeneratingAudio(true);
        const base64Audio = await generateMeditationAudio(mood, stress);
        setIsGeneratingAudio(false);

        if (base64Audio) {
            const ctx = getAudioContext();
            try {
                const audioBuffer = await decodeAudioData(
                    decode(base64Audio),
                    ctx,
                    24000,
                    1
                );
                
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(ctx.destination);
                source.onended = () => setIsPlayingAiAudio(false);
                source.start();
                aiSourceRef.current = source;
                setIsPlayingAiAudio(true);
            } catch (e) {
                console.error("Audio playback failed", e);
                setAudioError("Playback failed.");
            }
        } else {
            setAudioError("AI generation failed. Try again.");
        }
    };

    useEffect(() => {
        return () => {
            if (aiSourceRef.current) {
                try { aiSourceRef.current.stop(); } catch(e) {}
            }
            if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
                audioCtxRef.current.close();
            }
        };
    }, []);

    return (
        <div className="h-full flex flex-col space-y-6">
            {/* Header with Role Toggle */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b-2 border-slate-900 dark:border-slate-100 pb-4">
                <div>
                    <h2 className="text-3xl font-black uppercase flex items-center gap-3">
                        {viewMode === 'student' ? <Heart className="text-red-500 fill-red-500" /> : <Activity className="text-blue-500" />}
                        {viewMode === 'student' ? 'Student Wellness' : 'Counselor Dashboard'}
                    </h2>
                    <p className="font-mono text-slate-500">
                        {viewMode === 'student' 
                            ? 'Your personal space for mental health & focus.' 
                            : 'Monitor class wellbeing and identify at-risk students.'}
                    </p>
                </div>
                
                <div className="flex bg-slate-200 dark:bg-slate-800 p-1 border-2 border-slate-900 dark:border-slate-100">
                    <button 
                        onClick={() => setViewMode('student')}
                        className={`px-4 py-2 text-sm font-bold uppercase transition-all ${viewMode === 'student' ? 'bg-white dark:bg-slate-900 shadow-hard-sm' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        Student
                    </button>
                    <button 
                        onClick={() => setViewMode('counselor')}
                        className={`px-4 py-2 text-sm font-bold uppercase transition-all ${viewMode === 'counselor' ? 'bg-white dark:bg-slate-900 shadow-hard-sm' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        Counselor
                    </button>
                </div>
            </div>

            {viewMode === 'student' ? (
                <div className="flex-1 flex flex-col space-y-6">
                    <div className="flex border-b-2 border-slate-900 dark:border-slate-100">
                        {['checkin', 'relax', 'insights'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`px-6 py-3 font-bold uppercase text-sm border-r-2 border-slate-900 dark:border-slate-100 transition-colors ${
                                    activeTab === tab 
                                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' 
                                    : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                            >
                                {tab === 'checkin' ? 'Check-in' : tab === 'relax' ? 'Relaxation' : 'Insights'}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-auto">
                        {activeTab === 'checkin' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                                <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-100 shadow-hard p-6">
                                    <h3 className="text-xl font-black uppercase mb-6 flex items-center gap-2">
                                        <Smile size={24} /> Mood Tracker
                                    </h3>
                                    <input 
                                        type="range" 
                                        min="1" 
                                        max="5" 
                                        value={mood} 
                                        onChange={(e) => setMood(parseInt(e.target.value))}
                                        className="w-full accent-slate-900 dark:accent-white h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <p className="text-center mt-2 font-mono font-bold">
                                        {mood}/5
                                    </p>
                                </div>

                                <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-100 shadow-hard p-6">
                                    <h3 className="text-xl font-black uppercase mb-6 flex items-center gap-2">
                                        <Activity size={24} /> Stress Level
                                    </h3>
                                    <input 
                                        type="range" 
                                        min="1" 
                                        max="5" 
                                        value={stress} 
                                        onChange={(e) => setStress(parseInt(e.target.value))}
                                        className="w-full accent-slate-900 dark:accent-white h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <p className="text-center mt-2 font-mono font-bold">
                                        {stress}/5
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'relax' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-100 shadow-hard p-8 flex flex-col items-center justify-center min-h-[400px]">
                                    <h3 className="text-2xl font-black uppercase mb-8">Box Breathing</h3>
                                    <div className="relative w-64 h-64 flex items-center justify-center mb-8">
                                        <div className={`absolute w-32 h-32 border-4 border-slate-900 dark:border-slate-100 rounded-full transition-all duration-[4000ms] ease-in-out flex items-center justify-center
                                            ${breathPhase === 'inhale' ? 'scale-150 bg-indigo-100 dark:bg-indigo-900' : ''}
                                            ${breathPhase === 'hold-in' ? 'scale-150 bg-indigo-200 dark:bg-indigo-800' : ''}
                                            ${breathPhase === 'exhale' ? 'scale-100 bg-transparent' : ''}
                                            ${breathPhase === 'hold-out' ? 'scale-100 bg-transparent' : ''}
                                            ${breathPhase === 'idle' ? 'scale-100' : ''}
                                        `}>
                                            <Wind size={48} className={`transition-all duration-[4000ms] ${['inhale', 'hold-in'].includes(breathPhase) ? 'text-indigo-600 scale-125' : 'text-slate-400'}`} />
                                        </div>
                                    </div>
                                    <p className="font-mono text-lg font-bold mb-6 h-8 text-center">{breathInstruction}</p>
                                    <button 
                                        onClick={() => setIsBreathing(!isBreathing)}
                                        className={`px-8 py-3 font-bold uppercase border-2 border-slate-900 shadow-hard hover:shadow-none hover:translate-y-1 transition-all ${isBreathing ? 'bg-red-400 text-slate-900' : 'bg-green-400 text-slate-900'}`}
                                    >
                                        {isBreathing ? 'Stop' : 'Start (4-4-4-4)'}
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-neo-blue p-6 border-2 border-slate-900 shadow-hard">
                                        <h3 className="text-xl font-black uppercase mb-2 flex items-center gap-2">
                                            <Sparkles className="text-white" /> AI Guided Session
                                        </h3>
                                        <p className="font-mono text-sm mb-6 font-bold opacity-80">
                                            Generates a personalized meditation based on your mood ({mood}/5) and stress ({stress}/5).
                                        </p>
                                        
                                        <button 
                                            onClick={handleGenerateAiMeditation}
                                            disabled={isGeneratingAudio}
                                            className={`w-full py-4 bg-white text-slate-900 font-black uppercase border-2 border-slate-900 shadow-hard-sm hover:translate-y-0.5 hover:shadow-none transition-all ${isPlayingAiAudio ? 'bg-red-100' : ''}`}
                                        >
                                            {isGeneratingAudio ? (
                                                <span className="animate-pulse">Synthesizing...</span>
                                            ) : isPlayingAiAudio ? (
                                                <><Pause size={20} /> Stop Session</>
                                            ) : (
                                                <><Play size={20} /> Generate & Play</>
                                            )}
                                        </button>
                                        {audioError && (
                                            <p className="mt-2 text-xs font-bold bg-red-100 text-red-600 p-2 border-l-4 border-red-600">
                                                {audioError}
                                            </p>
                                        )}
                                    </div>
                                    
                                    <div className="p-4 border-2 border-slate-900 dark:border-slate-100 bg-slate-50 dark:bg-slate-800 opacity-50">
                                        <p className="text-center font-mono text-xs font-bold uppercase">Legacy Tracks Disabled</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {activeTab === 'insights' && (
                             <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-100 shadow-hard p-6 w-full min-w-0">
                                <h3 className="text-lg font-black uppercase mb-6">Mood vs Stress History</h3>
                                <div className="h-64 w-full min-w-0">
                                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                        <AreaChart data={checkinData}>
                                            <XAxis dataKey="day" stroke="currentColor" tick={{fontSize: 12, fontWeight: 'bold'}} />
                                            <YAxis stroke="currentColor" tick={{fontSize: 12, fontWeight: 'bold'}} />
                                            <Tooltip contentStyle={{ border: '2px solid currentColor', boxShadow: '4px 4px 0px 0px currentColor', borderRadius: '0px' }} />
                                            <Area type="monotone" dataKey="mood" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                                            <Area type="monotone" dataKey="stress" stackId="2" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center bg-slate-100 dark:bg-slate-800 border-2 border-slate-900 border-dashed">
                    <p className="font-mono font-bold uppercase text-slate-500">Counselor View Placeholder</p>
                </div>
            )}
        </div>
    );
};