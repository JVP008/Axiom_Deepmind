
import React, { useState, useEffect, useRef } from 'react';
import { Heart, Moon, Smile, Wind, Music, Volume2, Cloud, Activity, Frown, Meh, BarChart2, Play, Pause, Coffee } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const Wellness: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'checkin' | 'relax' | 'insights'>('checkin');
    
    // Check-in State
    const [mood, setMood] = useState(3);
    const [stress, setStress] = useState(2);
    const [sleep, setSleep] = useState(7);

    // Breathing State
    const [isBreathing, setIsBreathing] = useState(false);
    const [breathPhase, setBreathPhase] = useState<'idle' | 'inhale' | 'hold-in' | 'exhale' | 'hold-out'>('idle');
    const [breathInstruction, setBreathInstruction] = useState('Ready?');
    // We use this key to force the SVG circle to remount and restart its CSS animation
    const [animationKey, setAnimationKey] = useState(0); 

    // Audio/Relaxation State
    const [activeTrackIdx, setActiveTrackIdx] = useState<number | null>(null);
    const [trackTimeLeft, setTrackTimeLeft] = useState(0);
    const [isTrackPlaying, setIsTrackPlaying] = useState(false);
    
    // Refs for Audio Context
    const audioCtxRef = useRef<AudioContext | null>(null);
    // Store all active source nodes (Oscillators or AudioBufferSourceNode) to stop them later
    const sourceNodesRef = useRef<(OscillatorNode | AudioBufferSourceNode)[]>([]);
    const gainNodeRef = useRef<GainNode | null>(null);

    const checkinData = [
        { day: 'Mon', mood: 4, stress: 3 },
        { day: 'Tue', mood: 3, stress: 4 },
        { day: 'Wed', mood: 5, stress: 2 },
        { day: 'Thu', mood: 4, stress: 3 },
        { day: 'Fri', mood: 2, stress: 4 },
        { day: 'Sat', mood: 5, stress: 1 },
        { day: 'Sun', mood: 5, stress: 1 },
    ];

    const RELAXATION_TRACKS = [
        { title: 'Guided Mindfulness', duration: 600, label: '10 min', icon: <Cloud size={20} />, color: 'bg-blue-200', desc: 'Scan your body and release tension.' },
        { title: 'Lo-Fi Focus', duration: 1800, label: '30 min', icon: <Coffee size={20} />, color: 'bg-purple-200', desc: 'Warm, cozy beats for deep study.' },
        { title: 'Rain & Thunder', duration: 1200, label: '20 min', icon: <Volume2 size={20} />, color: 'bg-green-200', desc: 'Natural white noise for calming.' },
        { title: 'PMR Soundscape', duration: 900, label: '15 min', icon: <Activity size={20} />, color: 'bg-yellow-200', desc: 'Deep grounding tones for relaxation.' }
    ];

    // --- Box Breathing Logic ---
    useEffect(() => {
        let interval: any;
        
        if (isBreathing) {
            // Cycle: Inhale (4s) -> Hold (4s) -> Exhale (4s) -> Hold (4s)
            let phaseCounter = 0;
            
            // Function to advance phase
            const nextPhase = () => {
                const phase = phaseCounter % 4;
                // Update key to restart animation
                setAnimationKey(prev => prev + 1); 

                switch(phase) {
                    case 0:
                        setBreathPhase('inhale');
                        setBreathInstruction('Inhale... (4s)');
                        break;
                    case 1:
                        setBreathPhase('hold-in');
                        setBreathInstruction('Hold... (4s)');
                        break;
                    case 2:
                        setBreathPhase('exhale');
                        setBreathInstruction('Exhale... (4s)');
                        break;
                    case 3:
                        setBreathPhase('hold-out');
                        setBreathInstruction('Hold... (4s)');
                        break;
                }
                phaseCounter++;
            };

            // Start immediately
            nextPhase();
            
            // Interval for 4 seconds
            interval = setInterval(nextPhase, 4000);
        } else {
            setBreathPhase('idle');
            setBreathInstruction('Press Start');
            setAnimationKey(0);
        }

        return () => clearInterval(interval);
    }, [isBreathing]);

    // --- Audio Engine Logic ---
    const stopAudio = () => {
        if (sourceNodesRef.current.length > 0) {
            sourceNodesRef.current.forEach(node => {
                try { 
                    (node as any).stop(); 
                    node.disconnect();
                } catch(e) {}
            });
            sourceNodesRef.current = [];
        }
    };

    const getAudioContext = () => {
        if (!audioCtxRef.current) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            audioCtxRef.current = new AudioContextClass();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
        return ctx;
    };

    // GENERATOR: Lo-Fi Focus (Warm Pad + Vinyl Crackle)
    const playLofiFocus = (ctx: AudioContext, masterGain: GainNode) => {
        // 1. Vinyl/Tape Noise Layer
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.5; // White noise
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;
        
        // Filter noise to sound like crackle/hiss
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = 1000;
        
        const noiseGain = ctx.createGain();
        noiseGain.gain.value = 0.08; // Subtle background texture

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(masterGain);
        noise.start();

        // 2. Warm Keys (Chords) - Eb Major 7ish
        // Using Triangle waves with heavy Lowpass for "Electric Piano" feel
        const oscillators: OscillatorNode[] = [];
        const freqs = [155.56, 196.00, 233.08, 293.66]; // Eb3, G3, Bb3, D4
        
        // LFO for "Wobble" (Tape Instability)
        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.3; // Very slow
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 1.5; // Slight pitch shift
        lfo.start();

        freqs.forEach((f, i) => {
            const osc = ctx.createOscillator();
            osc.type = i % 2 === 0 ? 'triangle' : 'sine'; // Mix waveforms
            osc.frequency.value = f;
            
            // Apply wobble
            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);

            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 400; // Muffled warm sound

            const oscGain = ctx.createGain();
            oscGain.gain.value = 0.15 / freqs.length; // Normalize volume

            osc.connect(filter);
            filter.connect(oscGain);
            oscGain.connect(masterGain);
            osc.start();
            oscillators.push(osc);
        });

        return [noise, lfo, ...oscillators];
    };

    // GENERATOR: Rain (Filtered Noise)
    const playRain = (ctx: AudioContext, masterGain: GainNode) => {
        const bufferSize = ctx.sampleRate * 2; // 2 seconds buffer
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        // Fill with white noise
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        // Lowpass filter to simulate heavy rain/rumble
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 600; 

        noise.connect(filter);
        filter.connect(masterGain);
        noise.start();
        return [noise];
    };

    // GENERATOR: Ambient Pad (For Mindfulness)
    const playAmbient = (ctx: AudioContext, masterGain: GainNode) => {
        const nodes: OscillatorNode[] = [];
        // A major chord (A3, C#4, E4)
        const freqs = [220.00, 277.18, 329.63]; 
        
        freqs.forEach(f => {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = f;
            
            const oscGain = ctx.createGain();
            oscGain.gain.value = 0.15; // Lower individual gain
            
            osc.connect(oscGain);
            oscGain.connect(masterGain);
            osc.start();
            nodes.push(osc);
        });
        return nodes;
    };

    // GENERATOR: PMR Ambience (Breathing Bass)
    const playPmrAmbience = (ctx: AudioContext, masterGain: GainNode) => {
        // A deeply soothing, slow-moving drone for body relaxation
        // Matches the "tensing and releasing" concept with volume swells
        
        // Root tone (Low F)
        const osc1 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.value = 87.31; // F2
        
        // Fifth (C)
        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = 130.81; // C3

        // LFO for gentle amplitude modulation (breathing effect)
        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.1; // 10 seconds cycle (Slow breathing rate)
        
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 0.05; // Modulation depth

        // Base gain
        const oscGain = ctx.createGain();
        oscGain.gain.value = 0.15;
        
        // Connect LFO to gain to create "swells"
        lfo.connect(lfoGain);
        lfoGain.connect(oscGain.gain);

        osc1.connect(oscGain);
        osc2.connect(oscGain);
        oscGain.connect(masterGain);

        osc1.start();
        osc2.start();
        lfo.start();
        
        return [osc1, osc2, lfo];
    };


    // Main Play Function
    const startTrackAudio = (title: string) => {
        stopAudio();
        const ctx = getAudioContext();
        
        // Master Volume
        const masterGain = ctx.createGain();
        masterGain.gain.value = 0.4;
        masterGain.connect(ctx.destination);
        gainNodeRef.current = masterGain;

        let newNodes: (OscillatorNode | AudioBufferSourceNode)[] = [];

        switch(title) {
            case 'Lo-Fi Focus':
                newNodes = playLofiFocus(ctx, masterGain);
                break;
            case 'Rain & Thunder':
                newNodes = playRain(ctx, masterGain);
                break;
            case 'Guided Mindfulness':
                newNodes = playAmbient(ctx, masterGain);
                break;
            case 'PMR Soundscape':
                newNodes = playPmrAmbience(ctx, masterGain);
                break;
            default:
                break;
        }
        
        sourceNodesRef.current = newNodes;
    };

    // --- Player Timer Logic ---
    useEffect(() => {
        let interval: any;
        if (isTrackPlaying && trackTimeLeft > 0) {
            interval = setInterval(() => {
                setTrackTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (trackTimeLeft === 0 && isTrackPlaying) {
            setIsTrackPlaying(false);
            setActiveTrackIdx(null);
            stopAudio();
        }
        return () => clearInterval(interval);
    }, [isTrackPlaying, trackTimeLeft]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopAudio();
            if (audioCtxRef.current) {
                audioCtxRef.current.close();
            }
        };
    }, []);

    const handleTrackClick = (idx: number) => {
        const track = RELAXATION_TRACKS[idx];

        if (activeTrackIdx === idx) {
            // Toggle play/pause
            if (isTrackPlaying) {
                setIsTrackPlaying(false);
                stopAudio();
            } else {
                setIsTrackPlaying(true);
                startTrackAudio(track.title);
            }
        } else {
            // Start new track
            setActiveTrackIdx(idx);
            setTrackTimeLeft(track.duration);
            setIsTrackPlaying(true);
            startTrackAudio(track.title);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Tabs */}
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
                        {tab === 'checkin' ? 'Daily Check-in' : tab === 'relax' ? 'Relaxation' : 'Insights'}
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
                            <div className="flex justify-between items-center mb-4">
                                <Frown size={32} className={`transition-colors ${mood <= 2 ? 'text-red-500' : 'text-slate-300'}`} />
                                <Meh size={32} className={`transition-colors ${mood === 3 ? 'text-yellow-500' : 'text-slate-300'}`} />
                                <Smile size={32} className={`transition-colors ${mood >= 4 ? 'text-green-500' : 'text-slate-300'}`} />
                            </div>
                            <input 
                                type="range" 
                                min="1" 
                                max="5" 
                                value={mood} 
                                onChange={(e) => setMood(parseInt(e.target.value))}
                                className="w-full accent-slate-900 dark:accent-white h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <p className="text-center mt-2 font-mono font-bold">
                                {mood === 1 ? 'Very Low' : mood === 2 ? 'Low' : mood === 3 ? 'Neutral' : mood === 4 ? 'Good' : 'Excellent'}
                            </p>
                        </div>

                        <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-100 shadow-hard p-6">
                            <h3 className="text-xl font-black uppercase mb-6 flex items-center gap-2">
                                <Activity size={24} /> Stress Level
                            </h3>
                            <div className="text-center mb-4">
                                <span className={`text-4xl font-black ${stress >= 4 ? 'text-red-500' : stress >= 3 ? 'text-orange-500' : 'text-green-500'}`}>
                                    {stress}/5
                                </span>
                            </div>
                            <input 
                                type="range" 
                                min="1" 
                                max="5" 
                                value={stress} 
                                onChange={(e) => setStress(parseInt(e.target.value))}
                                className="w-full accent-slate-900 dark:accent-white h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                            />
                             <p className="text-center mt-2 font-mono font-bold">
                                {stress <= 2 ? 'Low Stress' : stress === 3 ? 'Moderate' : 'High Stress'}
                            </p>
                        </div>

                        <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-100 shadow-hard p-6 md:col-span-2">
                            <h3 className="text-xl font-black uppercase mb-6 flex items-center gap-2">
                                <Moon size={24} /> Sleep Tracker
                            </h3>
                            <div className="flex items-center gap-4">
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="12" 
                                    step="0.5"
                                    value={sleep} 
                                    onChange={(e) => setSleep(parseFloat(e.target.value))}
                                    className="flex-1 accent-slate-900 dark:accent-white h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="text-2xl font-black font-mono w-24 text-right whitespace-nowrap">{sleep} hrs</span>
                            </div>
                            {sleep < 7 && (
                                <p className="mt-4 text-sm font-bold text-red-500 flex items-center gap-2">
                                    <Activity size={16} /> Aim for at least 7-8 hours for better cognitive function.
                                </p>
                            )}
                        </div>

                        <button className="md:col-span-2 py-4 bg-indigo-600 text-white font-black uppercase text-lg border-2 border-slate-900 shadow-hard hover:shadow-none hover:translate-y-1 transition-all">
                            Save Check-in
                        </button>
                    </div>
                )}

                {activeTab === 'relax' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Box Breathing Section */}
                        <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-100 shadow-hard p-8 flex flex-col items-center justify-center min-h-[400px]">
                            <h3 className="text-2xl font-black uppercase mb-8">Box Breathing</h3>
                            
                            <div className="relative w-64 h-64 flex items-center justify-center mb-8">
                                {/* Base Circle - Handles Expansion/Contraction */}
                                <div className={`absolute w-32 h-32 border-4 border-slate-900 dark:border-slate-100 rounded-full transition-all duration-[4000ms] ease-in-out flex items-center justify-center
                                    ${breathPhase === 'inhale' ? 'scale-150 bg-indigo-100 dark:bg-indigo-900' : ''}
                                    ${breathPhase === 'hold-in' ? 'scale-150 bg-indigo-200 dark:bg-indigo-800' : ''}
                                    ${breathPhase === 'exhale' ? 'scale-100 bg-transparent' : ''}
                                    ${breathPhase === 'hold-out' ? 'scale-100 bg-transparent' : ''}
                                    ${breathPhase === 'idle' ? 'scale-100' : ''}
                                `}>
                                    <Wind size={48} className={`transition-all duration-[4000ms] ${['inhale', 'hold-in'].includes(breathPhase) ? 'text-indigo-600 scale-125' : 'text-slate-400'}`} />
                                </div>
                                
                                {/* Progress Ring (Visual Aid) - Handles 4s Timer Visualization */}
                                {/* By changing the key, we force the circle to remount, thus restarting the transition */}
                                <svg className="absolute w-full h-full rotate-[-90deg]">
                                    <circle 
                                        key={animationKey}
                                        cx="128" cy="128" r="60" 
                                        fill="none" 
                                        stroke={isBreathing ? "#6366f1" : "transparent"} 
                                        strokeWidth="4" 
                                        strokeDasharray="377" 
                                        strokeDashoffset={isBreathing ? "0" : "377"}
                                        className="transition-all duration-[4000ms] linear"
                                        // Force starting state via style to ensure transition happens from 377 -> 0
                                        style={{ strokeDashoffset: isBreathing ? 0 : 377 }}
                                    />
                                </svg>
                            </div>

                            <p className="font-mono text-lg font-bold mb-6 h-8 text-center">{breathInstruction}</p>

                            <button 
                                onClick={() => setIsBreathing(!isBreathing)}
                                className={`px-8 py-3 font-bold uppercase border-2 border-slate-900 shadow-hard hover:shadow-none hover:translate-y-1 transition-all ${isBreathing ? 'bg-red-400 text-slate-900' : 'bg-green-400 text-slate-900'}`}
                            >
                                {isBreathing ? 'Stop Session' : 'Start (4-4-4-4)'}
                            </button>
                        </div>

                        {/* Audio Tracks Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-black uppercase mb-4 border-b-2 border-slate-900 dark:border-slate-100 pb-2">Audio Therapy</h3>
                            {RELAXATION_TRACKS.map((track, idx) => {
                                const isActive = activeTrackIdx === idx;
                                const progress = isActive ? ((track.duration - trackTimeLeft) / track.duration) * 100 : 0;
                                
                                return (
                                    <div 
                                        key={idx} 
                                        onClick={() => handleTrackClick(idx)}
                                        className={`relative bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-100 shadow-hard-sm p-4 cursor-pointer group hover:-translate-y-1 transition-transform overflow-hidden ${isActive ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900' : ''}`}
                                    >
                                        {/* Progress Bar Background */}
                                        {isActive && (
                                            <div 
                                                className="absolute left-0 bottom-0 h-1 bg-indigo-500 transition-all duration-1000 linear"
                                                style={{ width: `${progress}%` }}
                                            />
                                        )}
                                        
                                        <div className="flex items-center justify-between relative z-10">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 border-2 border-slate-900 dark:border-slate-100 ${track.color} text-slate-900`}>
                                                    {track.icon}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold uppercase flex items-center gap-2">
                                                        {track.title}
                                                        {isActive && <span className="text-[10px] bg-red-500 text-white px-1 animate-pulse">LIVE</span>}
                                                    </h4>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{track.desc}</p>
                                                    <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 border border-slate-900 dark:border-slate-600">
                                                        {isActive ? formatTime(trackTimeLeft) : track.label}
                                                    </span>
                                                </div>
                                            </div>
                                            <button className={`w-10 h-10 flex items-center justify-center border-2 border-slate-900 dark:border-slate-100 rounded-full transition-all ${isActive && isTrackPlaying ? 'bg-indigo-600 text-white' : 'bg-white text-slate-900 hover:bg-slate-100'}`}>
                                                {isActive && isTrackPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {activeTab === 'insights' && (
                    <div className="space-y-8">
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: 'Avg Mood', val: 'Good', icon: <Smile size={20} />, color: 'bg-green-300' },
                                { label: 'Avg Stress', val: 'Low', icon: <Activity size={20} />, color: 'bg-blue-300' },
                                { label: 'Avg Sleep', val: '6.8h', icon: <Moon size={20} />, color: 'bg-yellow-300' },
                                { label: 'Mood Trend', val: '+12%', icon: <BarChart2 size={20} />, color: 'bg-purple-300' }
                            ].map((stat, i) => (
                                <div key={i} className={`p-4 border-2 border-slate-900 dark:border-slate-100 shadow-hard-sm ${stat.color} text-slate-900`}>
                                    <div className="flex justify-between items-start mb-2">
                                        {stat.icon}
                                    </div>
                                    <p className="text-xs font-bold uppercase opacity-75">{stat.label}</p>
                                    <p className="text-xl font-black">{stat.val}</p>
                                </div>
                            ))}
                        </div>

                        <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-100 shadow-hard p-6 w-full min-w-0">
                             <h3 className="text-lg font-black uppercase mb-6">Mood vs Stress History</h3>
                             <div className="h-64 w-full min-w-0">
                                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                    <AreaChart data={checkinData}>
                                        <XAxis dataKey="day" stroke="currentColor" tick={{fontSize: 12, fontWeight: 'bold'}} />
                                        <YAxis stroke="currentColor" tick={{fontSize: 12, fontWeight: 'bold'}} />
                                        <Tooltip 
                                            contentStyle={{ 
                                                border: '2px solid currentColor', 
                                                boxShadow: '4px 4px 0px 0px currentColor',
                                                borderRadius: '0px'
                                            }}
                                        />
                                        <Area type="monotone" dataKey="mood" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                                        <Area type="monotone" dataKey="stress" stackId="2" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} />
                                    </AreaChart>
                                </ResponsiveContainer>
                             </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
