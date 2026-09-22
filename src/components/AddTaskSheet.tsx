import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { DUE_TIMES, SUBJECTS, TIME_ESTIMATES } from '../mockData';
import { formatDueLabel, toIsoDate } from '../lib/calendar';
import type { NewTaskInput, TaskStatus } from '../types';
import { Chip } from './Chip';
import { MiniCalendar } from './MiniCalendar';
import { ToggleSwitch } from './ToggleSwitch';

interface FieldBlockProps {
  label: string;
  children: React.ReactNode;
}

function FieldBlock({ label, children }: FieldBlockProps) {
  return (
    <div>
      <p className="type-label mb-2">{label}</p>
      {children}
    </div>
  );
}

interface AddTaskSheetProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (task: NewTaskInput) => void;
}

export function AddTaskSheet({ open, onClose, onSubmit }: AddTaskSheetProps) {
  const now = new Date();
  const [subject, setSubject] = useState<string>(SUBJECTS[0]);
  const [customSubject, setCustomSubject] = useState('');
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<TaskStatus>('Todo');
  const [urgent, setUrgent] = useState(false);
  const [timeEst, setTimeEst] = useState('1h 00m');
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [calDay, setCalDay] = useState<number | null>(null);
  const [dueTime, setDueTime] = useState('');
  const [error, setError] = useState('');

  const isCustom = !SUBJECTS.includes(subject);

  useEffect(() => {
    if (!open) return undefined;

    function onKey(event: KeyboardEvent): void {
      if (event.key === 'Escape') onClose();
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  function reset(): void {
    setSubject(SUBJECTS[0]);
    setCustomSubject('');
    setTitle('');
    setStatus('Todo');
    setUrgent(false);
    setTimeEst('1h 00m');
    setCalDay(null);
    setDueTime('');
    setError('');
  }

  function handleClose(): void {
    reset();
    onClose();
  }

  function handleSubmit(): void {
    if (!title.trim()) {
      setError('Task title is required.');
      return;
    }
    if (calDay === null) {
      setError('Due date is required.');
      return;
    }

    const dueDate = toIsoDate(calYear, calMonth, calDay);
    onSubmit({
      subject: subject.trim().toUpperCase() || 'GENERAL',
      title: title.trim(),
      due: formatDueLabel(calYear, calMonth, calDay, dueTime),
      dueDate,
      dueTime,
      status,
      urgent,
      timeEst,
    });
    reset();
  }

  function prevMonth(): void {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((year) => year - 1);
    } else {
      setCalMonth((month) => month - 1);
    }
    setCalDay(null);
  }

  function nextMonth(): void {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((year) => year + 1);
    } else {
      setCalMonth((month) => month + 1);
    }
    setCalDay(null);
  }

  return (
    <div
      className="absolute inset-0 z-[100] flex flex-col justify-end bg-overlay"
      onClick={handleClose}
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-task-title"
        className="max-h-[88%] w-full overflow-y-auto border-t border-[#d0d0d0] bg-page shadow-sheet"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-row px-6 pb-3.5 pt-[18px]">
          <div>
            <p className="mb-[3px] font-display text-[9px] font-bold tracking-widest text-accent-red">
              NEW TASK
            </p>
            <h2 id="add-task-title" className="font-display text-lg font-bold tracking-tighter text-charcoal">
              Add Task
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={handleClose}
            className="flex h-[30px] w-[30px] items-center justify-center rounded-sm border-hairline border-muted-4"
          >
            <X size={12} className="text-slate" />
          </button>
        </header>

        <div className="flex flex-col gap-[18px] px-6 pb-8 pt-5">
          <FieldBlock label="SUBJECT">
            <div className="flex flex-wrap gap-1.5">
              {SUBJECTS.map((item) => (
                <Chip
                  key={item}
                  label={item}
                  selected={subject === item}
                  onClick={() => {
                    setSubject(item);
                    setCustomSubject('');
                  }}
                />
              ))}
              <Chip
                label="+ CUSTOM"
                variant="accent"
                selected={isCustom}
                onClick={() => setSubject(customSubject || '')}
              />
            </div>
            {isCustom ? (
              <input
                autoFocus
                type="text"
                value={customSubject}
                onChange={(event) => {
                  setCustomSubject(event.target.value);
                  setSubject(event.target.value.toUpperCase());
                }}
                placeholder="Enter subject name"
                className="mt-2 w-full rounded-sm border border-charcoal bg-page px-3 py-[9px] font-display text-xs font-semibold tracking-label text-charcoal outline-none"
              />
            ) : null}
          </FieldBlock>

          <FieldBlock label="TASK TITLE">
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Problem Set 5"
              className="w-full rounded-sm border border-border bg-transparent px-3 py-2.5 font-body text-[13px] text-charcoal outline-none"
            />
          </FieldBlock>

          <FieldBlock label="DUE DATE">
            <div
              className={`mb-2.5 rounded-sm border px-3 py-[9px] font-body text-[13px] ${
                calDay ? 'border-charcoal text-charcoal' : 'border-border text-muted-3'
              }`}
            >
              {calDay
                ? formatDueLabel(calYear, calMonth, calDay, dueTime)
                : 'Select a date below'}
            </div>

            <MiniCalendar
              year={calYear}
              month={calMonth}
              selectedDay={calDay}
              onPrevMonth={prevMonth}
              onNextMonth={nextMonth}
              onSelectDay={setCalDay}
            />

            <div className="mt-2.5">
              <p className="mb-1.5 font-display text-[9px] font-semibold tracking-wider text-muted-2">TIME</p>
              <div className="flex flex-wrap gap-[5px]">
                {DUE_TIMES.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setDueTime(time)}
                    className={`rounded-sm px-[9px] py-1 font-body text-[10px] ${
                      dueTime === time
                        ? 'border border-charcoal bg-charcoal text-white'
                        : 'border-hairline border-muted-4 bg-page text-slate'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          </FieldBlock>

          <FieldBlock label="STATUS">
            <div className="flex gap-2">
              {(['Todo', 'In Progress', 'Done'] as TaskStatus[]).map((item) => {
                const selected = status === item;
                let className = 'border-hairline border-border bg-page text-muted-2';
                if (selected && item === 'Done') {
                  className = 'border border-muted-4 bg-surface-3 text-charcoal';
                } else if (selected && item === 'In Progress') {
                  className = 'border border-blue-ink bg-blue-ink text-white';
                } else if (selected) {
                  className = 'border border-charcoal bg-charcoal text-white';
                }

                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setStatus(item)}
                    className={`rounded-sm px-3 py-[7px] font-display text-[9px] font-semibold tracking-wide ${className}`}
                  >
                    {item.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </FieldBlock>

          <FieldBlock label="TIME ESTIMATE">
            <div className="flex flex-wrap gap-1.5">
              {TIME_ESTIMATES.map((item) => (
                <Chip
                  key={item}
                  label={item}
                  variant="ink"
                  selected={timeEst === item}
                  onClick={() => setTimeEst(item)}
                />
              ))}
            </div>
          </FieldBlock>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-display text-[10px] font-semibold tracking-wider text-slate">URGENT</p>
              <p className="mt-0.5 text-[11px] text-muted-2">Mark with red priority dot</p>
            </div>
            <ToggleSwitch
              checked={urgent}
              onChange={() => setUrgent((value) => !value)}
              label="Urgent"
              accent="red"
            />
          </div>

          {error ? <p className="font-body text-[11px] text-accent-red">{error}</p> : null}

          <button
            type="button"
            onClick={handleSubmit}
            className="mt-1 w-full rounded-sm bg-accent-red py-3.5 font-display text-[11px] font-bold tracking-wider text-white"
          >
            ADD TASK
          </button>
        </div>
      </section>
    </div>
  );
}
