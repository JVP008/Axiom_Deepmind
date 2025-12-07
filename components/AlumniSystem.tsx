
import React from 'react';
import { Briefcase, Linkedin, Mail, MapPin } from 'lucide-react';

const ALUMNI = [
    { id: 1, name: 'Sarah Jenkins', role: 'Senior Engineer at Google', year: '2019', loc: 'Mountain View, CA', tags: ['AI/ML', 'Cloud'] },
    { id: 2, name: 'David Chen', role: 'Founder at TechStart', year: '2018', loc: 'New York, NY', tags: ['Startup', 'Fintech'] },
    { id: 3, name: 'Priya Sharma', role: 'Product Manager at Amazon', year: '2020', loc: 'Seattle, WA', tags: ['Product', 'E-commerce'] },
    { id: 4, name: 'James Wilson', role: 'Data Scientist at Netflix', year: '2019', loc: 'Los Gatos, CA', tags: ['Data', 'Streaming'] },
    { id: 5, name: 'Anita Roy', role: 'Research Fellow at MIT', year: '2021', loc: 'Cambridge, MA', tags: ['Research', 'Academia'] },
    { id: 6, name: 'Bob Smith', role: 'DevOps Lead at Stripe', year: '2018', loc: 'San Francisco, CA', tags: ['DevOps', 'Payments'] },
];

export const AlumniSystem: React.FC = () => {
  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b-2 border-slate-900 dark:border-slate-100 pb-6">
            <div>
                <h2 className="text-3xl font-black uppercase">Alumni Network</h2>
                <p className="font-mono text-slate-500">Connect with 1,200+ graduates worldwide.</p>
            </div>
            <div className="flex gap-2">
                <button className="px-4 py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold uppercase border-2 border-slate-900 dark:border-white shadow-hard-sm hover:shadow-none hover:translate-y-1 transition-all">
                    Find Mentor
                </button>
                <button className="px-4 py-2 bg-white dark:bg-slate-800 font-bold uppercase border-2 border-slate-900 dark:border-slate-100 shadow-hard-sm hover:shadow-none hover:translate-y-1 transition-all">
                    Post Job
                </button>
            </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ALUMNI.map((alum) => (
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
                        <button className="flex-1 py-2 flex items-center justify-center gap-2 font-bold text-xs uppercase border-2 border-transparent hover:border-slate-900 hover:bg-white transition-all">
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
