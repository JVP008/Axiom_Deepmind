import React, { useState } from 'react';
import { STUDENTS } from '../constants';
import { getCareerAdvice } from '../services/ai';
import { CareerPath, Student } from '../types';
import { Sparkles, ArrowRight, Loader2, BookOpen, Compass } from 'lucide-react';

export const CareerAdvisor: React.FC = () => {
  const [selectedStudent, setSelectedStudent] = useState<Student>(STUDENTS[0]);
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState<{ analysis: string; careers: CareerPath[] } | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setAdvice(null);
    try {
        const result = await getCareerAdvice(selectedStudent);
        if (result) setAdvice(result);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Sidebar: Student Selection & Profile */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white dark:bg-slate-900 p-6 border-2 border-slate-900 dark:border-slate-100 shadow-hard">
          <label className="block font-bold text-sm uppercase mb-2 font-mono text-indigo-600 dark:text-indigo-400">Select Student Profile</label>
          <div className="relative">
            <select 
                className="w-full p-3 bg-white dark:bg-slate-800 border-2 border-slate-900 dark:border-slate-100 rounded-none outline-none focus:bg-indigo-50 appearance-none font-medium"
                value={selectedStudent.id}
                onChange={(e) => {
                    const s = STUDENTS.find(st => st.id === e.target.value);
                    if (s) setSelectedStudent(s);
                    setAdvice(null);
                }}
            >
                {STUDENTS.map(s => (
                    <option key={s.id} value={s.id}>{s.name} — {s.rollNumber}</option>
                ))}
            </select>
            <div className="absolute right-3 top-4 pointer-events-none border-t-8 border-l-4 border-r-4 border-t-slate-900 dark:border-t-slate-100 border-l-transparent border-r-transparent"></div>
          </div>

          <div className="mt-8 space-y-6">
             <div className="p-4 border-2 border-slate-900 dark:border-slate-100 bg-slate-50 dark:bg-slate-800 relative">
                <h4 className="absolute -top-3 left-3 px-2 bg-neo-green text-slate-900 text-xs font-bold border-2 border-slate-900">ACADEMIC STRENGTHS</h4>
                <div className="flex flex-wrap gap-2 mt-2">
                    {selectedStudent.grades.filter(g => g.score > 80).map((g, i) => (
                        <span key={i} className="px-2 py-1 bg-white text-slate-900 text-xs font-bold border border-slate-900 shadow-sm">
                            {g.subject} ({g.score}%)
                        </span>
                    ))}
                </div>
             </div>
             
             <div className="p-4 border-2 border-slate-900 dark:border-slate-100 bg-slate-50 dark:bg-slate-800 relative">
                <h4 className="absolute -top-3 left-3 px-2 bg-neo-blue text-slate-900 text-xs font-bold border-2 border-slate-900">SKILLS</h4>
                <div className="flex flex-wrap gap-2 mt-2">
                    {selectedStudent.skills.map((skill, i) => (
                        <span key={i} className="px-2 py-1 bg-white text-slate-900 text-xs font-bold border border-slate-900 shadow-sm">
                            {skill}
                        </span>
                    ))}
                </div>
             </div>

             <div className="p-4 border-2 border-slate-900 dark:border-slate-100 bg-slate-50 dark:bg-slate-800 relative">
                <h4 className="absolute -top-3 left-3 px-2 bg-neo-pink text-slate-900 text-xs font-bold border-2 border-slate-900">INTERESTS</h4>
                <div className="flex flex-wrap gap-2 mt-2">
                    {selectedStudent.interests.map((int, i) => (
                        <span key={i} className="px-2 py-1 bg-white text-slate-900 text-xs font-bold border border-slate-900 shadow-sm">
                            {int}
                        </span>
                    ))}
                </div>
             </div>
          </div>

          <button 
            onClick={handleGenerate}
            disabled={loading}
            className="mt-8 w-full flex items-center justify-center gap-3 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-2 border-transparent hover:border-slate-900 dark:hover:border-white font-bold uppercase tracking-wider transition-all hover:bg-neo-yellow hover:text-slate-900 dark:hover:bg-neo-yellow dark:hover:text-slate-900 shadow-hard hover:shadow-none hover:translate-x-1 hover:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
            Generate Career Path
          </button>
        </div>
      </div>

      {/* Main Area: Results */}
      <div className="lg:col-span-2 space-y-6">
        {loading ? (
             <div className="h-full flex flex-col items-center justify-center space-y-4 min-h-[400px] border-2 border-dashed border-slate-300 bg-slate-50 dark:bg-slate-800/50">
                <div className="w-16 h-16 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                <p className="font-mono font-bold text-slate-500">CRUNCHING DATA...</p>
             </div>
        ) : advice ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-yellow-50 dark:bg-yellow-900/10 p-6 border-2 border-slate-900 dark:border-slate-100 shadow-hard relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-200 rounded-full blur-3xl opacity-50 -mr-10 -mt-10"></div>
                    <h3 className="flex items-center gap-2 font-black text-xl mb-3 uppercase relative z-10 text-slate-900 dark:text-white">
                        <Sparkles size={24} className="text-neo-yellow fill-neo-yellow" />
                        AI Analysis
                    </h3>
                    <p className="font-medium leading-relaxed font-mono text-sm relative z-10">
                        {advice.analysis}
                    </p>
                </div>

                <h3 className="text-xl font-black uppercase border-b-4 border-neo-blue inline-block">Recommended Paths</h3>
                <div className="grid grid-cols-1 gap-6">
                    {advice.careers.map((career, idx) => (
                        <div key={idx} className="bg-white dark:bg-slate-900 p-0 border-2 border-slate-900 dark:border-slate-100 shadow-hard group hover:-translate-y-1 transition-transform">
                            <div className={`p-6 border-b-2 border-slate-900 dark:border-slate-100 flex justify-between items-start ${idx === 0 ? 'bg-indigo-50 dark:bg-indigo-900/30' : idx === 1 ? 'bg-pink-50 dark:bg-pink-900/30' : 'bg-teal-50 dark:bg-teal-900/30'}`}>
                                <div>
                                    <h4 className="text-2xl font-black uppercase group-hover:underline decoration-4 decoration-slate-900 dark:decoration-white">{career.title}</h4>
                                    <p className="font-mono text-sm mt-2 max-w-xl text-slate-600 dark:text-slate-300">{career.description}</p>
                                </div>
                                <div className={`flex flex-col items-center justify-center w-16 h-16 border-2 border-slate-900 dark:border-slate-100 shadow-hard-sm ${idx === 0 ? 'bg-neo-blue text-white' : idx === 1 ? 'bg-neo-pink text-slate-900' : 'bg-neo-green text-slate-900'}`}>
                                    <div className="text-xl font-bold">{career.match}%</div>
                                </div>
                            </div>
                            
                            <div className="p-6">
                                <h5 className="text-sm font-bold uppercase mb-4 flex items-center gap-2">
                                    <BookOpen size={16} /> Roadmap
                                </h5>
                                <div className="space-y-4 relative pl-4 border-l-2 border-slate-200 dark:border-slate-700 ml-2">
                                    {career.roadmap.map((step, sIdx) => (
                                        <div key={sIdx} className="relative pl-6">
                                            <div className={`absolute -left-[25px] top-1 w-4 h-4 border-2 border-slate-900 dark:border-slate-100 rounded-full ${sIdx === 0 ? 'bg-green-400' : 'bg-white dark:bg-slate-800'}`}></div>
                                            <p className="text-sm font-medium">{step}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        ) : (
            <div className="h-full flex flex-col items-center justify-center min-h-[400px] border-4 border-slate-200 dark:border-slate-800 border-dashed bg-slate-50 dark:bg-slate-900/50">
                <Compass size={64} className="mb-6 opacity-20" />
                <p className="text-xl font-bold uppercase">Ready to explore?</p>
                <p className="font-mono text-sm text-slate-500 mt-2">Select a student profile to begin.</p>
            </div>
        )}
      </div>
    </div>
  );
};