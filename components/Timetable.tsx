
import React, { useState } from 'react';
import { DAYS, TIMES, INITIAL_TIMETABLE } from '../constants';
import { Plus, Download, Edit3, Sparkles, Loader2, X, Save } from 'lucide-react';
import { ClassSession, UserRole } from '../types';
import { generateTimetable } from '../services/ai';

const COLORS = [
    'bg-neo-pink',
    'bg-neo-blue',
    'bg-neo-green',
    'bg-neo-yellow',
    'bg-purple-400',
    'bg-orange-400',
    'bg-teal-400',
    'bg-red-400'
];

interface TimetableProps {
    role: UserRole;
}

export const Timetable: React.FC<TimetableProps> = ({ role }) => {
  const [schedule, setSchedule] = useState<ClassSession[]>(INITIAL_TIMETABLE);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Partial<ClassSession>>({});

  const handleAutoGenerate = async () => {
      setIsGenerating(true);
      try {
          const newSchedule = await generateTimetable();
          if (newSchedule) {
              // Assign colors to the generated schedule
              const coloredSchedule = newSchedule.map((session: any, idx: number) => ({
                  ...session,
                  id: `gen-${idx}-${Date.now()}`,
                  color: COLORS[idx % COLORS.length]
              }));
              setSchedule(coloredSchedule);
          }
      } catch (e) {
          console.error(e);
      } finally {
          setIsGenerating(false);
      }
  };

  const openAddModal = (day: string, time: string) => {
      // Only teacher can edit
      if (role !== 'teacher') return;

      setEditingSession({
          id: '',
          day,
          time,
          subject: '',
          code: '',
          professorName: '',
          roomId: '',
          color: COLORS[Math.floor(Math.random() * COLORS.length)]
      });
      setIsModalOpen(true);
  };

  const openEditModal = (session: ClassSession) => {
      // Only teacher can edit
      if (role !== 'teacher') return;
      
      setEditingSession({ ...session });
      setIsModalOpen(true);
  };

  const saveSession = () => {
      if (!editingSession.subject || !editingSession.day || !editingSession.time) return;

      const newSession = {
          ...editingSession,
          id: editingSession.id || Math.random().toString(),
      } as ClassSession;

      setSchedule(prev => {
          // Remove existing if editing, then add new
          const filtered = prev.filter(s => s.id !== newSession.id && !(s.day === newSession.day && s.time === newSession.time));
          return [...filtered, newSession];
      });
      setIsModalOpen(false);
  };

  const removeClass = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSchedule(schedule.filter(s => s.id !== id));
  };

  const handleExport = () => {
    window.print();
  };

  return (
    <div className="space-y-6 relative">
      {/* Loading Overlay */}
      {isGenerating && (
          <div className="absolute inset-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center">
              <Loader2 className="w-16 h-16 animate-spin text-neo-blue" />
              <p className="mt-4 font-black uppercase text-xl">AI is crafting your schedule...</p>
          </div>
      )}

      {/* Edit/Add Modal */}
      {isModalOpen && role === 'teacher' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="bg-white dark:bg-slate-900 w-full max-w-md border-2 border-slate-900 dark:border-slate-100 shadow-hard p-6 animate-in zoom-in duration-200">
                  <div className="flex justify-between items-center mb-6 border-b-2 border-slate-900 dark:border-slate-100 pb-2">
                      <h3 className="text-xl font-black uppercase">{editingSession.id ? 'Edit Class' : 'Add Class'}</h3>
                      <button onClick={() => setIsModalOpen(false)} className="hover:bg-slate-100 p-1">
                          <X size={24} />
                      </button>
                  </div>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold uppercase mb-1">Subject Name</label>
                          <input 
                              type="text" 
                              value={editingSession.subject} 
                              onChange={e => setEditingSession({...editingSession, subject: e.target.value})}
                              className="w-full p-2 border-2 border-slate-900 dark:border-slate-100 bg-slate-50 dark:bg-slate-800 font-bold"
                              placeholder="e.g. Computer Science"
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold uppercase mb-1">Subject Code</label>
                            <input 
                                type="text" 
                                value={editingSession.code} 
                                onChange={e => setEditingSession({...editingSession, code: e.target.value})}
                                className="w-full p-2 border-2 border-slate-900 dark:border-slate-100 bg-slate-50 dark:bg-slate-800 font-mono text-sm"
                                placeholder="e.g. CS101"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold uppercase mb-1">Room ID</label>
                            <input 
                                type="text" 
                                value={editingSession.roomId} 
                                onChange={e => setEditingSession({...editingSession, roomId: e.target.value})}
                                className="w-full p-2 border-2 border-slate-900 dark:border-slate-100 bg-slate-50 dark:bg-slate-800 font-mono text-sm"
                                placeholder="e.g. 101"
                            />
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs font-bold uppercase mb-1">Professor Name</label>
                          <input 
                              type="text" 
                              value={editingSession.professorName} 
                              onChange={e => setEditingSession({...editingSession, professorName: e.target.value})}
                              className="w-full p-2 border-2 border-slate-900 dark:border-slate-100 bg-slate-50 dark:bg-slate-800"
                              placeholder="e.g. Dr. Smith"
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold uppercase mb-2">Card Color</label>
                          <div className="flex flex-wrap gap-2">
                              {COLORS.map(c => (
                                  <button
                                      key={c}
                                      onClick={() => setEditingSession({...editingSession, color: c})}
                                      className={`w-8 h-8 ${c} border-2 border-slate-900 ${editingSession.color === c ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white scale-110' : ''}`}
                                  />
                              ))}
                          </div>
                      </div>
                  </div>

                  <div className="mt-8 flex gap-3">
                      <button 
                          onClick={saveSession}
                          className="flex-1 py-3 bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold uppercase border-2 border-slate-900 dark:border-white shadow-hard-sm hover:translate-y-0.5 hover:shadow-none transition-all flex items-center justify-center gap-2"
                      >
                          <Save size={18} /> Save Class
                      </button>
                  </div>
              </div>
          </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
           <h2 className="text-2xl font-black uppercase text-shadow-sm">{role === 'teacher' ? 'Teaching Schedule' : 'My Classes'}</h2>
           <p className="font-mono text-sm text-slate-500 border-b-2 border-slate-900 dark:border-slate-100 inline-block">Academic Year 2024-2025</p>
        </div>
        <div className="flex gap-3">
            {role === 'teacher' && (
                <button 
                    onClick={handleAutoGenerate}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border-2 border-slate-900 dark:border-slate-100 shadow-hard-sm text-sm font-bold hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-50"
                >
                    {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} className="text-neo-yellow fill-neo-yellow" />}
                    Auto-Generate
                </button>
            )}
            <button 
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white border-2 border-slate-900 dark:border-slate-100 shadow-hard-sm text-sm font-bold hover:translate-y-0.5 hover:shadow-none transition-all"
            >
                <Download size={16} />
                Export PDF
            </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-100 shadow-hard overflow-x-auto">
        <div className="min-w-[1000px]">
          {/* Header Row */}
          <div className="grid grid-cols-6 border-b-2 border-slate-900 dark:border-slate-100 bg-slate-900 text-white dark:bg-slate-800">
            <div className="p-4 font-bold text-sm text-center font-mono border-r-2 border-slate-700">TIME</div>
            {DAYS.map((day, idx) => (
              <div key={day} className={`p-4 font-bold text-sm text-center uppercase tracking-wider ${idx !== DAYS.length - 1 ? 'border-r-2 border-slate-700' : ''}`}>
                {day}
              </div>
            ))}
          </div>

          {/* Time Rows */}
          {TIMES.map((time, tIdx) => (
            <div key={time} className={`grid grid-cols-6 ${tIdx !== TIMES.length - 1 ? 'border-b-2 border-slate-900 dark:border-slate-100' : ''}`}>
              <div className="p-4 font-bold font-mono text-sm flex items-center justify-center bg-indigo-50 dark:bg-slate-800 border-r-2 border-slate-900 dark:border-slate-100">
                {time}
              </div>
              {DAYS.map((day, dIdx) => {
                const session = schedule.find(s => s.day === day && s.time === time);
                return (
                  <div key={`${day}-${time}`} className={`p-2 min-h-[120px] relative group ${dIdx !== DAYS.length - 1 ? 'border-r-2 border-slate-900 dark:border-slate-100' : ''}`}>
                    {session ? (
                      <div 
                        onClick={() => openEditModal(session)}
                        className={`h-full ${session.color || 'bg-violet-300'} border-2 border-slate-900 dark:border-slate-100 shadow-hard-sm p-2 text-xs flex flex-col gap-1 ${role === 'teacher' ? 'hover:-translate-y-1 cursor-pointer' : ''} transition-transform relative`}
                      >
                        <div className="flex justify-between items-start">
                             <span className="font-bold text-slate-900 uppercase line-clamp-1">{session.subject}</span>
                             {role === 'teacher' && (
                                <button 
                                    onClick={(e) => removeClass(session.id, e)}
                                    className="opacity-0 group-hover:opacity-100 text-slate-900 hover:bg-white p-0.5 border border-slate-900 transition-opacity absolute top-1 right-1 z-10"
                                >
                                    <X size={12} />
                                </button>
                             )}
                        </div>
                        {session.code && <span className="font-mono text-[10px] font-bold text-slate-900 bg-white/50 w-fit px-1">{session.code}</span>}
                        <span className="font-mono text-slate-800 font-bold mt-auto">{session.roomId}</span>
                        <div className="pt-1 flex items-center gap-1 border-t border-slate-900/20">
                             <div className="w-4 h-4 rounded-none border border-slate-900 bg-white flex items-center justify-center text-[6px] font-bold text-slate-900">TR</div>
                             <span className="font-medium truncate text-slate-900">{session.professorName || 'TBA'}</span>
                        </div>
                        
                        {/* Edit overlay on hover (Teacher Only) */}
                        {role === 'teacher' && (
                            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 flex items-center justify-center pointer-events-none">
                                <Edit3 size={16} className="text-slate-900" />
                            </div>
                        )}
                      </div>
                    ) : (
                      role === 'teacher' && (
                        <button 
                            onClick={() => openAddModal(day, time)}
                            className="w-full h-full border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-slate-900 dark:hover:border-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-slate-400 hover:text-slate-900"
                        >
                            <Plus size={24} />
                        </button>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};