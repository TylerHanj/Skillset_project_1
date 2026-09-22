import type {
  ChatMessage,
  Course,
  Kpi,
  SettingItem,
  StudentProfile,
  Task,
  TaskStatus,
} from './types';

export const SUBJECTS: readonly string[] = [
  'PHYSICS',
  'MATHEMATICS',
  'HISTORY',
  'COMPUTER SCIENCE',
  'CHEMISTRY',
  'BIOLOGY',
  'ENGLISH',
];

export const TIME_ESTIMATES: readonly string[] = [
  '30m',
  '1h 00m',
  '1h 30m',
  '2h 00m',
  '2h 30m',
  '3h 00m',
  '3h 30m',
  '4h 00m',
];

export const DUE_TIMES: readonly string[] = [
  '8:00 AM',
  '9:00 AM',
  '11:59 AM',
  '12:00 PM',
  '2:00 PM',
  '5:00 PM',
  '8:00 PM',
  '11:59 PM',
];

export const TASK_FILTERS: readonly Array<'All' | TaskStatus> = [
  'All',
  'Todo',
  'In Progress',
  'Done',
];

export const STATUS_CYCLE: readonly TaskStatus[] = ['Todo', 'In Progress', 'Done'];

export const QUICK_PROMPTS: readonly string[] = [
  'Summarize my week',
  "Explain Gauss's Law",
  'Quiz me on Chapter 5',
  'Prioritize my tasks',
];

export const STUDENT_PROFILE: StudentProfile = {
  firstName: 'Alex',
  lastName: 'Chen',
  year: 'Junior',
  major: 'Computer Science',
  institution: 'MIT',
};

export const INITIAL_TASKS: Task[] = [
  {
    id: 1,
    subject: 'PHYSICS',
    title: 'Problem Set 4 — Electromagnetism',
    due: 'Today, 11:59 PM',
    dueDate: '2026-09-22',
    dueTime: '11:59 PM',
    status: 'Todo',
    urgent: true,
    timeEst: '2h 30m',
  },
  {
    id: 2,
    subject: 'MATHEMATICS',
    title: 'Linear Algebra — Chapter 5 Review',
    due: 'Tomorrow, 8:00 AM',
    dueDate: '2026-09-23',
    dueTime: '8:00 AM',
    status: 'In Progress',
    urgent: false,
    timeEst: '1h 15m',
  },
  {
    id: 3,
    subject: 'HISTORY',
    title: 'Essay Draft — Industrial Revolution',
    due: 'Sept 17, 5:00 PM',
    dueDate: '2026-09-17',
    dueTime: '5:00 PM',
    status: 'Done',
    urgent: false,
    timeEst: '3h 00m',
  },
  {
    id: 4,
    subject: 'COMPUTER SCIENCE',
    title: 'Algorithm Analysis Lab Report',
    due: 'Sept 24, 11:59 PM',
    dueDate: '2026-09-24',
    dueTime: '11:59 PM',
    status: 'Todo',
    urgent: false,
    timeEst: '1h 45m',
  },
  {
    id: 5,
    subject: 'CHEMISTRY',
    title: 'Lab Report — Titration Experiment',
    due: 'Sept 25, 9:00 AM',
    dueDate: '2026-09-25',
    dueTime: '9:00 AM',
    status: 'Todo',
    urgent: false,
    timeEst: '2h 00m',
  },
  {
    id: 6,
    subject: 'PHYSICS',
    title: 'Midterm Exam',
    due: 'Sept 28, 2:00 PM',
    dueDate: '2026-09-28',
    dueTime: '2:00 PM',
    status: 'Todo',
    urgent: true,
    timeEst: '2h 00m',
  },
  {
    id: 7,
    subject: 'COMPUTER SCIENCE',
    title: 'Final Project Presentation',
    due: 'Sept 30, 3:00 PM',
    dueDate: '2026-09-30',
    dueTime: '3:00 PM',
    status: 'Todo',
    urgent: true,
    timeEst: '1h 00m',
  },
];

export const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 1,
    role: 'ai',
    text: "Hello, Alex. I've reviewed your schedule for today. You have 3 pending tasks, with Physics Problem Set due at 11:59 PM. Would you like me to generate a focused study plan?",
    time: '9:04 AM',
  },
  {
    id: 2,
    role: 'user',
    text: 'Yes, create a study plan for Physics. I have 3 hours free starting at 2 PM.',
    time: '9:06 AM',
  },
  {
    id: 3,
    role: 'ai',
    text: "Study plan generated.\n\n2:00–2:30 PM — Review lecture notes on Gauss's Law.\n2:30–3:15 PM — Solve problems 1–4 (estimated difficulty: medium).\n3:15–3:30 PM — Break.\n3:30–4:30 PM — Problems 5–8, cross-reference textbook §18.3.\n4:30–5:00 PM — Review and finalize submission.\n\nShall I add these blocks to your calendar?",
    time: '9:06 AM',
  },
];

export const COURSES: Course[] = [
  { code: 'PHYS 201', name: 'Electromagnetism', grade: 'A−', tasks: 3 },
  { code: 'MATH 304', name: 'Linear Algebra', grade: 'A', tasks: 1 },
  { code: 'HIST 150', name: 'Modern History', grade: 'B+', tasks: 2 },
  { code: 'CS 310', name: 'Algorithm Analysis', grade: 'A+', tasks: 4 },
];

export const KPIS: Kpi[] = [
  { label: 'Tasks Completed', value: '47', sub: 'This semester' },
  { label: 'Study Streak', value: '12d', sub: 'Personal best: 18d', accent: true },
  { label: 'Avg. Session', value: '1h 42m', sub: '↑ 8% vs last week' },
  { label: 'GPA Estimate', value: '3.84', sub: 'Target: 3.90' },
];

export const INITIAL_SETTINGS: SettingItem[] = [
  { id: 'notifications', label: 'Notifications', toggle: true, on: true },
  { id: 'ai-mode', label: 'AI Study Mode', toggle: true, on: true },
  { id: 'sync', label: 'Data Sync', value: 'Google Calendar' },
  { id: 'year', label: 'Academic Year', value: '2025–2026' },
  { id: 'institution', label: 'Institution', value: 'MIT' },
  { id: 'export', label: 'Export Data', value: '↗' },
  { id: 'sign-out', label: 'Sign Out', value: '', danger: true },
];
