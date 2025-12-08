
import React, { useState, useEffect } from 'react';
import { PlayCircle, FileText, Download, Clock, Star, X, Play, Pause, Maximize2, Check } from 'lucide-react';

const RESOURCES = [
    { id: 1, title: 'Introduction to Artificial Intelligence', type: 'video', duration: '45 min', rating: 4.8, category: 'CS' },
    { id: 2, title: 'Data Structures: Trees & Graphs', type: 'notes', pages: '12 pgs', rating: 4.5, category: 'CS' },
    { id: 3, title: 'Calculus II: Integration Techniques', type: 'video', duration: '60 min', rating: 4.2, category: 'Math' },
    { id: 4, title: 'Physics: Quantum Mechanics Basics', type: 'video', duration: '30 min', rating: 4.9, category: 'Physics' },
    { id: 5, title: 'System Design Interview Guide', type: 'notes', pages: '25 pgs', rating: 4.7, category: 'Career' },
    { id: 6, title: 'React.js Advanced Patterns', type: 'video', duration: '55 min', rating: 4.6, category: 'Web Dev' },
];

export const LearningHub: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeVideo, setActiveVideo] = useState<typeof RESOURCES[0] | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [downloadedIds, setDownloadedIds] = useState<number[]>([]);

  // Simulate download
  const handleDownload = (id: number) => {
      setDownloadingId(id);
      setTimeout(() => {
          setDownloadingId(null);
          setDownloadedIds(prev => [...prev, id]);
      }, 2000);
  };

  const filteredResources = RESOURCES.filter(res => {
      if (selectedCategory === 'All') return true;
      if (selectedCategory === 'Computer Science') return res.category === 'CS' || res.category === 'Web Dev';
      if (selectedCategory === 'Mathematics') return res.category === 'Math';
      if (selectedCategory === 'Physics') return res.category === 'Physics';
      if (selectedCategory === 'Career') return res.category === 'Career';
      return true;
  });

  return (
    <div className="space-y-8 relative">
        {/* Video Modal */}
        {activeVideo && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in zoom-in duration-200">
                <div className="w-full max-w-4xl bg-slate-900 border-2 border-white shadow-hard-white">
                    <div className="flex justify-between items-center p-4 border-b border-white/20">
                        <h3 className="text-white font-bold uppercase flex items-center gap-2">
                            <PlayCircle size={20} className="text-neo-green" /> {activeVideo.title}
                        </h3>
                        <button onClick={() => setActiveVideo(null)} className="text-white hover:text-neo-pink transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                    {/* Mock Player */}
                    <div className="aspect-video bg-black relative group flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                        <div className="w-full h-full flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center">
                            <button className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full border-2 border-white flex items-center justify-center hover:scale-110 transition-transform group-hover:bg-neo-green group-hover:border-neo-green">
                                <Play size={40} className="text-white fill-white ml-2" />
                            </button>
                        </div>
                        {/* Controls */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="text-white"><Pause size={20} fill="currentColor" /></button>
                            <div className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                                <div className="w-1/3 h-full bg-neo-green"></div>
                            </div>
                            <span className="text-xs font-mono text-white">12:30 / {activeVideo.duration}</span>
                            <button className="text-white"><Maximize2 size={20} /></button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        <div className="bg-indigo-600 dark:bg-indigo-900 p-8 border-2 border-slate-900 dark:border-slate-100 shadow-hard text-white">
            <h2 className="text-3xl font-black uppercase mb-4">Digital Learning Hub</h2>
            <div className="flex flex-wrap gap-4">
                {['All', 'Computer Science', 'Mathematics', 'Physics', 'Career'].map((cat, i) => (
                    <button 
                        key={cat} 
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2 border-2 ${
                            selectedCategory === cat 
                            ? 'bg-white text-slate-900 border-white' 
                            : 'border-white text-white hover:bg-white/10'
                        } font-bold uppercase text-sm shadow-hard-sm transition-all`}
                    >
                        {cat}
                    </button>
                ))}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((res) => (
                <div key={res.id} className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-100 shadow-hard flex flex-col">
                    <div className={`h-40 border-b-2 border-slate-900 dark:border-slate-100 flex items-center justify-center relative overflow-hidden group ${
                        res.type === 'video' ? 'bg-slate-800' : 'bg-yellow-100 dark:bg-yellow-900'
                    }`}>
                        {/* Abstract Pattern */}
                        <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'radial-gradient(circle, #fff 2px, transparent 2px)', backgroundSize: '20px 20px'}}></div>
                        
                        <button 
                            onClick={() => res.type === 'video' && setActiveVideo(res)}
                            className="relative z-10"
                        >
                            {res.type === 'video' ? (
                                <PlayCircle size={48} className="text-white group-hover:scale-110 transition-transform duration-300 cursor-pointer" />
                            ) : (
                                <FileText size={48} className="text-slate-900 dark:text-white group-hover:scale-110 transition-transform duration-300" />
                            )}
                        </button>
                        <span className="absolute top-3 right-3 px-2 py-1 bg-white dark:bg-slate-900 text-xs font-bold border-2 border-slate-900 dark:border-slate-100 uppercase">
                            {res.category}
                        </span>
                    </div>
                    
                    <div className="p-5 flex-1 flex flex-col">
                        <h3 className="font-bold text-lg leading-tight mb-2 line-clamp-2 uppercase">{res.title}</h3>
                        
                        <div className="mt-auto pt-4 flex items-center justify-between text-xs font-mono text-slate-500">
                             <div className="flex items-center gap-1">
                                {res.type === 'video' ? <Clock size={14} /> : <FileText size={14} />}
                                {res.type === 'video' ? res.duration : res.pages}
                             </div>
                             <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 font-bold">
                                <Star size={14} fill="currentColor" /> {res.rating}
                             </div>
                        </div>
                    </div>

                    <button 
                        onClick={() => {
                            if (res.type === 'video') setActiveVideo(res);
                            else if (!downloadingId && !downloadedIds.includes(res.id)) handleDownload(res.id);
                        }}
                        className={`w-full py-3 border-t-2 border-slate-900 dark:border-slate-100 font-bold uppercase text-sm transition-all flex items-center justify-center gap-2 ${
                            downloadedIds.includes(res.id) && res.type !== 'video' 
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900'
                        }`}
                    >
                        {res.type === 'video' ? (
                            <>Watch Now <Play size={14} /></>
                        ) : downloadingId === res.id ? (
                            <>Downloading... <span className="animate-spin">⏳</span></>
                        ) : downloadedIds.includes(res.id) ? (
                            <>Downloaded <Check size={14} /></>
                        ) : (
                            <>Download PDF <Download size={14} /></>
                        )}
                    </button>
                </div>
            ))}
        </div>
    </div>
  );
};
