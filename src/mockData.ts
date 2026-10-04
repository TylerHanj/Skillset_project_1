import type { TaskStatus } from './types';

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

export const TASK_FILTERS: ReadonlyArray<'All' | TaskStatus> = [
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
