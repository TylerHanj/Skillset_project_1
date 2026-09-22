import { useState } from 'react';
import { Header } from '../components/Header';
import { KpiCard } from '../components/KpiCard';
import { ToggleSwitch } from '../components/ToggleSwitch';
import { COURSES, KPIS, STUDENT_PROFILE } from '../mockData';
import type { ProfileSection, SettingItem } from '../types';

interface ProfileScreenProps {
  settings: SettingItem[];
  onToggleSetting: (id: string) => void;
}

export function ProfileScreen({ settings, onToggleSetting }: ProfileScreenProps) {
  const [section, setSection] = useState<ProfileSection>('kpis');
  const initials = `${STUDENT_PROFILE.firstName[0]}${STUDENT_PROFILE.lastName[0]}`;

  return (
    <main className="flex h-full flex-col overflow-y-auto bg-page">
      <Header
        overline="STUDENT PROFILE"
        title={`${STUDENT_PROFILE.firstName} ${STUDENT_PROFILE.lastName}`}
        subtitle={`${STUDENT_PROFILE.year} · ${STUDENT_PROFILE.major} · ${STUDENT_PROFILE.institution}`}
        trailing={
          <div className="flex h-[52px] w-[52px] items-center justify-center rounded-sm border border-charcoal bg-charcoal">
            <span className="font-display text-lg font-extrabold text-white">{initials}</span>
          </div>
        }
      />

      <div className="grid shrink-0 grid-cols-2 border-b border-ui" role="tablist" aria-label="Profile sections">
        {([
          { id: 'kpis', label: 'PERFORMANCE' },
          { id: 'courses', label: 'COURSES' },
        ] as const).map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={section === item.id}
            onClick={() => setSection(item.id)}
            className={`bg-transparent py-3.5 font-display text-[10px] font-semibold tracking-wider ${
              section === item.id
                ? 'border-b-2 border-charcoal text-charcoal'
                : 'border-b-2 border-transparent text-muted-2'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {section === 'kpis' ? (
        <section className="grid shrink-0 grid-cols-2 gap-3 px-6 py-5" aria-label="Performance">
          {KPIS.map((kpi) => (
            <KpiCard key={kpi.label} kpi={kpi} />
          ))}
        </section>
      ) : (
        <section className="shrink-0 px-6" aria-label="Courses">
          {COURSES.map((course, index) => (
            <article
              key={course.code}
              className={`flex items-center justify-between py-4 ${
                index < COURSES.length - 1 ? 'border-b border-row' : ''
              }`}
            >
              <div>
                <p className="mb-[3px] font-display text-[9px] font-bold tracking-widest text-[#888888]">
                  {course.code}
                </p>
                <p className="font-display text-sm font-semibold text-charcoal">{course.name}</p>
                <p className="mt-0.5 text-[11px] text-muted-2">
                  {course.tasks} task{course.tasks === 1 ? '' : 's'} open
                </p>
              </div>
              <div className="rounded-sm border border-charcoal px-3 py-[5px]">
                <span className="font-display text-sm font-bold text-charcoal">{course.grade}</span>
              </div>
            </article>
          ))}
        </section>
      )}

      <div className="h-2 shrink-0 border-y border-row bg-surface-2" />

      <section className="shrink-0 px-6" aria-label="Settings">
        <p className="type-label pb-2 pt-4">SETTINGS</p>
        {settings.map((item, index) => (
          <div
            key={item.id}
            className={`flex items-center justify-between py-3.5 ${
              index < settings.length - 1 ? 'border-b border-surface-3' : ''
            }`}
          >
            <span
              className={`font-body text-[13px] ${
                item.danger ? 'font-medium text-accent-red' : 'font-normal text-ink'
              }`}
            >
              {item.label}
            </span>
            {item.toggle ? (
              <ToggleSwitch
                checked={Boolean(item.on)}
                onChange={() => onToggleSetting(item.id)}
                label={item.label}
              />
            ) : (
              <span className="font-body text-xs text-muted-2">{item.value}</span>
            )}
          </div>
        ))}
      </section>
      <div className="h-6" />
    </main>
  );
}
