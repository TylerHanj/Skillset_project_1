export type TaskStatus = 'Todo' | 'In Progress' | 'Done';

export type TaskCategory = 'study' | 'personal' | 'general';

export type TaskFilter = 'All' | TaskStatus;

export type NavTab = 'home' | 'calendar' | 'chat' | 'profile';

export type ChatRole = 'user' | 'ai';

export type ProfileSection = 'kpis' | 'courses';

export interface Task {
  /** A string on the client, even when the backing database uses numeric ids. */
  id: string;
  title: string;
  /** ISO 8601 date/datetime, or null when the thought has no deadline. */
  dueDate: string | null;
  hasTime: boolean;
  category: TaskCategory;
  isCompleted: boolean;
  createdAt: string;

  // Existing planner presentation fields. These are derived from the attributes above
  // for AI-imported tasks and retained for the manual task sheet.
  subject: string;
  due: string;
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
  subject: string;
  open: number;
  total: number;
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

export interface NewTaskInput {
  subject: string;
  title: string;
  due: string;
  dueDate: string | null;
  dueTime: string;
  status: TaskStatus;
  urgent: boolean;
  timeEst: string;
  category?: TaskCategory;
  hasTime?: boolean;
  isCompleted?: boolean;
  createdAt?: string;
}
