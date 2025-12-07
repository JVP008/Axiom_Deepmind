
import React from 'react';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  AlertCircle 
} from 'lucide-react';
import { STUDENTS } from '../constants';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export const Dashboard: React.FC = () => {
  const totalStudents = STUDENTS.length;
  const avgAttendance = STUDENTS.reduce((acc, s) => acc + s.attendance, 0) / totalStudents;
  const atRiskStudents = STUDENTS.filter(s => s.riskScore > 50).length;

  const data = [
    { name: 'Mon', attendance: 92 },
    { name: 'Tue', attendance: 88 },
    { name: 'Wed', attendance: 95 },
    { name: 'Thu', attendance: 85 },
    { name: 'Fri', attendance: 55 },
    { name: 'Sat', attendance: 25 },
  ];

  // Helper for color logic for cards
  const getAttendanceColorInfo = (value: number) => {
    if (value > 75) return { tailwind: 'bg-neo-green', hex: '#23EB87', shadow: 'shadow-emerald-900' };
    if (value >= 50) return { tailwind: 'bg-neo-yellow', hex: '#FFC900', shadow: 'shadow-yellow-900' };
    return { tailwind: 'bg-red-500', hex: '#EF4444', shadow: 'shadow-red-900' };
  };

  const attColorInfo = getAttendanceColorInfo(avgAttendance);

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Students" 
          value={totalStudents.toString()} 
          icon={<Users className="text-slate-900" />} 
          trend="+5%"
          color="bg-neo-blue"
          shadowColor="shadow-blue-900"
        />
        <StatCard 
          title="Avg Attendance" 
          value={`${avgAttendance.toFixed(1)}%`} 
          icon={<Calendar className="text-slate-900" />} 
          trend="+2.1%"
          color={attColorInfo.tailwind}
          shadowColor={attColorInfo.shadow}
        />
        <StatCard 
          title="Avg Grades" 
          value="76.4%" 
          icon={<TrendingUp className="text-slate-900" />} 
          trend="+1.2%"
          color="bg-neo-pink"
          shadowColor="shadow-pink-900"
        />
        <StatCard 
          title="At Risk" 
          value={atRiskStudents.toString()} 
          icon={<AlertCircle className="text-slate-900" />} 
          trend="HIGH"
          color="bg-neo-yellow"
          shadowColor="shadow-yellow-900"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 border-2 border-slate-900 dark:border-slate-100 shadow-hard">
          <h3 className="text-lg font-black font-mono mb-6 uppercase border-b-4 inline-block pb-1 border-slate-900 dark:border-slate-100">Attendance Trends</h3>
          <div className="h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  {/* Fill Gradient: Green to transparent */}
                  <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#23EB87" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#23EB87" stopOpacity={0}/>
                  </linearGradient>
                  
                  {/* Stroke Gradient: Smooth transition Green -> Yellow -> Red */}
                  <linearGradient id="strokeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#23EB87" stopOpacity={1} />
                    <stop offset="35%" stopColor="#23EB87" stopOpacity={1} />
                    <stop offset="60%" stopColor="#FFC900" stopOpacity={1} />
                    <stop offset="85%" stopColor="#EF4444" stopOpacity={1} />
                    <stop offset="100%" stopColor="#EF4444" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={true} tickLine={true} tick={{fill: 'currentColor', fontSize: 12, fontWeight: 'bold'}} stroke="currentColor" />
                <YAxis domain={[0, 100]} axisLine={true} tickLine={true} tick={{fill: 'currentColor', fontSize: 12, fontWeight: 'bold'}} stroke="currentColor" />
                <Tooltip 
                    contentStyle={{ 
                        borderRadius: '0px', 
                        border: '2px solid currentColor', 
                        boxShadow: '4px 4px 0px 0px currentColor',
                        backgroundColor: 'var(--tw-prose-body)',
                        fontWeight: 'bold',
                        color: 'currentColor'
                    }}
                />
                <Area 
                    type="monotone" 
                    dataKey="attendance" 
                    stroke="url(#strokeGradient)" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#colorAttendance)"
                    activeDot={{ r: 4, strokeWidth: 2, stroke: '#1e293b', fill: '#fff' }} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity / Notifications */}
        <div className="bg-white dark:bg-slate-900 p-6 border-2 border-slate-900 dark:border-slate-100 shadow-hard">
          <h3 className="text-lg font-black font-mono mb-6 uppercase border-b-4 border-neo-pink inline-block pb-1">Recent Alerts</h3>
          <div className="space-y-4">
            <AlertItem 
              type="warning" 
              title="Low Attendance" 
              desc="Diya Sharma < 70%" 
              time="2h ago"
            />
             <AlertItem 
              type="success" 
              title="Achievement" 
              desc="Aarav won Hackathon" 
              time="5h ago"
            />
             <AlertItem 
              type="info" 
              title="System Update" 
              desc="Timetable v2.0 live" 
              time="1d ago"
            />
             <AlertItem 
              type="warning" 
              title="Grade Drop" 
              desc="Rohan in Math" 
              time="2d ago"
            />
          </div>
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
        <span className="opacity-70">vs last period</span>
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
