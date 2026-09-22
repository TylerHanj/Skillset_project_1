import { Calendar, List, MessageSquareText, User } from 'lucide-react';
import type { NavTab } from '../types';

interface NavItem {
  id: NavTab;
  label: string;
  icon: typeof List;
}

interface BottomNavProps {
  activeTab: NavTab;
  onChange: (tab: NavTab) => void;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'TASKS', icon: List },
  { id: 'calendar', label: 'CALENDAR', icon: Calendar },
  { id: 'chat', label: 'AI', icon: MessageSquareText },
  { id: 'profile', label: 'PROFILE', icon: User },
];

export function BottomNav({ activeTab, onChange }: BottomNavProps) {
  return (
    <nav
      aria-label="Primary"
      className="grid h-tabbar shrink-0 grid-cols-4 border-t border-ui bg-page"
    >
      {NAV_ITEMS.map((item) => {
        const active = activeTab === item.id;
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            type="button"
            aria-current={active ? 'page' : undefined}
            onClick={() => onChange(item.id)}
            className="relative flex flex-col items-center justify-center gap-[3px] bg-transparent p-0"
          >
            {active ? (
              <span className="absolute left-1/2 top-0 h-0.5 w-7 -translate-x-1/2 bg-accent-red" />
            ) : null}
            <Icon
              size={17}
              strokeWidth={active ? 2.2 : 1.6}
              className={active ? 'text-charcoal' : 'text-muted-4'}
              aria-hidden
            />
            <span
              className={`font-display text-[8px] font-semibold tracking-[0.07em] ${
                active ? 'text-charcoal' : 'text-muted-3'
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
