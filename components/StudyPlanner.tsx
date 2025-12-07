import React, { useState, useEffect } from 'react';
import { CheckSquare, Flame, Clock, Plus, Play, Pause, RotateCcw, Award } from 'lucide-react';

interface Task {
    id: string;
    title: string;
    subject: string;
    duration: number; // minutes
    priority: 'high' | 'medium' | 'low';
    completed: boolean;
}

export const StudyPlanner: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([
        { id: '1', title: 'Complete Calculus Worksheet', subject: 'Math', duration: 45, priority: 'high', completed: false },
        { id: '2', title: 'Read Chapter 4: Optics', subject: 'Physics', duration: 30, priority: 'medium', completed: true },
        { id: '3', title: 'Write English Essay Draft', subject: 'English', duration: 60, priority: 'low', completed: false },
    ]);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [timerActive, setTimerActive] = useState(false);
    const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds

    useEffect(() => {
        let interval: any;
        if (timerActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setTimerActive(false);
        }
        return () => clearInterval(interval);
    }, [timerActive, timeLeft]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const toggleTask = (id: string) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    const addTask = () => {
        if (!newTaskTitle.trim()) return;
        const newTask: Task = {
            id: Date.now().toString(),
            title: newTaskTitle,
            subject: 'General',
            duration: 30,
            priority: 'medium',
            completed: false
        };
        setTasks([...tasks, newTask]);
        setNewTaskTitle('');
    };

    return (
        <div className="h-full flex flex-col md:flex-row gap-8">
            {/* Main Task Area */}
            <div className="flex-1 space-y-6">
                <div className="flex justify-between items-center bg-slate-900 text-white dark:bg-white dark:text-slate-900 p-6 border-2 border-slate-900 dark:border-white shadow-hard">
                    <div>
                        <h2 className="text-2xl font-black uppercase">Study Planner</h2>
                        <p className="font-mono text-sm opacity-80">{tasks.filter(t => t.completed).length}/{tasks.length} Tasks Completed</p>
                    </div>
                    <div className="flex items-center gap-2 bg-red-500 text-white px-3 py-1 border-2 border-white dark:border-slate-900 font-bold shadow-hard-sm">
                        <Flame size={18} fill="currentColor" />
                        <span>12 Day Streak</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-100 shadow-hard p-6">
                     <div className="flex gap-2 mb-6">
                        <input 
                            type="text" 
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addTask()}
                            placeholder="Add a new task..."
                            className="flex-1 p-3 bg-slate-100 dark:bg-slate-800 border-2 border-slate-900 dark:border-slate-100 outline-none font-medium"
                        />
                        <button 
                            onClick={addTask}
                            className="px-4 bg-indigo-600 text-white border-2 border-slate-900 shadow-hard-sm hover:translate-y-0.5 hover:shadow-none transition-all"
                        >
                            <Plus size={24} />
                        </button>
                     </div>

                     <div className="space-y-3">
                        {tasks.map(task => (
                            <div key={task.id} className={`flex items-center gap-4 p-4 border-2 border-slate-900 dark:border-slate-100 transition-all ${task.completed ? 'bg-slate-100 dark:bg-slate-800 opacity-60' : 'bg-white dark:bg-slate-900 shadow-hard-sm hover:-translate-y-1'}`}>
                                <button 
                                    onClick={() => toggleTask(task.id)}
                                    className={`w-6 h-6 border-2 border-slate-900 dark:border-slate-100 flex items-center justify-center ${task.completed ? 'bg-green-400' : 'bg-white dark:bg-slate-800'}`}
                                >
                                    {task.completed && <CheckSquare size={14} className="text-slate-900" />}
                                </button>
                                <div className="flex-1">
                                    <p className={`font-bold ${task.completed ? 'line-through decoration-2' : ''}`}>{task.title}</p>
                                    <div className="flex gap-2 text-xs font-mono mt-1">
                                        <span className="bg-slate-200 dark:bg-slate-700 px-2 py-0.5">{task.subject}</span>
                                        <span className="flex items-center gap-1"><Clock size={12} /> {task.duration}m</span>
                                    </div>
                                </div>
                                <div className={`w-3 h-3 rounded-full border border-slate-900 ${
                                    task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                                }`} title={`${task.priority} priority`}></div>
                            </div>
                        ))}
                     </div>
                </div>
            </div>

            {/* Sidebar: Widgets */}
            <div className="w-full md:w-80 space-y-6">
                {/* Focus Timer */}
                <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-100 shadow-hard p-6 flex flex-col items-center">
                    <h3 className="text-lg font-black uppercase mb-4 w-full text-center border-b-2 border-slate-900 dark:border-slate-100 pb-2">Focus Timer</h3>
                    <div className="text-6xl font-black font-mono tracking-tighter mb-6 text-slate-900 dark:text-white">
                        {formatTime(timeLeft)}
                    </div>
                    <div className="flex gap-2 w-full">
                        <button 
                            onClick={() => setTimerActive(!timerActive)}
                            className={`flex-1 py-3 flex items-center justify-center gap-2 font-bold uppercase border-2 border-slate-900 shadow-hard-sm hover:translate-y-0.5 hover:shadow-none transition-all ${timerActive ? 'bg-yellow-400 text-slate-900' : 'bg-green-400 text-slate-900'}`}
                        >
                            {timerActive ? <Pause size={20} /> : <Play size={20} />}
                            {timerActive ? 'Pause' : 'Start'}
                        </button>
                        <button 
                            onClick={() => { setTimerActive(false); setTimeLeft(25 * 60); }}
                            className="p-3 bg-white dark:bg-slate-800 border-2 border-slate-900 dark:border-slate-100 shadow-hard-sm hover:translate-y-0.5 hover:shadow-none transition-all"
                        >
                            <RotateCcw size={20} />
                        </button>
                    </div>
                    <p className="mt-4 text-xs font-mono uppercase text-slate-500">Pomodoro Technique • 25m Focus / 5m Break</p>
                </div>

                {/* Weekly Goals */}
                <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-100 shadow-hard p-6">
                    <h3 className="text-lg font-black uppercase mb-4 flex items-center gap-2">
                        <Award size={20} /> Weekly Goals
                    </h3>
                    <div className="space-y-4">
                        {[
                            { label: 'Study Hours', current: 12, target: 20, color: 'bg-blue-400' },
                            { label: 'Problems Solved', current: 45, target: 50, color: 'bg-green-400' },
                            { label: 'Chapters Done', current: 3, target: 5, color: 'bg-purple-400' },
                        ].map((goal, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-xs font-bold uppercase mb-1">
                                    <span>{goal.label}</span>
                                    <span>{goal.current}/{goal.target}</span>
                                </div>
                                <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 border border-slate-900 dark:border-slate-600">
                                    <div 
                                        className={`h-full ${goal.color} border-r border-slate-900`} 
                                        style={{ width: `${(goal.current / goal.target) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};