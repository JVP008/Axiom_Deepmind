import React, { useState, useRef, useEffect } from 'react';
import { BadgeCheck, ShieldCheck, Search, XCircle, CheckCircle, Upload, FileText, Send, Clock, Plus, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { UserRole } from '../types';

// --- CUSTOM CALENDAR COMPONENT ---
const CustomCalendar = ({ value, onChange, onClose }: { value: string, onChange: (date: string) => void, onClose: () => void }) => {
    const [viewDate, setViewDate] = useState(() => {
        const d = new Date(value);
        return isNaN(d.getTime()) ? new Date() : d;
    });

    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanks = Array.from({ length: firstDay }, (_, i) => i);
    
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const changeMonth = (offset: number) => {
        setViewDate(new Date(year, month + offset, 1));
    };

    const handleDateClick = (day: number) => {
        const formattedDate = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        onChange(formattedDate);
        onClose();
    };

    return (
        <div className="absolute top-full left-0 mt-2 z-50 w-72 bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-100 shadow-hard p-4 animate-in zoom-in duration-200 origin-top-left">
            <div className="flex justify-between items-center mb-4 pb-2 border-b-2 border-slate-100 dark:border-slate-700">
                <button 
                    onClick={(e) => { e.preventDefault(); changeMonth(-1); }}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md border border-transparent hover:border-slate-200 transition-colors"
                >
                    <ChevronLeft size={20} />
                </button>
                <span className="font-black uppercase text-sm tracking-wider">{monthNames[month]} {year}</span>
                <button 
                    onClick={(e) => { e.preventDefault(); changeMonth(1); }}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md border border-transparent hover:border-slate-200 transition-colors"
                >
                    <ChevronRight size={20} />
                </button>
            </div>
            
            <div className="grid grid-cols-7 mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                    <div key={d} className="text-center text-xs font-black text-slate-400 uppercase">{d}</div>
                ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
                {blanks.map((_, i) => <div key={`b-${i}`} />)}
                {days.map(day => {
                    const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                    const isSelected = value === dateStr;
                    const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
                    
                    return (
                        <button
                            key={day}
                            onClick={(e) => { e.preventDefault(); handleDateClick(day); }}
                            className={`
                                h-8 w-8 text-sm font-bold flex items-center justify-center border-2 transition-all rounded-sm
                                ${isSelected 
                                    ? 'bg-neo-blue text-white border-slate-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' 
                                    : isToday
                                        ? 'bg-yellow-100 border-yellow-400 text-slate-900 hover:border-slate-900'
                                        : 'border-transparent hover:border-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                                }
                            `}
                        >
                            {day}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

interface CertificateValidatorProps {
    role: UserRole;
}

export const CertificateValidator: React.FC<CertificateValidatorProps> = ({ role }) => {
  const [certId, setCertId] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'valid' | 'invalid'>('idle');
  
  // Registration State
  const [regStatus, setRegStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [regForm, setRegForm] = useState({
      title: '',
      issuer: '',
      date: '', // Will store date in YYYY-MM-DD format
      credentialId: ''
  });

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
            setIsCalendarOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleVerify = () => {
      if(!certId) return;
      setStatus('loading');
      setTimeout(() => {
          // Mock logic: IDs starting with 'VALID' are valid
          if(certId.toUpperCase().startsWith('VALID')) {
              setStatus('valid');
          } else {
              setStatus('invalid');
          }
      }, 1500);
  };

  const handleRegister = (e: React.FormEvent) => {
      e.preventDefault();
      setRegStatus('submitting');
      setTimeout(() => {
          setRegStatus('success');
      }, 2000);
  };

  // Check if all required fields in regForm are filled
  const isRegFormValid = regForm.title.trim() !== '' &&
                         regForm.issuer.trim() !== '' &&
                         regForm.date.trim() !== '' &&
                         regForm.credentialId.trim() !== '';

  // --- STUDENT VIEW: REGISTER CERTIFICATE ---
  if (role === 'student') {
      return (
        <div className="max-w-4xl mx-auto pt-10">
            <div className="text-center mb-10">
                <div className="w-20 h-20 mx-auto bg-neo-yellow text-slate-900 border-2 border-slate-900 shadow-hard flex items-center justify-center mb-6">
                    <BadgeCheck size={40} />
                </div>
                <h2 className="text-3xl font-black uppercase mb-2">Certificate Registry</h2>
                <p className="font-mono text-slate-500">Submit external certifications for university credits.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-100 shadow-hard p-8">
                    {regStatus === 'success' ? (
                        <div className="h-full flex flex-col items-center justify-center text-center py-10 animate-in zoom-in duration-300">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle size={32} />
                            </div>
                            <h3 className="text-2xl font-black uppercase mb-2">Submission Received</h3>
                            <p className="font-mono text-sm text-slate-600 dark:text-slate-400 mb-6 max-w-xs">
                                Your certificate has been logged in the blockchain queue. Pending faculty approval.
                            </p>
                            <button 
                                onClick={() => { setRegStatus('idle'); setRegForm({ title: '', issuer: '', date: '', credentialId: '' }); }}
                                className="px-6 py-2 bg-slate-900 text-white font-bold uppercase border-2 border-slate-900 hover:bg-slate-700 transition-colors"
                            >
                                Register Another
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div className="flex items-center gap-2 mb-4 pb-4 border-b-2 border-slate-100 dark:border-slate-800">
                                <Upload className="text-indigo-600" />
                                <h3 className="font-black uppercase text-lg">New Entry</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase mb-1">Course / Certificate Name</label>
                                    <input 
                                        required
                                        type="text" 
                                        value={regForm.title}
                                        onChange={e => setRegForm({...regForm, title: e.target.value})}
                                        placeholder="e.g. Advanced React Patterns"
                                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-900 dark:border-slate-100 outline-none font-medium text-sm focus:shadow-hard-sm transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase mb-1">Issuing Organization</label>
                                    <input 
                                        required
                                        type="text" 
                                        value={regForm.issuer}
                                        onChange={e => setRegForm({...regForm, issuer: e.target.value})}
                                        placeholder="e.g. Coursera, Udemy, Google"
                                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-900 dark:border-slate-100 outline-none font-medium text-sm focus:shadow-hard-sm transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase mb-1">Credential ID / URL</label>
                                    <input 
                                        required
                                        type="text" 
                                        value={regForm.credentialId}
                                        onChange={e => setRegForm({...regForm, credentialId: e.target.value})}
                                        placeholder="Unique ID or Verification Link"
                                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-900 dark:border-slate-100 outline-none font-mono text-sm focus:shadow-hard-sm transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase mb-1">Issue Date</label>
                                    <div className="relative" ref={calendarRef}>
                                        <div 
                                            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-900 dark:border-slate-100 font-medium text-sm focus:shadow-hard-sm transition-all min-h-[48px] flex items-center justify-between cursor-pointer group hover:bg-white dark:hover:bg-slate-700"
                                        >
                                            <span>{regForm.date || <span className="text-slate-400 uppercase">Select Date</span>}</span>
                                            <Calendar size={18} className="text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white" />
                                        </div>
                                        
                                        {isCalendarOpen && (
                                            <CustomCalendar 
                                                value={regForm.date} 
                                                onChange={(d) => setRegForm({...regForm, date: d})} 
                                                onClose={() => setIsCalendarOpen(false)} 
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="pt-4 border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white transition-colors group">
                                <FileText size={32} className="text-slate-400 group-hover:text-slate-900 mb-2 transition-colors" />
                                <p className="font-bold text-sm uppercase text-slate-500 group-hover:text-slate-900">Upload Certificate PDF (Optional)</p>
                                <p className="text-xs font-mono text-slate-400">Max 5MB</p>
                            </div>

                            <button 
                                type="submit"
                                disabled={regStatus === 'submitting' || !isRegFormValid}
                                className="w-full py-4 bg-neo-green text-slate-900 font-black uppercase border-2 border-slate-900 shadow-hard hover:shadow-none hover:translate-y-1 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-wait"
                            >
                                {regStatus === 'submitting' ? 'Registering...' : 'Submit for Verification'} <Send size={18} />
                            </button>
                        </form>
                    )}
                </div>

                {/* Status Sidebar */}
                <div className="space-y-4">
                    <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-100 shadow-hard p-4">
                        <h3 className="font-black uppercase mb-4 text-sm flex items-center gap-2">
                            <Clock size={16} /> Recent Submissions
                        </h3>
                        <div className="space-y-3">
                            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-xs uppercase">Python Bootcamp</span>
                                    <span className="bg-yellow-200 text-yellow-800 text-[10px] px-1.5 py-0.5 font-bold uppercase">Pending</span>
                                </div>
                                <p className="text-xs text-slate-500 font-mono">Udemy • Submitted 2d ago</p>
                            </div>
                            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-xs uppercase">AWS Cloud Practitioner</span>
                                    <span className="bg-green-200 text-green-800 text-[10px] px-1.5 py-0.5 font-bold uppercase">Verified</span>
                                </div>
                                <p className="text-xs text-slate-500 font-mono">Amazon • Submitted 1w ago</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      );
  }

  // --- TEACHER VIEW: VERIFY CERTIFICATES ---
  return (
    <div className="max-w-3xl mx-auto pt-10">
        <div className="text-center mb-10">
            <div className="w-20 h-20 mx-auto bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-2 border-slate-900 dark:border-slate-100 shadow-hard flex items-center justify-center mb-6">
                <ShieldCheck size={40} />
            </div>
            <h2 className="text-3xl font-black uppercase mb-2">Credential Verification</h2>
            <p className="font-mono text-slate-500">Verify authenticity of student submissions via Blockchain.</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-100 shadow-hard p-8 relative">
            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
                    <input 
                        type="text" 
                        value={certId}
                        onChange={(e) => setCertId(e.target.value)}
                        placeholder="ENTER CERTIFICATE ID (Try 'VALID123')" 
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-900 dark:border-slate-100 outline-none focus:bg-white font-mono uppercase text-lg"
                    />
                </div>
                <button 
                    onClick={handleVerify}
                    disabled={status === 'loading'}
                    className="px-8 py-3 bg-indigo-600 text-white font-bold uppercase border-2 border-slate-900 shadow-hard-sm hover:shadow-none hover:translate-y-1 transition-all disabled:opacity-50"
                >
                    {status === 'loading' ? 'Verifying...' : 'Verify Now'}
                </button>
            </div>

            {status === 'valid' && (
                <div className="animate-in slide-in-from-bottom-2 bg-green-100 dark:bg-green-900/30 border-2 border-green-600 p-6 flex items-start gap-4">
                    <CheckCircle className="text-green-600 shrink-0" size={32} />
                    <div>
                        <h3 className="text-xl font-black uppercase text-green-700 dark:text-green-400 mb-1">Certificate Valid</h3>
                        <p className="font-mono text-sm mb-2">Issued to: <span className="font-bold">Jayesh Patil</span></p>
                        <p className="font-mono text-sm mb-2">Course: <span className="font-bold">Advanced Computer Science</span></p>
                        <p className="font-mono text-xs text-slate-500">Hash: 0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069</p>
                    </div>
                </div>
            )}

            {status === 'invalid' && (
                <div className="animate-in slide-in-from-bottom-2 bg-red-100 dark:bg-red-900/30 border-2 border-red-600 p-6 flex items-start gap-4">
                    <XCircle className="text-red-600 shrink-0" size={32} />
                    <div>
                        <h3 className="text-xl font-black uppercase text-red-700 dark:text-red-400 mb-1">Verification Failed</h3>
                        <p className="font-mono text-sm">The certificate ID provided could not be found in the blockchain ledger or has been revoked.</p>
                    </div>
                </div>
            )}

            {status === 'idle' && (
                 <div className="text-center py-8 border-2 border-dashed border-slate-300 dark:border-slate-700">
                    <ShieldCheck size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                    <p className="font-mono text-sm text-slate-400">Enter a unique Certificate ID to verify its authenticity.</p>
                 </div>
            )}
        </div>
    </div>
  );
};