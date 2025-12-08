

import { Student, Teacher, ClassSession } from './types';

export const STUDENTS: Student[] = [
  {
    id: 's1',
    name: 'Jayesh Patil',
    rollNumber: 'CS2024001',
    attendance: 92,
    grades: [{ subject: 'Math', score: 88 }, { subject: 'CS', score: 95 }],
    activities: ['Hackathon Winner', 'Coding Club President'],
    riskScore: 10,
    skills: ['Python', 'React', 'Public Speaking'],
    interests: ['AI', 'Web Development']
  },
  {
    id: 's2',
    name: 'Diya Sharma',
    rollNumber: 'CS2024002',
    attendance: 65,
    grades: [{ subject: 'Math', score: 45 }, { subject: 'CS', score: 60 }],
    activities: ['Drama Club'],
    riskScore: 85,
    skills: ['Acting', 'Communication'],
    interests: ['Arts', 'Literature']
  },
  {
    id: 's3',
    name: 'Rohan Gupta',
    rollNumber: 'CS2024003',
    attendance: 78,
    grades: [{ subject: 'Math', score: 72 }, { subject: 'CS', score: 80 }],
    activities: ['Cricket Team'],
    riskScore: 35,
    skills: ['Teamwork', 'C++'],
    interests: ['Sports', 'Game Development']
  },
  {
    id: 's4',
    name: 'Ishaan Kumar',
    rollNumber: 'CS2024004',
    attendance: 88,
    grades: [{ subject: 'Math', score: 90 }, { subject: 'CS', score: 85 }],
    activities: ['Debate Club'],
    riskScore: 15,
    skills: ['Java', 'Critical Thinking'],
    interests: ['Law', 'Technology']
  },
  {
    id: 's5',
    name: 'Meera Reddy',
    rollNumber: 'CS2024005',
    attendance: 95,
    grades: [{ subject: 'Math', score: 98 }, { subject: 'CS', score: 96 }],
    activities: ['Robotics Club', 'Science Fair'],
    riskScore: 5,
    skills: ['Electronics', 'C', 'Physics'],
    interests: ['Robotics', 'Space Science']
  }
];

export const TEACHERS: Teacher[] = [
  { id: 't1', name: 'Dr. S. Rao', subject: 'Computer Science' },
  { id: 't2', name: 'Prof. A. Singh', subject: 'Mathematics' },
  { id: 't3', name: 'Mrs. K. Iyer', subject: 'Physics' },
];

export const INITIAL_TIMETABLE: ClassSession[] = [
  { id: 'c1', day: 'Monday', time: '09:00', subject: 'Mathematics', code: 'MAT101', professorName: 'Prof. A. Singh', roomId: '101', color: 'bg-neo-pink' },
  { id: 'c2', day: 'Monday', time: '10:00', subject: 'Computer Science', code: 'CS202', professorName: 'Dr. S. Rao', roomId: 'LAB-A', color: 'bg-neo-blue' },
  { id: 'c3', day: 'Tuesday', time: '09:00', subject: 'Physics', code: 'PHY101', professorName: 'Mrs. K. Iyer', roomId: '102', color: 'bg-neo-green' },
];

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
export const TIMES = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00'];