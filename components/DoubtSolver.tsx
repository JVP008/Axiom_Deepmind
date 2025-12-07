import React, { useState } from 'react';
import { MessageSquare, Search, ThumbsUp, ThumbsDown, Send, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { chatWithBot } from '../services/ai';

const FAQS = [
    { id: 1, subject: 'Physics', q: 'What are Newton\'s Three Laws of Motion?', a: '1. Law of Inertia: An object remains at rest or in uniform motion unless acted upon by a force.\n2. F=ma: Force equals mass times acceleration.\n3. Action-Reaction: For every action, there is an equal and opposite reaction.' },
    { id: 2, subject: 'Math', q: 'What is the quadratic formula?', a: 'The quadratic formula is used to solve quadratic equations ax² + bx + c = 0. The formula is: x = [-b ± √(b² - 4ac)] / 2a.' },
    { id: 3, subject: 'Chemistry', q: 'Difference between Acid and Base?', a: 'Acids donate protons (H+) and have pH < 7. Bases accept protons (release OH-) and have pH > 7. Acids turn blue litmus red; bases turn red litmus blue.' },
    { id: 4, subject: 'Biology', q: 'What is photosynthesis?', a: 'Photosynthesis is the process by which green plants use sunlight to synthesize nutrients from CO2 and water. Equation: 6CO2 + 6H2O + Light → C6H12O6 + 6O2.' },
];

export const DoubtSolver: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'ask' | 'faq'>('ask');
    const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([
        { role: 'model', text: 'Hello! I am your AI Doubt Solver. Ask me anything about your studies.' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

    const handleSend = async () => {
        if (!input.trim()) return;
        const userMsg = { role: 'user' as const, text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        const responseText = await chatWithBot(messages, userMsg.text);
        
        setMessages(prev => [...prev, { role: 'model', text: responseText }]);
        setIsTyping(false);
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex border-b-2 border-slate-900 dark:border-slate-100 mb-6 bg-white dark:bg-slate-900">
                <button 
                    onClick={() => setActiveTab('ask')}
                    className={`flex-1 py-4 font-black uppercase text-center border-r-2 border-slate-900 dark:border-slate-100 transition-colors ${activeTab === 'ask' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                    Ask AI Tutor
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
                                    <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.text}</p>
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
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t-2 border-slate-900 dark:border-slate-100">
                        <div className="flex gap-2">
                             <input 
                                type="text" 
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Type your doubt here..."
                                className="flex-1 p-3 border-2 border-slate-900 dark:border-slate-100 outline-none focus:bg-white dark:focus:bg-slate-900 font-mono text-sm shadow-inner bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                             />
                             <button 
                                onClick={handleSend}
                                disabled={!input.trim() || isTyping}
                                className="px-6 bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold uppercase border-2 border-slate-900 dark:border-white shadow-hard-sm hover:shadow-none hover:translate-y-1 transition-all disabled:opacity-50"
                             >
                                <Send size={20} />
                             </button>
                        </div>
                        <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                            {['Explain Calculus', 'Chemical Bonding', 'Essay Tips', 'Newton\'s Laws'].map(prompt => (
                                <button 
                                    key={prompt}
                                    onClick={() => setInput(prompt)}
                                    className="whitespace-nowrap px-3 py-1 bg-white border-2 border-slate-900 text-slate-900 text-xs font-bold uppercase hover:bg-neo-yellow hover:-translate-y-0.5 transition-all shadow-sm"
                                >
                                    {prompt}
                                </button>
                            ))}
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
                                     <div className="flex gap-4">
                                         <button className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-green-600">
                                            <ThumbsUp size={14} /> Helpful
                                         </button>
                                         <button className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-red-600">
                                            <ThumbsDown size={14} /> Not Helpful
                                         </button>
                                     </div>
                                 </div>
                             )}
                         </div>
                     ))}
                </div>
            )}
        </div>
    );
};