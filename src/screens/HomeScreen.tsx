import { useMemo, useState } from 'react';
import { AddTaskSheet } from '../components/AddTaskSheet';
import { Header } from '../components/Header';
import { TaskList } from '../components/TaskList';
import { formatHeaderDate } from '../lib/calendar';
import { TASK_FILTERS } from '../mockData';
import type { NewTaskInput, Task, TaskFilter, TaskStatus } from '../types';

interface HomeScreenProps {
  tasks: Task[];
  onAddTask: (task: NewTaskInput) => void;
  onStatusChange: (id: number, next: TaskStatus) => void;
}

export function HomeScreen({ tasks, onAddTask, onStatusChange }: HomeScreenProps) {
  const [filter, setFilter] = useState<TaskFilter>('All');
  const [showModal, setShowModal] = useState(false);

  const pendingCount = tasks.filter((task) => task.status !== 'Done').length;
  const filtered = useMemo(
    () => (filter === 'All' ? tasks : tasks.filter((task) => task.status === filter)),
    [filter, tasks],
  );

  return (
    <main className="relative flex min-h-0 flex-1 flex-col bg-page">
      <Header
        overline={formatHeaderDate(new Date())}
        title="Today"
        trailing={
          <div className="text-right">
            <p className="font-display text-[9px] font-semibold tracking-wide text-muted-2">PENDING</p>
            <p className="font-display text-[22px] font-bold leading-none text-charcoal">{pendingCount}</p>
          </div>
        }
      />

      <div className="flex gap-[18px] overflow-x-auto px-6 pt-3.5" role="tablist" aria-label="Task filters">
        {TASK_FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={filter === item}
            onClick={() => setFilter(item)}
            className={`whitespace-nowrap bg-transparent pb-2.5 font-display text-[10px] font-semibold tracking-[0.07em] ${
              filter === item
                ? 'border-b-2 border-charcoal text-charcoal'
                : 'border-b-2 border-transparent text-muted-3'
            }`}
          >
            {item.toUpperCase()}
          </button>
        ))}
      </div>

      <TaskList
        tasks={filtered}
        onStatusChange={onStatusChange}
        onAddClick={() => setShowModal(true)}
      />

      <AddTaskSheet
        open={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={(task) => {
          onAddTask(task);
          setFilter('All');
          setShowModal(false);
        }}
      />
    </main>
  );
}
