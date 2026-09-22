import { Clock } from 'lucide-react';
import type { Task, TaskStatus } from '../types';

interface CalendarTaskRowProps {
  task: Task;
  last: boolean;
}

function statusColor(status: TaskStatus): string {
  if (status === 'In Progress') return 'text-blue-ink border-blue-ink';
  if (status === 'Done') return 'text-muted-3 border-muted-3';
  return 'text-charcoal border-charcoal';
}

export function CalendarTaskRow({ task, last }: CalendarTaskRowProps) {
  const done = task.status === 'Done';

  return (
    <article className={`px-6 py-4 ${last ? '' : 'border-b border-[#f2f2f2]'}`}>
      <div className="mb-[5px] flex items-center gap-2">
        {task.urgent ? <span className="h-1.5 w-1.5 shrink-0 rounded-pill bg-accent-red" /> : null}
        <p className={`font-display text-[9px] font-bold tracking-widest ${done ? 'text-muted-4' : 'text-[#888888]'}`}>
          {task.subject}
        </p>
        <div className="flex-1" />
        <span
          className={`rounded-sm border-hairline px-1.5 py-0.5 font-display text-[9px] font-semibold tracking-[0.07em] ${statusColor(task.status)} ${
            done ? 'opacity-50' : ''
          }`}
        >
          {task.status.toUpperCase()}
        </span>
      </div>
      <p
        className={`mb-1.5 font-display text-sm leading-[1.3] ${
          done ? 'font-normal text-muted-3 line-through' : 'font-semibold text-charcoal'
        }`}
      >
        {task.title}
      </p>
      <div className="flex gap-4">
        <span className="flex items-center gap-[5px] text-[10px] text-muted-2">
          <Clock size={9} className="text-muted-4" aria-hidden />
          {task.dueTime || 'All day'}
        </span>
        <span className="font-display text-[10px] text-muted-2">{task.timeEst}</span>
      </div>
    </article>
  );
}
