import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CalendarTaskRow } from '../components/CalendarTaskRow';
import { Header } from '../components/Header';
import { buildMonthGrid, MONTHS_LONG, toIsoDate, WEEKDAYS_SHORT } from '../lib/calendar';
import type { Task } from '../types';

interface CalendarScreenProps {
  tasks: Task[];
}

export function CalendarScreen({ tasks }: CalendarScreenProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());

  const grid = buildMonthGrid(year, month);
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;

  const tasksByDay = useMemo(() => {
    const map = new Map<number, Task[]>();
    tasks.forEach((task) => {
      if (!task.dueDate.startsWith(prefix)) return;
      const day = Number(task.dueDate.slice(8, 10));
      const list = map.get(day) ?? [];
      list.push(task);
      map.set(day, list);
    });
    return map;
  }, [prefix, tasks]);

  const selectedTasks = selectedDay ? (tasksByDay.get(selectedDay) ?? []) : [];
  const monthTasks = Array.from(tasksByDay.values()).flat();
  const dueThisWeek = monthTasks.filter((task) => {
    const day = Number(task.dueDate.slice(8, 10));
    return Math.abs(day - today.getDate()) <= 3;
  }).length;

  function prevMonth(): void {
    if (month === 0) {
      setMonth(11);
      setYear((value) => value - 1);
    } else {
      setMonth((value) => value - 1);
    }
    setSelectedDay(null);
  }

  function nextMonth(): void {
    if (month === 11) {
      setMonth(0);
      setYear((value) => value + 1);
    } else {
      setMonth((value) => value + 1);
    }
    setSelectedDay(null);
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col bg-page">
      <Header
        overline="ACADEMIC CALENDAR"
        title={`${MONTHS_LONG[month]} ${year}`}
        trailing={
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Previous month"
              onClick={prevMonth}
              className="flex h-[30px] w-[30px] items-center justify-center rounded-sm border-hairline border-muted-4"
            >
              <ChevronLeft size={14} className="text-slate" />
            </button>
            <button
              type="button"
              aria-label="Next month"
              onClick={nextMonth}
              className="flex h-[30px] w-[30px] items-center justify-center rounded-sm border-hairline border-muted-4"
            >
              <ChevronRight size={14} className="text-slate" />
            </button>
          </div>
        }
      />

      <section className="shrink-0 border-b border-ui px-5 pb-4 pt-3" aria-label="Month grid">
        <div className="mb-2 grid grid-cols-7">
          {WEEKDAYS_SHORT.map((day, index) => (
            <span
              key={`${day}-${index}`}
              className={`pb-1 text-center font-display text-[9px] font-semibold tracking-wider ${
                index >= 5 ? 'text-muted-4' : 'text-muted-2'
              }`}
            >
              {day}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {grid.map((day, index) => {
            const isToday =
              day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const isSelected = day === selectedDay;
            const hasTasks = day !== null && tasksByDay.has(day);
            const weekend = index % 7 >= 5;

            return (
              <div key={index} className="relative flex flex-col items-center px-0.5 pb-1.5 pt-[5px]">
                {day ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                      className={`relative flex h-[30px] w-[30px] items-center justify-center rounded-sm font-display text-[13px] ${
                        isSelected
                          ? 'bg-charcoal font-bold text-white'
                          : isToday
                            ? 'border border-accent-red bg-surface-2 font-bold text-accent-red'
                            : weekend
                              ? 'font-normal text-muted-4'
                              : 'font-normal text-ink'
                      }`}
                    >
                      {day}
                    </button>
                    {hasTasks ? (
                      <span
                        className={`mt-0.5 h-1 w-1 rounded-pill ${isSelected ? 'bg-transparent' : 'bg-accent-red'}`}
                      />
                    ) : null}
                  </>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      <section className="flex shrink-0 gap-5 border-b border-row px-6 py-2.5" aria-label="Month summary">
        {[
          { label: 'TOTAL TASKS', value: monthTasks.length },
          { label: 'DUE THIS WEEK', value: dueThisWeek },
          { label: 'COMPLETED', value: monthTasks.filter((task) => task.status === 'Done').length },
        ].map((stat) => (
          <div key={stat.label}>
            <p className="font-display text-[8px] font-semibold tracking-wider text-muted-2">{stat.label}</p>
            <p className="font-display text-lg font-bold leading-[1.2] text-charcoal">{stat.value}</p>
          </div>
        ))}
      </section>

      <section className="min-h-0 flex-1 overflow-y-auto">
        {selectedDay === null ? (
          <p className="px-6 py-10 text-center font-display text-[13px] text-muted-4">
            Select a day to view tasks
          </p>
        ) : selectedTasks.length === 0 ? (
          <p className="px-6 py-10 text-center font-display text-[13px] text-muted-4">
            No tasks on {MONTHS_LONG[month]} {selectedDay}
          </p>
        ) : (
          <div>
            <div className="border-b border-surface-2 px-6 pb-1.5 pt-3.5">
              <p className="font-display text-[9px] font-bold tracking-widest text-[#888888]">
                {MONTHS_LONG[month].toUpperCase()} {selectedDay} — {selectedTasks.length} TASK
                {selectedTasks.length === 1 ? '' : 'S'}
              </p>
            </div>
            {selectedTasks.map((task, index) => (
              <CalendarTaskRow key={task.id} task={task} last={index === selectedTasks.length - 1} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
