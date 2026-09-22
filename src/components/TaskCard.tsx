import { Check, ChevronRight, Clock } from 'lucide-react';
import { STATUS_CYCLE } from '../mockData';
import type { Task, TaskStatus } from '../types';

interface TaskCardProps {
  task: Task;
  last: boolean;
  onStatusChange: (id: number, next: TaskStatus) => void;
}

function statusBadgeClass(status: TaskStatus): string {
  if (status === 'In Progress') {
    return 'border-blue-ink bg-blue-ink text-white';
  }
  if (status === 'Done') {
    return 'border-muted-4 bg-surface-3 text-muted';
  }
  return 'border-charcoal bg-page text-charcoal';
}

function statusDotClass(status: TaskStatus): string {
  if (status === 'In Progress') return 'bg-progress';
  if (status === 'Done') return 'bg-muted-3';
  return 'bg-charcoal';
}

export function TaskCard({ task, last, onStatusChange }: TaskCardProps) {
  const done = task.status === 'Done';

  function cycleStatus(): void {
    const index = STATUS_CYCLE.indexOf(task.status);
    const next = STATUS_CYCLE[(index + 1) % STATUS_CYCLE.length];
    onStatusChange(task.id, next);
  }

  function toggleDone(): void {
    onStatusChange(task.id, done ? 'Todo' : 'Done');
  }

  return (
    <article className={`py-4 ${last ? '' : 'border-b border-row'}`}>
      <div className="mb-1.5 flex items-center gap-[7px]">
        <button
          type="button"
          aria-label={done ? `Mark ${task.title} as not done` : `Mark ${task.title} as done`}
          aria-pressed={done}
          onClick={toggleDone}
          className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-sm border ${
            done ? 'border-muted-4 bg-surface-3' : 'border-charcoal bg-page'
          }`}
        >
          {done ? <Check size={11} strokeWidth={2.4} className="text-muted" /> : null}
        </button>
        {task.urgent ? (
          <span className="h-[7px] w-[7px] shrink-0 rounded-pill bg-accent-red" aria-label="Urgent" />
        ) : null}
        <p
          className={`font-display text-[9px] font-bold tracking-overline ${
            done ? 'text-muted-4' : 'text-[#888888]'
          }`}
        >
          {task.subject}
        </p>
        <div className="flex-1" />
        <button
          type="button"
          title="Tap to advance status"
          onClick={cycleStatus}
          className={`flex items-center gap-[5px] rounded-sm border px-2 py-[3px] ${statusBadgeClass(task.status)}`}
        >
          <span className={`h-[5px] w-[5px] shrink-0 rounded-pill ${statusDotClass(task.status)}`} />
          <span className="font-display text-[8px] font-bold tracking-[0.09em]">
            {task.status.toUpperCase()}
          </span>
          <ChevronRight size={10} className="opacity-50" aria-hidden />
        </button>
      </div>

      <p
        className={`mb-[7px] font-display text-sm leading-[1.3] ${
          done ? 'font-normal text-muted-3 line-through' : 'font-semibold text-charcoal'
        }`}
      >
        {task.title}
      </p>

      <div className="flex items-center gap-3.5">
        <span className={`flex items-center gap-[5px] text-[10px] ${done ? 'text-muted-4' : 'text-[#888888]'}`}>
          <Clock size={10} className="text-muted-4" aria-hidden />
          {task.due}
        </span>
        <span className={`flex items-center gap-[5px] text-[10px] ${done ? 'text-muted-4' : 'text-[#888888]'}`}>
          <span className="font-display text-[9px] font-semibold tracking-wide text-muted-4">EST</span>
          {task.timeEst}
        </span>
      </div>
    </article>
  );
}
