export type TaskStatus = 'Todo' | 'In Progress' | 'Done';

export type TaskFilter = 'All' | TaskStatus;

export type NavTab = 'home' | 'calendar' | 'chat' | 'profile';

export type ChatRole = 'user' | 'ai';

export type ProfileSection = 'kpis' | 'courses';

export interface Task {
  id: number;
  subject: string;
  title: string;
  due: string;
  dueDate: string;
  dueTime: string;
  status: TaskStatus;
  urgent: boolean;
  timeEst: string;
}

export interface ChatMessage {
  id: number;
  role: ChatRole;
  text: string;
  time: string;
}

export interface Course {
  code: string;
  name: string;
  grade: string;
  tasks: number;
}

export interface Kpi {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}

export interface SettingItem {
  id: string;
  label: string;
  value?: string;
  toggle?: boolean;
  on?: boolean;
  danger?: boolean;
}

export interface StudentProfile {
  firstName: string;
  lastName: string;
  year: string;
  major: string;
  institution: string;
}

export interface NewTaskInput {
  subject: string;
  title: string;
  due: string;
  dueDate: string;
  dueTime: string;
  status: TaskStatus;
  urgent: boolean;
  timeEst: string;
}
