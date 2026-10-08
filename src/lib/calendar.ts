export const WEEKDAYS_SHORT: readonly string[] = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const MONTHS_SHORT: readonly string[] = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sept',
  'Oct',
  'Nov',
  'Dec',
];

export const MONTHS_LONG: readonly string[] = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

type AppLanguage = 'en' | 'ru';

function localeFor(language: AppLanguage): string {
  return language === 'ru' ? 'ru-RU' : 'en-US';
}

export function formatMonthName(year: number, month: number, language: AppLanguage, style: 'short' | 'long' = 'long'): string {
  return new Intl.DateTimeFormat(localeFor(language), { month: style, year: 'numeric' }).format(new Date(year, month, 1));
}

export function formatWeekdays(language: AppLanguage): string[] {
  const monday = new Date(2024, 0, 1);
  return Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat(localeFor(language), { weekday: 'narrow' }).format(new Date(2024, 0, monday.getDate() + index)),
  );
}

export function formatTimeValue(hour: number, minute: number, language: AppLanguage): string {
  return new Intl.DateTimeFormat(localeFor(language), {
    hour: 'numeric',
    minute: '2-digit',
    hour12: language === 'en',
  }).format(new Date(2024, 0, 1, hour, minute));
}

export function formatDuration(value: string, language: AppLanguage): string {
  if (language === 'en') return value;
  const match = /^(?:(\d+)h\s*)?(?:(\d+)m)?$/.exec(value);
  if (!match) return value;
  const [, hours, minutes] = match;
  return [hours ? `${hours} ч` : '', minutes ? `${minutes} мин` : ''].filter(Boolean).join(' ');
}

export function buildMonthGrid(year: number, month: number): Array<number | null> {
  const firstDay = new Date(year, month, 1).getDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<number | null> = [];

  for (let i = 0; i < startOffset; i += 1) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(day);
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

export function toIsoDate(year: number, month: number, day: number): string {
  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

export function formatDueLabel(year: number, month: number, day: number, time: string, language: AppLanguage = 'en'): string {
  const date = new Intl.DateTimeFormat(localeFor(language), { month: 'short', day: 'numeric', year: 'numeric' })
    .format(new Date(year, month, day));
  return `${date}${time ? ` · ${time}` : ''}`;
}

export function formatHeaderDate(date: Date, language: AppLanguage = 'en'): string {
  return date
    .toLocaleDateString(localeFor(language), {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    })
    .toUpperCase();
}

export function formatClock(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}
