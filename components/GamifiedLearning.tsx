import React, { useState } from 'react';
import { Trophy, Crown, Medal, Flame, ChevronRight } from 'lucide-react';

const LEADERBOARD = [
    { rank: 1, name: 'Aarav Patel', points: 2450, streak: 12 },
    { rank: 2, name: 'Meera Reddy', points: 2310, streak: 8 },
    { rank: 3, name: 'Ishaan Kumar', points: 2100, streak: 5 },
    { rank: 4, name: 'Rohan Gupta', points: 1950, streak: 3 },
    { rank: 5, name: 'Diya Sharma', points: 1800, streak: 1 },
];

export const GamifiedLearning: React.FC = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const quiz = [
      { q: "What is the Time Complexity of Binary Search?", options: ["O(n)", "O(log n)", "O(n^2)", "O(1)"], ans: 1 },
      { q: "Which data structure uses LIFO?", options: ["Queue", "Array", "Stack", "Tree"], ans: 2 },
      { q: "What does CSS stand for?", options: ["Computer Style Sheets", "Creative Style System", "Cascading Style Sheets", "Colorful Style Sheets"], ans: 2 },
  ];

  const handleAnswer = (idx: number) => {
      if(idx === quiz[currentQuestion].ans) setScore(score + 100);
      
      if(currentQuestion < quiz.length - 1) {
          setCurrentQuestion(currentQuestion + 1);
      } else {
          setShowResult(true);
      }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
        {/* Quiz Section */}
        <div className="lg:col-span-7 flex flex-col">
            <div className="flex-1 bg-violet-600 text-white border-2 border-slate-900 shadow-hard p-8 flex flex-col justify-center relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 p-4 opacity-20">
                    <Flame size={120} />
                </div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-400 rounded-full blur-3xl opacity-30"></div>

                {!showResult ? (
                    <>
                        <div className="flex justify-between items-center mb-8 relative z-10">
                            <span className="font-mono text-sm font-bold bg-neo-yellow text-slate-900 border-2 border-slate-900 px-3 py-1 shadow-hard-sm">
                                QUESTION {currentQuestion + 1}/{quiz.length}
                            </span>
                            <span className="font-mono text-sm font-bold bg-white text-slate-900 border-2 border-slate-900 px-3 py-1 shadow-hard-sm">SCORE: {score}</span>
                        </div>
                        
                        <h2 className="text-3xl font-black uppercase leading-tight mb-8 relative z-10">
                            {quiz[currentQuestion].q}
                        </h2>

                        <div className="grid grid-cols-1 gap-4 relative z-10">
                            {quiz[currentQuestion].options.map((opt, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => handleAnswer(idx)}
                                    className="p-4 text-left font-bold text-slate-900 bg-white border-2 border-slate-900 transition-all shadow-hard-sm hover:shadow-none hover:translate-x-1 hover:translate-y-1 group hover:bg-neo-green"
                                >
                                    <span className="inline-block w-8 font-mono opacity-50 font-black mr-2 bg-slate-200 px-1 border border-slate-900 text-center">{String.fromCharCode(65 + idx)}</span>
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="text-center animate-in zoom-in duration-300 relative z-10">
                        <Trophy size={80} className="mx-auto mb-6 text-neo-yellow drop-shadow-lg" />
                        <h2 className="text-5xl font-black uppercase mb-2 text-white text-shadow-sm">Quiz Complete!</h2>
                        <p className="font-mono text-xl mb-8 text-violet-200">Total Score: {score}</p>
                        <button 
                            onClick={() => { setShowResult(false); setCurrentQuestion(0); setScore(0); }}
                            className="px-8 py-3 bg-neo-yellow text-slate-900 border-2 border-slate-900 font-bold uppercase shadow-hard hover:translate-y-1 hover:shadow-none transition-all"
                        >
                            Play Again
                        </button>
                    </div>
                )}
            </div>
        </div>

        {/* Leaderboard Section */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-800 border-2 border-slate-900 dark:border-slate-100 shadow-hard p-0 flex flex-col">
            <div className="p-6 border-b-2 border-slate-900 dark:border-slate-100 bg-neo-yellow text-slate-900">
                <h3 className="text-xl font-black uppercase flex items-center gap-2">
                    <Crown className="text-slate-900 fill-white" size={24} /> 
                    Top Students
                </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-900">
                {LEADERBOARD.map((student) => (
                    <div key={student.rank} className="flex items-center gap-4 p-3 bg-white dark:bg-slate-800 border-2 border-slate-900 dark:border-slate-100 shadow-hard-sm transition-transform hover:-translate-y-1 group">
                        <div className={`w-10 h-10 flex items-center justify-center font-black text-lg border-2 border-slate-900 ${
                            student.rank === 1 ? 'bg-yellow-400 text-slate-900' : 
                            student.rank === 2 ? 'bg-gray-300 text-slate-900' : 
                            student.rank === 3 ? 'bg-orange-300 text-slate-900' : 'bg-slate-100 dark:bg-slate-700'
                        }`}>
                            {student.rank}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold uppercase text-sm group-hover:text-indigo-600 transition-colors">{student.name}</h4>
                            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
                                <Flame size={12} className="text-orange-500 fill-orange-500" /> {student.streak} day streak
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="block font-black text-lg text-indigo-600 dark:text-indigo-400">{student.points}</span>
                            <span className="text-[10px] font-mono uppercase text-slate-500">XP</span>
                        </div>
                    </div>
                ))}
            </div>
            <div className="p-4 border-t-2 border-slate-900 dark:border-slate-100 bg-white dark:bg-slate-800 text-center">
                <button className="text-sm font-bold uppercase flex items-center justify-center gap-1 hover:gap-2 transition-all text-indigo-600 dark:text-indigo-400">
                    View Full Leaderboard <ChevronRight size={16} />
                </button>
            </div>
        </div>
    </div>
  );
};