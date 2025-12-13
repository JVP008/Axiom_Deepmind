import React from 'react';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  AlertCircle,
  GraduationCap,
  BookOpen,
  Clock,
  Target
} from 'lucide-react';
import { STUDENTS } from '../constants';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis,
  AreaChart,
  Area,
  ComposedChart,
  Line
} from 'recharts';
import { UserRole } from '../types';

interface DashboardProps {
    role: UserRole;
}

export const Dashboard: React.FC<DashboardProps> = ({ role }) => {
  const totalStudents = STUDENTS.length;
  const avgAttendance = STUDENTS.reduce((acc, s) => acc + s.attendance, 0) / totalStudents;
  const atRiskStudents = STUDENTS.filter(s => s.riskScore > 50).length;

  // --- CHART DATA ---

  // 1. RADAR: Subject Mastery (Me vs Class)
  const subjectData = [
    { subject: 'Math', me: 88, classAvg: 75, fullMark: 100 },
    { subject: 'CS', me: 95, classAvg: 82, fullMark: 100 },
    { subject: 'Physics', me: 72, classAvg: 78, fullMark: 100 },
    { subject: 'AI/ML', me: 92, classAvg: 85, fullMark: 100 },
    { subject: 'Ethics', me: 85, classAvg: 88, fullMark: 100 },
    { subject: 'English', me: 78, classAvg: 80, fullMark: 100 },
  ];

  // 2. AREA: Academic Trajectory (Time Trend)
  const trendData = [
    { month: 'Sep', grade: 65, avg: 70 },
    { month: 'Oct', grade: 75, avg: 72 },
    { month: 'Nov', grade: 82, avg: 74 },
    { month: 'Dec', grade: 78, avg: 76 },
    { month: 'Jan', grade: 88, avg: 78 },
    { month: 'Feb', grade: 92, avg: 80 },
  ];

  // 3. COMPOSED: Study Efficiency (Hours vs Grade)
  const efficiencyData = [
      { subject: 'Math', hours: 12, grade: 88 }, // High effort, Good result
      { subject: 'CS', hours: 8, grade: 95 },    // Low effort, High result (Efficient)
      { subject: 'Physics', hours: 15, grade: 72 }, // High effort, Low result (Needs help)
      { subject: 'AI/ML', hours: 10, grade: 92 },
      { subject: 'English', hours: 4, grade: 78 },
  ];

  const teacherData = [
      { name: 'CS101', attendance: 95 },
      { name: 'CS202', attendance: 82 },
      { name: 'AI303', attendance: 88 },
      { name: 'PHY101', attendance: 75 },
      { name: 'MAT101', attendance: 90 },
  ];

  // Helper for color logic for cards
  const getAttendanceColorInfo = (value: number) => {
    if (value > 75) return { tailwind: 'bg-neo-green', hex: '#23EB87', shadow: 'shadow-emerald-900' };
    if (value >= 50) return { tailwind: 'bg-neo-yellow', hex: '#FFC900', shadow: 'shadow-yellow-900' };
    return { tailwind: 'bg-red-500', hex: '#EF4444', shadow: 'shadow-red-900' };
  };

  const attColorInfo = getAttendanceColorInfo(avgAttendance);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border-2 border-slate-900 shadow-hard-sm text-xs font-mono">
          <p className="font-bold uppercase mb-1">{label}</p>
          {payload.map((p: any, idx: number) => (
              <p key={idx} style={{ color: p.color }} className="font-bold">
                  {p.name}: {p.value}
              </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (role === 'teacher') {
      return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Total Students" 
                    value="60" 
                    icon={<Users className="text-slate-900" />} 
                    trend="2 Absent Today"
                    color="bg-neo-blue"
                    shadowColor="shadow-blue-900"
                />
                <StatCard 
                    title="Class Avg" 
                    value={`${avgAttendance.toFixed(0)}%`} 
                    icon={<TrendingUp className="text-slate-900" />} 
                    trend="-2% vs Last Wk"
                    color={attColorInfo.tailwind}
                    shadowColor={attColorInfo.shadow}
                />
                <StatCard 
                    title="At Risk" 
                    value={atRiskStudents.toString()} 
                    icon={<AlertCircle className="text-slate-900" />} 
                    trend="Requires Action"
                    color="bg-red-400"
                    shadowColor="shadow-red-900"
                />
                <StatCard 
                    title="Pending Grade" 
                    value="12" 
                    icon={<BookOpen className="text-slate-900" />} 
                    trend="Assignments"
                    color="bg-neo-yellow"
                    shadowColor="shadow-yellow-900"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Teacher Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 border-2 border-slate-900 dark:border-slate-100 shadow-hard">
                    <h3 className="text-lg font-black font-mono mb-6 uppercase border-b-4 inline-block pb-1 border-slate-900 dark:border-slate-100">Attendance by Course</h3>
                    <div className="h-64 w-full min-w-0">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <BarChart data={teacherData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" stroke="currentColor" tick={{fontSize: 12, fontWeight: 'bold'}} />
                                <YAxis stroke="currentColor" tick={{fontSize: 12, fontWeight: 'bold'}} />
                                <Tooltip cursor={{fill: 'transparent'}} content={<CustomTooltip />} />
                                <Bar dataKey="attendance" fill="#23EB87" stroke="#000" strokeWidth={2} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Teacher Alerts */}
                <div className="bg-white dark:bg-slate-900 p-6 border-2 border-slate-900 dark:border-slate-100 shadow-hard">
                    <h3 className="text-lg font-black font-mono mb-6 uppercase border-b-4 border-neo-pink inline-block pb-1">Faculty Alerts</h3>
                    <div className="space-y-4">
                        {STUDENTS.filter(s => s.riskScore > 50).map(s => (
                            <AlertItem 
                                key={s.id}
                                type="warning" 
                                title="Dropout Risk" 
                                desc={`${s.name} - ${s.riskScore}% Risk Score`} 
                                time="Today"
                            />
                        ))}
                        <AlertItem 
                            type="info" 
                            title="Admin Note" 
                            desc="Submit grades by Friday" 
                            time="1h ago"
                        />
                    </div>
                </div>
            </div>
        </div>
      );
  }

  // STUDENT VIEW
  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Attendance" 
          value="92%" 
          icon={<Calendar className="text-slate-900" />} 
          trend="Present Today"
          color="bg-neo-green"
          shadowColor="shadow-green-900"
        />
        <StatCard 
          title="Avg Grade" 
          value="88%" 
          icon={<GraduationCap className="text-slate-900" />} 
          trend="Top 10%"
          color="bg-neo-pink"
          shadowColor="shadow-pink-900"
        />
        <StatCard 
          title="Assignments" 
          value="3" 
          icon={<BookOpen className="text-slate-900" />} 
          trend="Due this week"
          color="bg-neo-yellow"
          shadowColor="shadow-yellow-900"
        />
        <StatCard 
          title="Rank" 
          value="#4" 
          icon={<TrendingUp className="text-slate-900" />} 
          trend="Class of 60"
          color="bg-neo-blue"
          shadowColor="shadow-blue-900"
        />
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* CHART 1: Subject Mastery (Radar) */}
        <div className="bg-white dark:bg-slate-900 p-6 border-2 border-slate-900 dark:border-slate-100 shadow-hard">
          <div className="flex justify-between items-center mb-2 border-b-4 border-slate-900 dark:border-slate-100 pb-1">
             <h3 className="text-lg font-black font-mono uppercase">Subject Mastery</h3>
             <span className="text-xs font-bold uppercase bg-neo-yellow px-2 py-1 text-slate-900 border border-slate-900">Skill Profile</span>
          </div>
          
          <div className="h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={subjectData}>
                <PolarGrid stroke="#94a3b8" />
                <PolarAngleAxis 
                    dataKey="subject" 
                    tick={{ fill: 'currentColor', fontSize: 11, fontWeight: 'bold' }} 
                />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Radar
                    name="Class Avg"
                    dataKey="classAvg"
                    stroke="#F97316"
                    strokeWidth={3}
                    fill="#F97316"
                    fillOpacity={0.2}
                />
                <Radar
                    name="My Grade"
                    dataKey="me"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    fill="#3B82F6"
                    fillOpacity={0.5}
                />
                <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: Academic Trajectory (Area) */}
        <div className="bg-white dark:bg-slate-900 p-6 border-2 border-slate-900 dark:border-slate-100 shadow-hard">
          <div className="flex justify-between items-center mb-2 border-b-4 border-slate-900 dark:border-slate-100 pb-1">
             <h3 className="text-lg font-black font-mono uppercase">Academic Trajectory</h3>
             <span className="text-xs font-bold uppercase bg-neo-green px-2 py-1 text-slate-900 border border-slate-900">Trend</span>
          </div>
          
          <div className="h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorGrade" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="currentColor" tick={{fontSize: 12, fontWeight: 'bold'}} />
                <YAxis stroke="currentColor" tick={{fontSize: 12, fontWeight: 'bold'}} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="grade" stroke="#065F46" strokeWidth={3} fillOpacity={1} fill="url(#colorGrade)" name="My Grade" />
                <Area type="monotone" dataKey="avg" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" fill="transparent" name="Class Avg" />
                <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 3: Study Efficiency (Composed) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 border-2 border-slate-900 dark:border-slate-100 shadow-hard">
          <div className="flex justify-between items-center mb-2 border-b-4 border-slate-900 dark:border-slate-100 pb-1">
             <h3 className="text-lg font-black font-mono uppercase">Effort vs Output</h3>
             <span className="text-xs font-bold uppercase bg-neo-blue px-2 py-1 text-white border border-slate-900">Efficiency</span>
          </div>
          
          <div className="h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <ComposedChart data={efficiencyData}>
                <CartesianGrid stroke="#f5f5f5" vertical={false} />
                <XAxis dataKey="subject" stroke="currentColor" tick={{fontSize: 12, fontWeight: 'bold'}} />
                <YAxis yAxisId="left" orientation="left" stroke="#F59E0B" tick={{fontSize: 12, fontWeight: 'bold'}} label={{ value: 'Hours', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#F59E0B' }} />
                <YAxis yAxisId="right" orientation="right" stroke="#4F46E5" tick={{fontSize: 12, fontWeight: 'bold'}} label={{ value: 'Grade', angle: 90, position: 'insideRight', fontSize: 10, fill: '#4F46E5' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                <Bar yAxisId="left" dataKey="hours" name="Study Hours" barSize={20} fill="#F59E0B" stroke="#000" />
                <Line yAxisId="right" type="monotone" dataKey="grade" name="Grade %" stroke="#4F46E5" strokeWidth={3} dot={{r: 4, strokeWidth: 2, fill: '#fff', stroke: '#4F46E5'}} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Recent Activity / Notifications Row */}
      <div className="bg-white dark:bg-slate-900 p-6 border-2 border-slate-900 dark:border-slate-100 shadow-hard">
        <h3 className="text-lg font-black font-mono mb-6 uppercase border-b-4 border-neo-pink inline-block pb-1">Notifications</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AlertItem 
            type="success" 
            title="Achievement Unlocked" 
            desc="Code Wizard Badge" 
            time="2h ago"
            />
            <AlertItem 
            type="info" 
            title="Homework Due" 
            desc="Calculus Worksheet" 
            time="5h ago"
            />
            <AlertItem 
            type="warning" 
            title="Library Book" 
            desc="Due tomorrow" 
            time="1d ago"
            />
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, trend, color, shadowColor }: any) => {
  return (
    <div className={`${color} p-6 border-2 border-slate-900 dark:border-slate-100 shadow-hard relative overflow-hidden group hover:-translate-y-1 transition-transform`}>
      <div className="flex justify-between items-start relative z-10">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-900 opacity-70">{title}</p>
          <h3 className="text-4xl font-black mt-2 text-slate-900">{value}</h3>
        </div>
        <div className="p-3 border-2 border-slate-900 bg-white shadow-hard-sm">
          {icon}
        </div>
      </div>
      <p className="text-xs font-mono mt-4 font-bold flex items-center gap-1 text-slate-900">
        <span className="bg-white px-1 border border-slate-900">{trend}</span>
      </p>
    </div>
  );
};

const AlertItem = ({ type, title, desc, time }: any) => {
    let icon = <TrendingUp size={16} />;
    let colorClass = "bg-neo-blue";
    if (type === 'warning') { icon = <AlertCircle size={16} />; colorClass = "bg-neo-yellow"; }
    if (type === 'success') { icon = <TrendingUp size={16} />; colorClass = "bg-neo-green"; }
    if (type === 'info') { icon = <AlertCircle size={16} />; colorClass = "bg-neo-pink"; }

    return (
        <div className="flex gap-3 items-center p-3 border-2 border-slate-900 dark:border-slate-100 bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 transition-colors">
            <div className={`w-8 h-8 flex items-center justify-center shrink-0 border-2 border-slate-900 dark:border-slate-100 shadow-hard-sm ${colorClass} text-slate-900`}>
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{title}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{desc}</p>
            </div>
            <p className="text-[10px] font-mono font-bold bg-white dark:bg-slate-900 px-1 py-0.5 border border-slate-900 dark:border-slate-400">{time}</p>
        </div>
    )
}