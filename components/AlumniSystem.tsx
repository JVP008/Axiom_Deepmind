
import React, { useState } from 'react';
import { Briefcase, Linkedin, Mail, MapPin, Search, Send, X, Filter } from 'lucide-react';

const ALUMNI = [
    { id: 1, name: 'Sarah Jenkins', role: 'Senior Engineer at Google', year: '2019', loc: 'Mountain View, CA', tags: ['AI/ML', 'Cloud'], isMentor: true },
    { id: 2, name: 'David Chen', role: 'Founder at TechStart', year: '2018', loc: 'New York, NY', tags: ['Startup', 'Fintech'], isMentor: false },
    { id: 3, name: 'Priya Sharma', role: 'Product Manager at Amazon', year: '2020', loc: 'Seattle, WA', tags: ['Product', 'E-commerce'], isMentor: true },
    { id: 4, name: 'James Wilson', role: 'Data Scientist at Netflix', year: '2019', loc: 'Los Gatos, CA', tags: ['Data', 'Streaming'], isMentor: true },
    { id: 5, name: 'Anita Roy', role: 'Research Fellow at MIT', year: '2021', loc: 'Cambridge, MA', tags: ['Research', 'Academia'], isMentor: false },
    { id: 6, name: 'Bob Smith', role: 'DevOps Lead at Stripe', year: '2018', loc: 'San Francisco, CA', tags: ['DevOps', 'Payments'], isMentor: true },
];

export const AlumniSystem: React.FC = () => {
  const [filterMentors, setFilterMentors] = useState(false);
  const [messagingAlumni, setMessagingAlumni] = useState<typeof ALUMNI[0] | null>(null);
  const [messageText, setMessageText] = useState('');
  const [sentMessage, setSentMessage] = useState(false);

  const filteredList = filterMentors ? ALUMNI.filter(a => a.isMentor) : ALUMNI;

  const handleSendMessage = () => {
      setSentMessage(true);
      setTimeout(() => {
          setSentMessage(false);
          setMessagingAlumni(null);
          setMessageText('');
      }, 1500);
  };

  return (
    <div className="space-y-6 relative">
       {/* Message Modal */}
       {messagingAlumni && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
               <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-100 shadow-hard w-full max-w-md animate-in zoom-in duration-200">
                   <div className="flex justify-between items-center p-4 border-b-2 border-slate-900 dark:border-slate-100">
                       <h3 className="font-black uppercase flex items-center gap-2">
                           <Mail size={18} /> Message {messagingAlumni.name}
                       </h3>
                       <button onClick={() => setMessagingAlumni(null)}><X size={20} /></button>
                   </div>
                   <div className="p-4">
                       {sentMessage ? (
                           <div className="flex flex-col items-center py-8 text-green-600">
                               <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                                   <Send size={24} className="ml-1" />
                               </div>
                               <p className="font-bold uppercase">Message Sent!</p>
                           </div>
                       ) : (
                           <>
                               <textarea 
                                   value={messageText}
                                   onChange={(e) => setMessageText(e.target.value)}
                                   placeholder="Introduce yourself and ask for guidance..."
                                   className="w-full h-32 p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-900 dark:border-slate-100 outline-none font-medium text-sm mb-4 resize-none"
                               />
                               <button 
                                   onClick={handleSendMessage}
                                   disabled={!messageText.trim()}
                                   className="w-full py-3 bg-slate-900 text-white font-bold uppercase disabled:opacity-50 hover:bg-slate-700 transition-colors"
                               >
                                   Send Message
                               </button>
                           </>
                       )}
                   </div>
               </div>
           </div>
       )}

       <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b-2 border-slate-900 dark:border-slate-100 pb-6">
            <div>
                <h2 className="text-3xl font-black uppercase">Alumni Network</h2>
                <p className="font-mono text-slate-500">Connect with 1,200+ graduates worldwide.</p>
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={() => setFilterMentors(!filterMentors)}
                    className={`px-4 py-2 font-bold uppercase border-2 border-slate-900 dark:border-white shadow-hard-sm hover:shadow-none hover:translate-y-1 transition-all flex items-center gap-2 ${filterMentors ? 'bg-neo-green text-slate-900' : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'}`}
                >
                    <Filter size={16} /> {filterMentors ? 'Showing Mentors' : 'Find Mentor'}
                </button>
                <button className="px-4 py-2 bg-white dark:bg-slate-800 font-bold uppercase border-2 border-slate-900 dark:border-slate-100 shadow-hard-sm hover:shadow-none hover:translate-y-1 transition-all">
                    Post Job
                </button>
            </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredList.map((alum) => (
                <div key={alum.id} className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-100 shadow-hard flex flex-col group hover:-translate-y-1 transition-transform duration-200">
                    <div className="p-6 flex-1">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 border-2 border-slate-900 dark:border-slate-100 flex items-center justify-center font-black text-xl">
                                {alum.name.charAt(0)}
                            </div>
                            <span className="font-mono text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 border border-slate-900 dark:border-slate-100">
                                Class of '{alum.year}
                            </span>
                        </div>
                        
                        <h3 className="text-xl font-bold uppercase mb-1 group-hover:underline decoration-4 decoration-yellow-400">{alum.name}</h3>
                        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-2 flex items-center gap-1">
                            <Briefcase size={14} /> {alum.role}
                        </p>
                        <p className="text-xs font-mono text-slate-500 mb-4 flex items-center gap-1">
                            <MapPin size={12} /> {alum.loc}
                        </p>

                        <div className="flex flex-wrap gap-2 mt-4">
                            {alum.tags.map(tag => (
                                <span key={tag} className="text-[10px] uppercase font-bold px-2 py-0.5 bg-yellow-100 dark:bg-slate-800 border border-slate-900 dark:border-slate-600">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="p-3 border-t-2 border-slate-900 dark:border-slate-100 bg-slate-50 dark:bg-slate-800 flex justify-between gap-2">
                        <button 
                            onClick={() => setMessagingAlumni(alum)}
                            className="flex-1 py-2 flex items-center justify-center gap-2 font-bold text-xs uppercase border-2 border-transparent hover:border-slate-900 hover:bg-white transition-all"
                        >
                            <Mail size={14} /> Message
                        </button>
                         <button className="py-2 px-3 flex items-center justify-center border-2 border-transparent hover:border-[#0077b5] hover:text-[#0077b5] transition-all">
                            <Linkedin size={16} />
                        </button>
                    </div>
                </div>
            ))}
       </div>
    </div>
  );
};
