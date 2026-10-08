import { Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Task, TaskStatus } from '../types';
import { TaskCard } from './TaskCard';
import { useLanguage } from '../lib/language';

interface TaskListProps {
  tasks: Task[];
  onStatusChange: (id: string, next: TaskStatus) => void;
  onAddClick: () => void;
  topContent?: ReactNode;
}

export function TaskList({ tasks, onStatusChange, onAddClick, topContent }: TaskListProps) {
  const { t } = useLanguage();
  return (
    <section className="min-h-0 flex-1 overflow-y-auto px-6 pb-6" aria-label={t('Tasks')}>
      {topContent}
      {tasks.length === 0 ? (
        <p className="py-10 text-center font-display text-[13px] text-muted-4">{t('No tasks')}</p>
      ) : (
        tasks.map((task, index) => (
          <TaskCard
            key={task.id}
            task={task}
            last={index === tasks.length - 1}
            onStatusChange={onStatusChange}
          />
        ))
      )}

      <button
        type="button"
        onClick={onAddClick}
        className="mt-2 flex w-full items-center justify-center gap-2 bg-accent-red py-[13px] text-white"
      >
        <Plus size={11} strokeWidth={2.5} aria-hidden />
        <span className="font-display text-[10px] font-bold tracking-wider">{t('ADD NEW TASK')}</span>
      </button>
    </section>
  );
}
