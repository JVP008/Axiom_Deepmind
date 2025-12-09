
import React, { useState } from 'react';
import { STUDENTS } from '../constants';
import { QrCode, Search, Filter, Save, CheckSquare, Check, Loader2, X } from 'lucide-react';
import { UserRole } from '../types';

interface AttendanceProps {
    role: UserRole;
}

export const Attendance: React.FC<AttendanceProps> = ({ role }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const handleSave = () => {
      setIsSaving(true);
      setTimeout(() => {
          setIsSaving(false);
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
      }, 1500);
  };

  const getProgressColor = (val: number) => {
     if (val > 75) return 'bg-neo-green';
     if (val >= 50) return 'bg-neo-yellow';
     return 'bg-red-500';
  };

  return (
    <div className="space-y-6 relative">
       {/* QR Modal */}
       {isQrModalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in zoom-in duration-200">
               <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-100 shadow-hard w-full max-w-sm p-6 relative flex flex-col items-center">
                   <button 
                       onClick={() => setIsQrModalOpen(false)}
                       className="absolute top-4 right-4 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                   >
                       <X size={24} />
                   </button>
                   
                   <h3 className="text-xl font-black uppercase mb-2">Digital Pass</h3>
                   <p className="font-mono text-xs text-slate-500 mb-6 text-center">Scan this code at the classroom entrance</p>
                   
                   <div className="p-4 bg-white border-2 border-slate-900 shadow-hard-sm mb-6">
                       <img 
                           src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=AXIOM-ATTENDANCE-${Date.now()}`} 
                           alt="Attendance QR" 
                           className="w-48 h-48"
                       />
                   </div>
                   
                   <div className="flex items-center gap-2 text-green-600 font-bold uppercase text-sm animate-pulse">
                       <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                       Token Active
                   </div>
               </div>
           </div>
       )}

       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-2xl font-black uppercase">{role === 'teacher' ? 'Mark Class Attendance' : 'My Attendance'}</h2>
           <p className="font-mono text-slate-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
            {role === 'student' ? (
                <button 
                    onClick={() => setIsQrModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border-2 border-slate-900 dark:border-slate-100 shadow-hard-sm text-sm font-bold hover:translate-y-0.5 hover:shadow-none transition-all"
                >
                    <QrCode size={16} />
                    SCAN QR
                </button>
            ) : (
                <button 
                    onClick={handleSave}
                    disabled={isSaving || saveSuccess}
                    className={`flex items-center gap-2 px-4 py-2 border-2 border-slate-900 shadow-hard-sm text-sm font-bold hover:translate-y-0.5 hover:shadow-none transition-all ${saveSuccess ? 'bg-green-500 text-white' : 'bg-neo-green text-slate-900'}`}
                >
                    {isSaving ? (
                        <><Loader2 size={16} className="animate-spin" /> SAVING...</>
                    ) : saveSuccess ? (
                        <><Check size={16} /> SAVED!</>
                    ) : (
                        <><Save size={16} /> SAVE RECORDS</>
                    )}
                </button>
            )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-100 shadow-hard overflow-hidden">
        {role === 'teacher' && (
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
        )}
        
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold font-mono uppercase">
                    <tr>
                        <th className="p-4 border-r-2 border-b-2 border-slate-900 dark:border-slate-100 w-1/4">Student Name</th>
                        <th className="p-4 border-r-2 border-b-2 border-slate-900 dark:border-slate-100">Roll No</th>
                        <th className="p-4 border-r-2 border-b-2 border-slate-900 dark:border-slate-100">Stats</th>
                        <th className="p-4 border-b-2 border-slate-900 dark:border-slate-100 text-center">{role === 'teacher' ? 'Mark Today' : 'Status Today'}</th>
                    </tr>
                </thead>
                <tbody className="divide-y-2 divide-slate-900 dark:divide-slate-100">
                    {(role === 'student' ? [STUDENTS[0]] : STUDENTS).map(student => (
                        <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            <td className="p-4 font-bold border-r-2 border-slate-900 dark:border-slate-100">{student.name}</td>
                            <td className="p-4 font-mono text-sm border-r-2 border-slate-900 dark:border-slate-100">{student.rollNumber}</td>
                            <td className="p-4 border-r-2 border-slate-900 dark:border-slate-100">
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-2 bg-slate-200 border border-slate-900 dark:border-slate-100 min-w-[60px]">
                                        <div 
                                            className={`h-full border-r border-slate-900 ${getProgressColor(student.attendance)}`} 
                                            style={{width: `${student.attendance}%`}}
                                        ></div>
                                    </div>
                                    <span className="text-xs font-bold">{student.attendance}%</span>
                                </div>
                            </td>
                            <td className="p-4 flex justify-center gap-2">
                                {role === 'teacher' ? (
                                    <>
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
                                    </>
                                ) : (
                                    <div className="flex items-center gap-2 px-4 py-1 bg-green-100 border-2 border-green-600 text-green-800 font-bold uppercase text-sm">
                                        <CheckSquare size={16} /> Present
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};
