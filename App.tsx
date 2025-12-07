
import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Timetable } from './components/Timetable';
import { Attendance } from './components/Attendance';
import { CareerAdvisor } from './components/CareerAdvisor';
import { StudentTracker } from './components/StudentTracker';
import { GamifiedLearning } from './components/GamifiedLearning';
import { AlumniSystem } from './components/AlumniSystem';
import { LearningHub } from './components/LearningHub';
import { CertificateValidator } from './components/CertificateValidator';
import { Wellness } from './components/Wellness';
import { StudyPlanner } from './components/StudyPlanner';
import { DoubtSolver } from './components/DoubtSolver';
import { ModuleId } from './types';
import { AlertTriangle } from 'lucide-react';
import { getDropoutAnalysis } from './services/ai';
import { STUDENTS } from './constants';

const DropoutPredictor = () => {
    const [analysis, setAnalysis] = useState<Record<string, string>>({});
    
    const analyze = async (id: string) => {
        const student = STUDENTS.find(s => s.id === id);
        if(!student) return;
        setAnalysis(prev => ({...prev, [id]: "Analyzing..."}));
        const res = await getDropoutAnalysis(student);
        setAnalysis(prev => ({...prev, [id]: res}));
    };

    return (
        <div className="space-y-6">
             <div className="flex items-center gap-3 mb-8 border-b-2 border-slate-900 dark:border-slate-100 pb-4">
                <div className="p-2 bg-red-500 border-2 border-slate-900 text-white shadow-hard-sm">
                    <AlertTriangle size={24} />
                </div>
                <h2 className="text-3xl font-black uppercase">Dropout Risk Analysis</h2>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {STUDENTS.map(s => (
                    <div key={s.id} className="bg-white dark:bg-slate-900 p-6 border-2 border-slate-900 dark:border-slate-100 shadow-hard relative">
                        {s.riskScore > 50 && (
                            <div className="absolute -top-3 -right-3 px-3 py-1 bg-red-500 text-white text-xs font-bold border-2 border-slate-900 shadow-hard-sm uppercase">
                                High Risk
                            </div>
                        )}
                        <div className="flex justify-between items-start mb-6 border-b-2 border-slate-100 dark:border-slate-800 pb-4">
                            <div>
                                <h3 className="font-bold text-lg uppercase">{s.name}</h3>
                                <p className="font-mono text-xs text-slate-500">{s.rollNumber}</p>
                            </div>
                            <div className={`text-3xl font-black ${s.riskScore > 50 ? 'text-red-500' : 'text-green-500'}`}>
                                {s.riskScore}%
                            </div>
                        </div>
                        <div className="space-y-3 font-mono text-sm text-slate-700 dark:text-slate-300 mb-6">
                            <div className="flex justify-between border-b border-dashed border-slate-300 pb-1">
                                <span>Attendance</span>
                                <span className="font-bold">{s.attendance}%</span>
                            </div>
                            <div className="flex justify-between border-b border-dashed border-slate-300 pb-1">
                                <span>Avg Grade</span>
                                <span className="font-bold">
                                    {Math.round(s.grades.reduce((a, b) => a + b.score, 0) / s.grades.length)}%
                                </span>
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 p-3 border-2 border-slate-900 dark:border-slate-100 text-sm min-h-[80px] mb-4">
                            <p className="font-bold text-xs uppercase mb-1 text-slate-400">AI Observation:</p>
                            {analysis[s.id] || <span className="text-slate-400 italic">...</span>}
                        </div>
                        <button 
                            onClick={() => analyze(s.id)}
                            className="w-full py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-900 dark:border-slate-100 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-colors font-bold text-sm uppercase shadow-hard-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                        >
                            Analyze
                        </button>
                    </div>
                ))}
             </div>
        </div>
    )
}

function App() {
  const [currentModule, setCurrentModule] = useState<ModuleId>('dashboard');

  const renderModule = () => {
    switch (currentModule) {
      case 'dashboard': return <Dashboard />;
      case 'timetable': return <Timetable />;
      case 'attendance': return <Attendance />;
      case 'students': return <StudentTracker />;
      case 'career': return <CareerAdvisor />;
      case 'alumni': return <AlumniSystem />;
      case 'dropout': return <DropoutPredictor />;
      case 'learning': return <GamifiedLearning />;
      case 'hub': return <LearningHub />;
      case 'validator': return <CertificateValidator />;
      case 'wellness': return <Wellness />;
      case 'study': return <StudyPlanner />;
      case 'doubts': return <DoubtSolver />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout currentModule={currentModule} onModuleChange={setCurrentModule}>
      {renderModule()}
    </Layout>
  );
}

export default App;
