
import React, { useState } from 'react';
import { STUDENTS } from '../constants';
import { Award, Calendar, Trophy, Star, Medal, ChevronDown, Plus, X } from 'lucide-react';
import { UserRole } from '../types';

// Simple icons for the badges
const TerminalIcon = () => <svg className="w-6 h-6 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="square" strokeLinejoin="miter" d="M4 17l6-6-6-6M12 19h8" /></svg>;
const CheckCircleIcon = () => <svg className="w-6 h-6 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="square" strokeLinejoin="miter" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const UsersIcon = () => <svg className="w-6 h-6 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="square" strokeLinejoin="miter" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const PuzzleIcon = () => <svg className="w-6 h-6 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="square" strokeLinejoin="miter" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h1a2 2 0 110 4h-1a1 1 0 00-1 1v1a2 2 0 11-4 0v-1a1 1 0 00-1-1H9a2 2 0 110-4h1a1 1 0 001-1V4z" /></svg>;
const StarIcon = () => <svg className="w-6 h-6 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="square" strokeLinejoin="miter" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363 1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>;
const ZapIcon = () => <svg className="w-6 h-6 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="square" strokeLinejoin="miter" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;

interface StudentTrackerProps {
    role: UserRole;
}

const BADGE_OPTIONS = [
    { name: 'Code Wizard', icon: <TerminalIcon />, color: 'bg-purple-400' },
    { name: 'Perfect Attendance', icon: <CheckCircleIcon />, color: 'bg-neo-green' },
    { name: 'Team Player', icon: <UsersIcon />, color: 'bg-neo-blue' },
    { name: 'Problem Solver', icon: <PuzzleIcon />, color: 'bg-neo-yellow' },
    { name: 'Creative Mind', icon: <StarIcon />, color: 'bg-neo-pink' },
    { name: 'Fast Learner', icon: <ZapIcon />, color: 'bg-orange-400' }
];

export const StudentTracker: React.FC<StudentTrackerProps> = ({ role }) => {
  const [selectedStudentId, setSelectedStudentId] = useState(STUDENTS[0].id);
  const student = STUDENTS.find(s => s.id === selectedStudentId) || STUDENTS[0];

  // State for badges (simulating database)
  const [studentBadges, setStudentBadges] = useState<Record<string, typeof BADGE_OPTIONS>>({
      [STUDENTS[0].id]: BADGE_OPTIONS.slice(0, 4),
      [STUDENTS[1].id]: BADGE_OPTIONS.slice(0, 2),
      [STUDENTS[2].id]: BADGE_OPTIONS.slice(2, 4),
      [STUDENTS[3].id]: BADGE_OPTIONS.slice(0, 3),
      [STUDENTS[4].id]: BADGE_OPTIONS.slice(1, 5),
  });
  
  const [isAwardModalOpen, setIsAwardModalOpen] = useState(false);

  // Generate a unique avatar based on the student's name using DiceBear Notionists style
  const avatarUrl = `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(student.name)}&scale=120&backgroundColor=b6e3f4,c0aede,d1d4f9,ffdfbf,ffd5dc`;

  const badges = studentBadges[student.id] || [];

  const handleAwardBadge = (badge: typeof BADGE_OPTIONS[0]) => {
      setStudentBadges(prev => ({
          ...prev,
          [student.id]: [...(prev[student.id] || []), badge]
      }));
      setIsAwardModalOpen(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
      {/* Award Modal */}
      {isAwardModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-100 shadow-hard p-6 w-full max-w-md animate-in zoom-in duration-200">
                  <div className="flex justify-between items-center mb-6 border-b-2 border-slate-900 dark:border-slate-100 pb-2">
                      <h3 className="text-xl font-black uppercase">Award Badge</h3>
                      <button onClick={() => setIsAwardModalOpen(false)}><X size={24} /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      {BADGE_OPTIONS.map((badge, idx) => (
                          <button 
                            key={idx}
                            onClick={() => handleAwardBadge(badge)}
                            className={`p-4 border-2 border-slate-900 dark:border-slate-100 ${badge.color} hover:brightness-110 shadow-hard-sm hover:translate-y-0.5 hover:shadow-none transition-all flex flex-col items-center gap-2`}
                          >
                              {badge.icon}
                              <span className="text-xs font-bold text-slate-900 uppercase">{badge.name}</span>
                          </button>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* Left Column: Profile & Badges */}
      <div className="space-y-8">
        
        {/* Student Selector */}
        <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-100 shadow-hard p-4 relative">
             <label className="block text-xs font-bold uppercase mb-1 text-slate-500">View Student Profile</label>
             <div className="relative">
                <select 
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border-2 border-slate-900 dark:border-slate-100 font-bold appearance-none outline-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                    {STUDENTS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-3 pointer-events-none text-slate-500" size={16} />
             </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-100 shadow-hard p-6 text-center relative overflow-hidden group">
           <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-neo-pink to-neo-blue border-b-2 border-slate-900 dark:border-slate-100 z-0"></div>
           
           <div className="relative z-10 w-32 h-32 mx-auto bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-100 shadow-hard flex items-center justify-center mb-4 mt-8 overflow-hidden hover:scale-105 transition-transform duration-300">
              <img 
                src={avatarUrl} 
                alt={`${student.name} Avatar`} 
                className="w-full h-full object-cover"
              />
           </div>
           
           <h2 className="relative z-10 text-2xl font-black uppercase">{student.name}</h2>
           <p className="relative z-10 font-mono text-slate-500">{student.rollNumber} • CS Dept</p>
           
           <div className="grid grid-cols-2 gap-4 mt-6 relative z-10">
              <div className="p-2 border-2 border-slate-900 dark:border-slate-100 bg-neo-green text-slate-900 shadow-sm hover:-translate-y-0.5 transition-transform">
                 <p className="text-xs font-bold uppercase">Points</p>
                 <p className="text-xl font-black">1,240</p>
              </div>
              <div className="p-2 border-2 border-slate-900 dark:border-slate-100 bg-neo-blue text-slate-900 shadow-sm hover:-translate-y-0.5 transition-transform">
                 <p className="text-xs font-bold uppercase">Rank</p>
                 <p className="text-xl font-black">#4</p>
              </div>
           </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-100 shadow-hard p-6">
           <div className="flex justify-between items-center mb-4 border-b-4 border-neo-yellow pb-1">
                <h3 className="text-lg font-black uppercase flex items-center gap-2">
                    <Trophy size={20} /> Achievements
                </h3>
                {role === 'teacher' && (
                    <button 
                        onClick={() => setIsAwardModalOpen(true)}
                        className="p-1 bg-slate-900 text-white hover:bg-neo-yellow hover:text-slate-900 transition-colors"
                        title="Award Badge"
                    >
                        <Plus size={16} />
                    </button>
                )}
           </div>
           <div className="grid grid-cols-2 gap-4">
              {badges.map((b, i) => (
                  <div key={i} className={`p-4 border-2 border-slate-900 dark:border-slate-100 ${b.color} flex flex-col items-center gap-2 text-center shadow-hard-sm hover:-translate-y-1 transition-transform`}>
                     {b.icon}
                     <span className="text-xs font-bold text-slate-900">{b.name}</span>
                  </div>
              ))}
              {badges.length === 0 && (
                  <p className="col-span-2 text-center font-mono text-sm text-slate-500 italic py-4">No badges awarded yet.</p>
              )}
           </div>
        </div>
      </div>

      {/* Right Column: Timeline */}
      <div className="lg:col-span-2 bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-100 shadow-hard p-6">
         <h3 className="text-lg font-black uppercase mb-6 flex items-center gap-2 border-b-4 border-neo-blue inline-block pb-1">
            <Calendar size={20} /> Activity Timeline
         </h3>
         
         <div className="relative pl-6 space-y-8 border-l-4 border-slate-900 dark:border-slate-100 ml-2">
            {[
                { title: 'Won 1st Prize in Hackathon', date: '2 days ago', type: 'award', desc: 'National Level SIH 2024 Finalist' },
                { title: 'Submitted Project Phase 1', date: '5 days ago', type: 'academic', desc: 'AI-based Attendance System documentation submitted.' },
                { title: 'Joined Robotics Club', date: '1 week ago', type: 'activity', desc: 'Enrolled in the advanced mechanics workshop.' },
                { title: 'Scored 98% in Math Quiz', date: '2 weeks ago', type: 'academic', desc: 'Top scorer in the class.' },
            ].map((item, idx) => (
                <div key={idx} className="relative group">
                   <div className={`absolute -left-[34px] top-0 w-8 h-8 border-2 border-slate-900 dark:border-slate-100 shadow-sm ${
                       item.type === 'award' ? 'bg-neo-yellow' : item.type === 'academic' ? 'bg-neo-blue' : 'bg-neo-green'
                   } flex items-center justify-center z-10 group-hover:scale-110 transition-transform`}>
                      {item.type === 'award' && <Medal size={14} className="text-slate-900" />}
                      {item.type === 'academic' && <Star size={14} className="text-slate-900" />}
                      {item.type === 'activity' && <Award size={14} className="text-slate-900" />}
                   </div>
                   <div className="bg-slate-50 dark:bg-slate-800 p-4 border-2 border-slate-900 dark:border-slate-100 shadow-hard-sm hover:translate-x-2 transition-transform hover:bg-white dark:hover:bg-slate-700">
                      <div className="flex justify-between items-start mb-1">
                          <h4 className="font-bold text-md uppercase">{item.title}</h4>
                          <span className="text-xs font-mono bg-white dark:bg-slate-900 border border-slate-900 dark:border-slate-100 px-2 py-0.5">{item.date}</span>
                      </div>
                      <p className="text-sm font-mono text-slate-600 dark:text-slate-400">{item.desc}</p>
                   </div>
                </div>
            ))}
         </div>
      </div>
    </div>
  );
};
