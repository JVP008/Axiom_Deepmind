import React from 'react';
import { STUDENTS } from '../constants';
import { QrCode, Search, Filter } from 'lucide-react';

export const Attendance: React.FC = () => {

  const getProgressColor = (val: number) => {
     if (val > 75) return 'bg-neo-green';
     if (val >= 50) return 'bg-neo-yellow';
     return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-2xl font-black uppercase">Daily Attendance</h2>
           <p className="font-mono text-slate-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border-2 border-slate-900 dark:border-slate-100 shadow-hard-sm text-sm font-bold hover:translate-y-0.5 hover:shadow-none transition-all">
                <QrCode size={16} />
                SCAN QR
            </button>
            <button className="px-4 py-2 bg-indigo-600 text-white border-2 border-slate-900 dark:border-slate-100 shadow-hard-sm text-sm font-bold hover:translate-y-0.5 hover:shadow-none transition-all">
                SUBMIT REPORT
            </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-100 shadow-hard overflow-hidden">
        <div className="p-4 border-b-2 border-slate-900 dark:border-slate-100 flex gap-4 bg-slate-50 dark:bg-slate-800">
             <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 text-slate-900 dark:text-slate-100" size={18} />
                <input 
                    type="text" 
                    placeholder="SEARCH STUDENT..." 
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-100 outline-none focus:shadow-hard-sm font-mono text-sm"
                />
             </div>
             <button className="p-2 border-2 border-slate-900 dark:border-slate-100 bg-white dark:bg-slate-900 hover:bg-slate-100 shadow-hard-sm hover:shadow-none active:translate-y-0.5">
                <Filter size={18} />
             </button>
        </div>
        <table className="w-full text-left border-collapse">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold font-mono uppercase">
                <tr>
                    <th className="p-4 border-r-2 border-b-2 border-slate-900 dark:border-slate-100 w-1/4">Student Name</th>
                    <th className="p-4 border-r-2 border-b-2 border-slate-900 dark:border-slate-100">Roll No</th>
                    <th className="p-4 border-r-2 border-b-2 border-slate-900 dark:border-slate-100">Stats</th>
                    <th className="p-4 border-b-2 border-slate-900 dark:border-slate-100 text-center">Mark Status</th>
                </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-900 dark:divide-slate-100">
                {STUDENTS.map(student => (
                    <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <td className="p-4 font-bold border-r-2 border-slate-900 dark:border-slate-100">{student.name}</td>
                        <td className="p-4 font-mono text-sm border-r-2 border-slate-900 dark:border-slate-100">{student.rollNumber}</td>
                        <td className="p-4 border-r-2 border-slate-900 dark:border-slate-100">
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-slate-200 border border-slate-900 dark:border-slate-100">
                                    <div 
                                        className={`h-full border-r border-slate-900 ${getProgressColor(student.attendance)}`} 
                                        style={{width: `${student.attendance}%`}}
                                    ></div>
                                </div>
                                <span className="text-xs font-bold">{student.attendance}%</span>
                            </div>
                        </td>
                        <td className="p-4 flex justify-center gap-2">
                             <label className="cursor-pointer">
                                <input type="radio" name={`att-${student.id}`} defaultChecked className="peer sr-only" />
                                <span className="block px-3 py-1 text-sm font-bold border-2 border-slate-900 dark:border-slate-100 peer-checked:bg-green-400 peer-checked:text-slate-900 hover:bg-green-100 transition-all text-slate-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none peer-checked:shadow-none peer-checked:translate-x-[2px] peer-checked:translate-y-[2px]">P</span>
                             </label>
                             <label className="cursor-pointer">
                                <input type="radio" name={`att-${student.id}`} className="peer sr-only" />
                                <span className="block px-3 py-1 text-sm font-bold border-2 border-slate-900 dark:border-slate-100 peer-checked:bg-red-400 peer-checked:text-slate-900 hover:bg-red-100 transition-all text-slate-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none peer-checked:shadow-none peer-checked:translate-x-[2px] peer-checked:translate-y-[2px]">A</span>
                             </label>
                             <label className="cursor-pointer">
                                <input type="radio" name={`att-${student.id}`} className="peer sr-only" />
                                <span className="block px-3 py-1 text-sm font-bold border-2 border-slate-900 dark:border-slate-100 peer-checked:bg-yellow-400 peer-checked:text-slate-900 hover:bg-yellow-100 transition-all text-slate-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none peer-checked:shadow-none peer-checked:translate-x-[2px] peer-checked:translate-y-[2px]">L</span>
                             </label>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
};