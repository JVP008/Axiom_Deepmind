import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, MessageSquare, Maximize2, Minimize2, GripHorizontal } from 'lucide-react';
import { chatWithBot } from '../services/ai';
import { ChatMessage } from '../types';

export const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'model', text: 'SYSTEM ONLINE. How can I assist?', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Position State
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [initialized, setInitialized] = useState(false);
  
  // Refs for drag calculations
  const dragStart = useRef({ x: 0, y: 0 });
  const startPos = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);

  useEffect(() => {
    // Initialize to bottom-right corner on mount
    setPosition({ x: window.innerWidth - 80, y: window.innerHeight - 80 });
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  // Drag Event Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent text selection
    setIsDragging(true);
    hasMoved.current = false;
    dragStart.current = { x: e.clientX, y: e.clientY };
    startPos.current = { ...position };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
        
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;
        
        // If moved more than 5px, treat as drag instead of click
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
            hasMoved.current = true;
        }

        // Clamp to window bounds
        const newX = Math.max(0, Math.min(window.innerWidth - 50, startPos.current.x + dx));
        const newY = Math.max(0, Math.min(window.innerHeight - 50, startPos.current.y + dy));

        setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    if (isDragging) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const toggleOpen = () => {
    if (!hasMoved.current) {
        setIsOpen(!isOpen);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const history = messages.map(m => ({ role: m.role, text: m.text }));
    const responseText = await chatWithBot(history, userMsg.text);

    const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
    };

    setMessages(prev => [...prev, botMsg]);
    setIsTyping(false);
  };

  if (!initialized) return null;

  // Calculate anchor direction based on screen quadrant
  const isRight = position.x > window.innerWidth / 2;
  const isBottom = position.y > window.innerHeight / 2;
  
  // Transform origin for the window expansion
  const transformStyle = {
      transform: `translate(${isRight ? '-100%' : '0'}, ${isBottom ? '-100%' : '0'})`,
      marginTop: isBottom ? '-16px' : '16px', // spacing from cursor/button
      marginLeft: isRight ? '-16px' : '16px'
  };

  return (
    <div 
        style={{ left: position.x, top: position.y }}
        className="fixed z-50 touch-none"
    >
      {!isOpen ? (
        <button 
            onMouseDown={handleMouseDown}
            onClick={toggleOpen}
            className="w-12 h-12 bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-2 border-slate-900 dark:border-slate-100 shadow-hard flex items-center justify-center transition-transform hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-move active:cursor-grabbing"
            title="Drag to move, Click to open"
        >
          <MessageSquare size={20} />
        </button>
      ) : (
        <div 
            style={transformStyle}
            className={`bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-100 shadow-hard flex flex-col transition-all ${isExpanded ? 'w-[800px] h-[600px]' : 'w-[350px] h-[500px]'}`}
        >
          {/* Header - OS Window Style - DRAGGABLE */}
          <div 
            onMouseDown={handleMouseDown}
            className="flex items-center justify-between p-2 border-b-2 border-slate-900 dark:border-slate-100 bg-indigo-600 dark:bg-indigo-900 text-white cursor-move select-none active:cursor-grabbing"
          >
            <div className="flex items-center gap-2 pl-2">
                <GripHorizontal size={16} className="opacity-50" />
                <Bot size={18} />
                <h3 className="font-bold font-mono text-sm uppercase">AXIOM_AI.exe</h3>
            </div>
            <div className="flex items-center gap-2">
                <button 
                    onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }} 
                    className="w-6 h-6 flex items-center justify-center border-2 border-white hover:bg-white hover:text-indigo-600 transition-colors"
                >
                    {isExpanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} 
                    className="w-6 h-6 flex items-center justify-center border-2 border-white hover:bg-red-500 hover:text-white transition-colors"
                >
                    <X size={14} />
                </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-800" ref={scrollRef}>
            {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 border-2 border-slate-900 dark:border-slate-100 text-sm font-medium shadow-hard-sm ${
                        msg.role === 'user' 
                        ? 'bg-white dark:bg-slate-900 mr-1' 
                        : 'bg-yellow-100 dark:bg-slate-700 ml-1'
                    }`}>
                        <span className="block text-[10px] font-mono opacity-50 mb-1 uppercase">{msg.role}</span>
                        {msg.text}
                    </div>
                </div>
            ))}
            {isTyping && (
                <div className="flex justify-start">
                     <div className="bg-yellow-100 dark:bg-slate-700 p-3 border-2 border-slate-900 dark:border-slate-100 shadow-hard-sm flex gap-1">
                        <span className="w-2 h-2 bg-slate-900 dark:bg-white animate-pulse"></span>
                        <span className="w-2 h-2 bg-slate-900 dark:bg-white animate-pulse delay-75"></span>
                        <span className="w-2 h-2 bg-slate-900 dark:bg-white animate-pulse delay-150"></span>
                     </div>
                </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t-2 border-slate-900 dark:border-slate-100">
            <div className="flex gap-2">
                <input 
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="TYPE COMMAND..."
                    className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 border-2 border-slate-900 dark:border-slate-100 outline-none focus:bg-white font-mono text-sm"
                />
                <button 
                    onClick={handleSend}
                    disabled={!input.trim() || isTyping}
                    className="p-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-2 border-slate-900 dark:border-white hover:bg-indigo-600 hover:border-indigo-600 dark:hover:bg-indigo-400 transition-colors disabled:opacity-50"
                >
                    <Send size={20} />
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};