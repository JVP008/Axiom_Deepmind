
export type ModuleId = 
  | 'dashboard'
  | 'timetable'
  | 'attendance'
  | 'students'
  | 'career'
  | 'alumni'
  | 'dropout'
  | 'learning'
  | 'hub'
  | 'validator'
  | 'wellness'
  | 'study'
  | 'doubts';

export interface Student {
  id: string;
  name: string;
  rollNumber: string;
  attendance: number; // Percentage
  grades: { subject: string; score: number }[];
  activities: string[];
  riskScore: number; // 0-100
  skills: string[];
  interests: string[];
}

export interface Teacher {
  id: string;
  name: string;
  subject: string;
}

export interface ClassSession {
  id: string;
  day: string;
  time: string;
  subject: string;
  code?: string;
  teacherId?: string;
  professorName?: string;
  roomId: string;
  color?: string;
}

export interface AttendanceRecord {
  date: string;
  studentId: string;
  status: 'present' | 'absent' | 'late';
}

export interface CareerPath {
  title: string;
  match: number;
  description: string;
  roadmap: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}
