
import React from 'react';
import { 
  LayoutDashboard, 
  CalendarDays, 
  ClipboardCheck, 
  UserSquare2, 
  Compass, 
  GraduationCap, 
  AlertTriangle, 
  Gamepad2, 
  Library, 
  BadgeCheck,
  Menu,
  X,
  Moon,
  Sun,
  Heart,
  CheckSquare,
  HelpCircle,
  GraduationCap as TeacherCap,
  Zap
} from 'lucide-react';
import { ModuleId, UserRole } from '../types';

interface LayoutProps {
  currentModule: ModuleId;
  onModuleChange: (id: ModuleId) => void;
  userRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  children: React.ReactNode;
}

const STUDENT_MENU: { id: ModuleId; label: string; icon: React.ReactNode; color: string; special?: boolean }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, color: 'bg-neo-blue' },
  { id: 'timetable', label: 'My Timetable', icon: <CalendarDays size={20} />, color: 'bg-neo-pink' },
  { id: 'attendance', label: 'My Attendance', icon: <ClipboardCheck size={20} />, color: 'bg-neo-green' },
  { id: 'study', label: 'Study Planner', icon: <CheckSquare size={20} />, color: 'bg-purple-400' },
  { id: 'doubts', label: 'Doubt Solver', icon: <HelpCircle size={20} />, color: 'bg-cyan-400' },
  { id: 'career', label: 'Career Advisor', icon: <Compass size={20} />, color: 'bg-neo-yellow' },
  { id: 'learning', label: 'Gamified Learning', icon: <Gamepad2 size={20} />, color: 'bg-lime-400' },
  { id: 'hub', label: 'Learning Hub', icon: <Library size={20} />, color: 'bg-teal-400' },
  { id: 'wellness', label: 'Wellness Center', icon: <Heart size={20} />, color: 'bg-red-400' },
  { id: 'validator', label: 'Cert Validator', icon: <BadgeCheck size={20} />, color: 'bg-sky-400' },
  { id: 'live', label: 'AXIOM Live', icon: <Zap size={20} className="fill-current" />, color: 'bg-red-500', special: true },
];

const TEACHER_MENU: { id: ModuleId; label: string; icon: React.ReactNode; color: string; special?: boolean }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, color: 'bg-neo-blue' },
  { id: 'students', label: 'Student Tracker', icon: <UserSquare2 size={20} />, color: 'bg-orange-400' },
  { id: 'attendance', label: 'Mark Attendance', icon: <ClipboardCheck size={20} />, color: 'bg-neo-green' },
  { id: 'timetable', label: 'Faculty Schedule', icon: <CalendarDays size={20} />, color: 'bg-neo-pink' },
  { id: 'dropout', label: 'Risk Analysis', icon: <AlertTriangle size={20} />, color: 'bg-rose-400' },
  { id: 'alumni', label: 'Alumni Network', icon: <GraduationCap size={20} />, color: 'bg-indigo-400' },
  { id: 'wellness', label: 'Class Wellness', icon: <Heart size={20} />, color: 'bg-red-400' },
];

export const Layout: React.FC<LayoutProps> = ({ currentModule, onModuleChange, userRole, onRoleChange, children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 1024);
  const [darkMode, setDarkMode] = React.useState(false);

  const menuItems = userRole === 'student' ? STUDENT_MENU : TEACHER_MENU;

  React.useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) setIsSidebarOpen(true);
      else setIsSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f0f4f8] dark:bg-slate-900">
      {/* Mobile Sidebar Overlay */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-30
          w-64 bg-white dark:bg-slate-900 border-r-2 border-slate-900 dark:border-slate-100
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-20 xl:w-64'}
          flex flex-col shadow-hard
        `}
      >
        <div className={`h-16 flex items-center justify-between px-4 border-b-2 border-slate-900 dark:border-slate-100 ${userRole === 'teacher' ? 'bg-orange-300' : 'bg-neo-yellow'} dark:bg-indigo-900`}>
          <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
            <div className="w-8 h-8 bg-white border-2 border-slate-900 dark:border-slate-100 flex items-center justify-center shrink-0 shadow-hard-sm text-slate-900 dark:text-slate-900">
              <span className="font-bold text-xl font-philosopher pt-0.5">A</span>
            </div>
            <span className={`font-bold text-2xl font-philosopher tracking-wide text-slate-900 dark:text-white ${!isSidebarOpen && !isMobile ? 'hidden xl:block' : 'block'}`}>
              AXIOM
            </span>
          </div>
          {isMobile && (
            <button onClick={() => setIsSidebarOpen(false)} className="p-1 hover:bg-black/10 rounded">
              <X size={20} />
            </button>
          )}
        </div>

        {/* Role Switcher */}
        <div className="p-4 bg-slate-100 dark:bg-slate-800 border-b-2 border-slate-900 dark:border-slate-100">
            <div className={`flex bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-100 p-1 ${!isSidebarOpen && !isMobile ? 'flex-col gap-1' : ''}`}>
                <button 
                    onClick={() => onRoleChange('student')}
                    className={`flex-1 text-xs font-bold uppercase py-1.5 px-2 transition-all ${userRole === 'student' ? 'bg-neo-yellow text-slate-900 shadow-sm border border-slate-900' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'}`}
                >
                    {(!isSidebarOpen && !isMobile) ? 'STU' : 'Student'}
                </button>
                <button 
                    onClick={() => onRoleChange('teacher')}
                    className={`flex-1 text-xs font-bold uppercase py-1.5 px-2 transition-all ${userRole === 'teacher' ? 'bg-neo-blue text-white shadow-sm border border-slate-900' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'}`}
                >
                    {(!isSidebarOpen && !isMobile) ? 'FAC' : 'Teacher'}
                </button>
            </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 bg-slate-50 dark:bg-slate-800/50">
          <ul className="space-y-2 px-3">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => {
                    onModuleChange(item.id);
                    if (isMobile) setIsSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 transition-all duration-200 border-2
                    ${currentModule === item.id 
                      ? `${item.color} text-slate-900 border-slate-900 dark:text-slate-900 dark:border-white shadow-hard-sm -translate-y-1` 
                      : 'bg-white text-slate-600 border-transparent hover:border-slate-900 dark:bg-transparent dark:text-slate-300 dark:hover:border-slate-100 hover:shadow-hard-sm hover:translate-x-1'}
                    ${item.special ? 'animate-pulse font-black' : ''}
                  `}
                  title={item.label}
                >
                  <span className={`shrink-0 ${currentModule === item.id ? 'text-slate-900' : ''}`}>{item.icon}</span>
                  <span className={`font-medium whitespace-nowrap ${!isSidebarOpen && !isMobile ? 'hidden xl:block' : 'block'}`}>
                    {item.label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t-2 border-slate-900 dark:border-slate-100 bg-white dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-3 overflow-hidden ${!isSidebarOpen && !isMobile ? 'hidden xl:flex' : 'flex'}`}>
                <div className={`w-8 h-8 rounded-none border-2 border-slate-900 dark:border-slate-100 ${userRole === 'student' ? 'bg-neo-pink' : 'bg-orange-400'} dark:bg-slate-700 flex items-center justify-center shadow-hard-sm`}>
                    <span className="text-sm font-bold font-mono">{userRole === 'student' ? 'ST' : 'TR'}</span>
                </div>
                <div className="overflow-hidden">
                    <p className="text-sm font-bold truncate">{userRole === 'student' ? 'Jayesh Patil' : 'Dr. S. Rao'}</p>
                </div>
            </div>
             <button 
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 border-2 border-slate-900 dark:border-slate-100 bg-white dark:bg-slate-700 shadow-hard-sm hover:translate-y-0.5 hover:shadow-none transition-all"
             >
                {darkMode ? <Sun size={16} /> : <Moon size={16} />}
             </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-16 flex items-center justify-between px-6 bg-white dark:bg-slate-900 border-b-2 border-slate-900 dark:border-slate-100 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 border-2 border-slate-900 dark:border-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden shadow-hard-sm"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                <span className={`w-3 h-3 border-2 border-slate-900 dark:border-white ${menuItems.find(m => m.id === currentModule)?.color}`}></span>
                {menuItems.find(m => m.id === currentModule)?.label}
            </h1>
          </div>
          {userRole === 'teacher' && (
              <div className="hidden md:flex px-3 py-1 bg-orange-100 border-2 border-slate-900 items-center gap-2 text-xs font-bold uppercase">
                  <TeacherCap size={16} /> Faculty Access
              </div>
          )}
        </header>
        
        <div className="flex-1 overflow-auto p-4 lg:p-6 relative scroll-smooth">
            {children}
        </div>
      </main>
    </div>
  );
};
