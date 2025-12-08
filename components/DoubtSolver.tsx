
import React, { useState, useRef, useEffect } from 'react';
import { Search, ThumbsUp, ThumbsDown, Send, Sparkles, ChevronDown, ChevronUp, Image as ImageIcon, X, Loader2, Mic, MicOff, Globe } from 'lucide-react';
import { solveDoubtWithImage } from '../services/ai';

const FAQS = [
    { id: 1, subject: 'Physics', q: 'What are Newton\'s Three Laws of Motion?', a: '1. Law of Inertia: An object remains at rest or in uniform motion unless acted upon by a force.\n2. F=ma: Force equals mass times acceleration.\n3. Action-Reaction: For every action, there is an equal and opposite reaction.' },
    { id: 2, subject: 'Math', q: 'What is the quadratic formula?', a: 'The quadratic formula is used to solve quadratic equations ax² + bx + c = 0. The formula is: x = [-b ± √(b² - 4ac)] / 2a.' },
];

export const DoubtSolver: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'ask' | 'faq'>('ask');
    const [messages, setMessages] = useState<{role: 'user' | 'model', text: string, image?: string, citations?: any[]}[]>([
        { role: 'model', text: 'Hello! I am your AI Tutor. Upload a math problem, code snippet, or diagram, and I will solve it!' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [useSearch, setUseSearch] = useState(false);
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
    
    // Voice Input State
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);
    
    // Image Upload State
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const clearImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Voice input is not supported in this browser. Please use Chrome or Edge.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            setIsListening(false);
        };
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInput(prev => {
                const trimmed = prev.trim();
                return trimmed ? `${trimmed} ${transcript}` : transcript;
            });
        };

        try {
            recognition.start();
        } catch (error) {
            console.error("Failed to start recognition:", error);
            setIsListening(false);
        }
    };

    const handleSend = async () => {
        if (!input.trim() && !selectedImage) return;
        
        const userMsg = { 
            role: 'user' as const, 
            text: input,
            image: imagePreview || undefined
        };
        
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        const imgToSend = selectedImage; // store ref before clearing
        clearImage();
        setIsTyping(true);

        // Call the multimodal service with search flag
        const response = await solveDoubtWithImage(userMsg.text || "Analyze this image", imgToSend || undefined, useSearch);
        
        // Extract citations from grounding metadata
        let citations: any[] = [];
        if (response.groundingMetadata?.groundingChunks) {
            citations = response.groundingMetadata.groundingChunks
                .filter((c: any) => c.web?.uri)
                .map((c: any) => ({ uri: c.web.uri, title: c.web.title }));
        }
        
        setMessages(prev => [...prev, { role: 'model', text: response.text, citations }]);
        setIsTyping(false);
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex border-b-2 border-slate-900 dark:border-slate-100 mb-6 bg-white dark:bg-slate-900">
                <button 
                    onClick={() => setActiveTab('ask')}
                    className={`flex-1 py-4 font-black uppercase text-center border-r-2 border-slate-900 dark:border-slate-100 transition-colors ${activeTab === 'ask' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                    <span className="flex items-center justify-center gap-2"><Sparkles size={16} /> Multimodal Tutor</span>
                </button>
                <button 
                    onClick={() => setActiveTab('faq')}
                    className={`flex-1 py-4 font-black uppercase text-center transition-colors ${activeTab === 'faq' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                    Common FAQs
                </button>
            </div>

            {activeTab === 'ask' ? (
                <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-100 shadow-hard overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-4 border-2 border-slate-900 dark:border-slate-100 shadow-hard-sm ${
                                    msg.role === 'user' 
                                    ? 'bg-slate-100 dark:bg-slate-800 rounded-tl-xl rounded-bl-xl rounded-br-xl' 
                                    : 'bg-indigo-100 dark:bg-indigo-900/30 rounded-tr-xl rounded-bl-xl rounded-br-xl'
                                }`}>
                                    <div className="flex items-center gap-2 mb-2 opacity-50 text-xs font-bold uppercase font-mono">
                                        {msg.role === 'model' && <Sparkles size={12} />}
                                        {msg.role === 'user' ? 'You' : 'AI Tutor'}
                                    </div>
                                    {msg.image && (
                                        <div className="mb-3 border-2 border-slate-900 overflow-hidden rounded-md bg-white">
                                            <img src={msg.image} alt="User upload" className="max-w-full max-h-60 object-contain" />
                                        </div>
                                    )}
                                    <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                    
                                    {/* Render Citations */}
                                    {msg.citations && msg.citations.length > 0 && (
                                        <div className="mt-4 pt-3 border-t border-slate-900/10 dark:border-white/10">
                                            <p className="text-xs font-bold uppercase mb-2 flex items-center gap-1"><Globe size={12} /> Sources:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {msg.citations.map((cite, cIdx) => (
                                                    <a 
                                                        key={cIdx} 
                                                        href={cite.uri} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="text-[10px] px-2 py-1 bg-white dark:bg-slate-800 border border-slate-900 dark:border-slate-600 rounded-full hover:bg-slate-100 truncate max-w-[150px]"
                                                    >
                                                        {cite.title || cite.uri}
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-slate-100 dark:bg-slate-800 p-4 border-2 border-slate-900 dark:border-slate-100 rounded-tr-xl rounded-bl-xl rounded-br-xl shadow-hard-sm">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 bg-slate-900 dark:bg-white animate-bounce"></span>
                                        <span className="w-2 h-2 bg-slate-900 dark:bg-white animate-bounce delay-75"></span>
                                        <span className="w-2 h-2 bg-slate-900 dark:bg-white animate-bounce delay-150"></span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Image Preview Area */}
                    {imagePreview && (
                        <div className="px-4 pt-2 bg-slate-50 dark:bg-slate-800 border-t-2 border-slate-900 dark:border-slate-100">
                            <div className="relative inline-block">
                                <img src={imagePreview} alt="Preview" className="h-20 w-auto border-2 border-slate-900 rounded-md" />
                                <button onClick={clearImage} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 border-2 border-slate-900 shadow-sm hover:scale-110 transition-transform">
                                    <X size={12} />
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t-2 border-slate-900 dark:border-slate-100">
                        {/* Search Toggle */}
                        <div className="mb-2 flex items-center gap-2">
                            <button 
                                onClick={() => setUseSearch(!useSearch)}
                                className={`text-xs font-bold px-2 py-1 border border-slate-900 rounded-full flex items-center gap-1 transition-all ${useSearch ? 'bg-blue-500 text-white' : 'bg-white text-slate-500'}`}
                            >
                                <Globe size={12} /> Google Grounding {useSearch ? 'ON' : 'OFF'}
                            </button>
                        </div>
                        <div className="flex gap-2">
                             <input 
                                type="file" 
                                ref={fileInputRef}
                                onChange={handleImageSelect}
                                accept="image/*"
                                className="hidden"
                             />
                             <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="px-3 bg-white dark:bg-slate-700 text-slate-900 dark:text-white border-2 border-slate-900 dark:border-slate-100 hover:bg-slate-100 transition-colors"
                                title="Upload Image"
                             >
                                <ImageIcon size={20} />
                             </button>
                             <button 
                                onClick={toggleListening}
                                className={`px-3 border-2 border-slate-900 dark:border-slate-100 transition-colors ${
                                    isListening 
                                    ? 'bg-red-500 text-white animate-pulse' 
                                    : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-100'
                                }`}
                                title={isListening ? "Stop Recording" : "Voice Input"}
                             >
                                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                             </button>
                             <input 
                                type="text" 
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder={selectedImage ? "Add a question about this image..." : isListening ? "Listening... Speak now." : "Type your doubt here..."}
                                className="flex-1 p-3 border-2 border-slate-900 dark:border-slate-100 outline-none focus:bg-white dark:focus:bg-slate-900 font-mono text-sm shadow-inner bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                             />
                             <button 
                                onClick={handleSend}
                                disabled={(!input.trim() && !selectedImage) || isTyping}
                                className="px-6 bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold uppercase border-2 border-slate-900 dark:border-white shadow-hard-sm hover:shadow-none hover:translate-y-1 transition-all disabled:opacity-50 min-w-[80px] flex items-center justify-center"
                             >
                                {isTyping ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                             </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-4 max-w-3xl mx-auto w-full">
                     <div className="relative mb-6">
                        <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
                        <input 
                            type="text" 
                            placeholder="SEARCH FAQS..." 
                            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-100 shadow-hard outline-none font-mono uppercase"
                        />
                     </div>
                     
                     {FAQS.map(faq => (
                         <div key={faq.id} className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-100 shadow-hard transition-all">
                             <button 
                                onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                                className="w-full p-4 flex items-center justify-between text-left font-bold uppercase hover:bg-slate-50 dark:hover:bg-slate-800"
                             >
                                <span className="flex items-center gap-3">
                                    <span className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-1 border border-slate-900 dark:border-slate-500 min-w-[80px] text-center">
                                        {faq.subject}
                                    </span>
                                    {faq.q}
                                </span>
                                {expandedFaq === faq.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                             </button>
                             {expandedFaq === faq.id && (
                                 <div className="p-4 border-t-2 border-slate-900 dark:border-slate-100 bg-slate-50 dark:bg-slate-800 animate-in slide-in-from-top-2">
                                     <p className="font-mono text-sm leading-relaxed mb-4">{faq.a}</p>
                                 </div>
                             )}
                         </div>
                     ))}
                </div>
            )}
        </div>
    );
};
