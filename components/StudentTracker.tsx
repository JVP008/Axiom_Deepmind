import React from 'react';
import { STUDENTS } from '../constants';
import { Award, Calendar, Trophy, Star, Medal } from 'lucide-react';

export const StudentTracker: React.FC = () => {
  const student = STUDENTS[0]; // Demo with first student

  const badges = [
    { name: 'Code Wizard', icon: <TerminalIcon />, color: 'bg-purple-400' },
    { name: 'Perfect Attendance', icon: <CheckCircleIcon />, color: 'bg-neo-green' },
    { name: 'Team Player', icon: <UsersIcon />, color: 'bg-neo-blue' },
    { name: 'Problem Solver', icon: <PuzzleIcon />, color: 'bg-neo-yellow' }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Profile & Badges */}
      <div className="space-y-8">
        <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-100 shadow-hard p-6 text-center relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-neo-pink to-neo-blue border-b-2 border-slate-900 dark:border-slate-100 z-0"></div>
           <div className="relative z-10 w-24 h-24 mx-auto bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-100 shadow-hard flex items-center justify-center text-3xl font-black uppercase mb-4 mt-8 text-slate-900 dark:text-white">
              {student.name.charAt(0)}{student.name.split(' ')[1]?.charAt(0)}
           </div>
           <h2 className="relative z-10 text-2xl font-black uppercase">{student.name}</h2>
           <p className="relative z-10 font-mono text-slate-500">{student.rollNumber} • CS Dept</p>
           
           <div className="grid grid-cols-2 gap-4 mt-6 relative z-10">
              <div className="p-2 border-2 border-slate-900 dark:border-slate-100 bg-neo-green text-slate-900">
                 <p className="text-xs font-bold uppercase">Points</p>
                 <p className="text-xl font-black">1,240</p>
              </div>
              <div className="p-2 border-2 border-slate-900 dark:border-slate-100 bg-neo-blue text-slate-900">
                 <p className="text-xs font-bold uppercase">Rank</p>
                 <p className="text-xl font-black">#4</p>
              </div>
           </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-100 shadow-hard p-6">
           <h3 className="text-lg font-black uppercase mb-4 flex items-center gap-2 border-b-4 border-neo-yellow inline-block pb-1">
              <Trophy size={20} /> Achievements
           </h3>
           <div className="grid grid-cols-2 gap-4">
              {badges.map((b, i) => (
                  <div key={i} className={`p-4 border-2 border-slate-900 dark:border-slate-100 ${b.color} flex flex-col items-center gap-2 text-center shadow-hard-sm hover:-translate-y-1 transition-transform`}>
                     {b.icon}
                     <span className="text-xs font-bold text-slate-900">{b.name}</span>
                  </div>
              ))}
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

// Simple icons for the badges
const TerminalIcon = () => <svg className="w-6 h-6 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="square" strokeLinejoin="miter" d="M4 17l6-6-6-6M12 19h8" /></svg>;
const CheckCircleIcon = () => <svg className="w-6 h-6 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="square" strokeLinejoin="miter" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const UsersIcon = () => <svg className="w-6 h-6 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="square" strokeLinejoin="miter" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const PuzzleIcon = () => <svg className="w-6 h-6 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="square" strokeLinejoin="miter" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h1a2 2 0 110 4h-1a1 1 0 00-1 1v1a2 2 0 11-4 0v-1a1 1 0 00-1-1H9a2 2 0 110-4h1a1 1 0 001-1V4z" /></svg>;