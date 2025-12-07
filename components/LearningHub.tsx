import React, { useState } from 'react';
import { PlayCircle, FileText, Download, Clock, Star } from 'lucide-react';

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

  const filteredResources = RESOURCES.filter(res => {
      if (selectedCategory === 'All') return true;
      if (selectedCategory === 'Computer Science') return res.category === 'CS' || res.category === 'Web Dev';
      if (selectedCategory === 'Mathematics') return res.category === 'Math';
      if (selectedCategory === 'Physics') return res.category === 'Physics';
      if (selectedCategory === 'Career') return res.category === 'Career';
      return true;
  });

  return (
    <div className="space-y-8">
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
                        
                        {res.type === 'video' ? (
                            <PlayCircle size={48} className="text-white relative z-10 group-hover:scale-110 transition-transform duration-300" />
                        ) : (
                            <FileText size={48} className="text-slate-900 dark:text-white relative z-10 group-hover:scale-110 transition-transform duration-300" />
                        )}
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

                    <button className="w-full py-3 bg-slate-50 dark:bg-slate-800 border-t-2 border-slate-900 dark:border-slate-100 font-bold uppercase text-sm hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-colors flex items-center justify-center gap-2">
                        {res.type === 'video' ? 'Watch Now' : 'Download PDF'} 
                        {res.type !== 'video' && <Download size={14} />}
                    </button>
                </div>
            ))}
        </div>
    </div>
  );
};