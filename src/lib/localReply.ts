import type { Task } from '../types';

export type Lang = 'en' | 'ru';

function byDue(a: Task, b: Task): number {
  return `${a.dueDate} ${a.dueTime}`.localeCompare(`${b.dueDate} ${b.dueTime}`);
}

/**
 * Ответ без ИИ: строится только из задач пользователя, не делает ни одного запроса.
 * Используется как последняя страховка, когда Gemini недоступен (перегрузка, квота, нет сети, нет ключа).
 */
export function localReply(question: string, tasks: Task[], lang: Lang, name: string): string {
  const ru = lang === 'ru';
  const q = question.toLowerCase();
  const open = tasks.filter((task) => task.status !== 'Done').sort(byDue);
  const urgent = open.filter((task) => task.urgent);
  const line = (task: Task): string => `• ${task.subject} — ${task.title} (${task.due})`;
  const list = (items: Task[], limit: number): string => items.slice(0, limit).map(line).join('\n');

  let body: string;

  if (open.length === 0) {
    body = ru
      ? `${name}, открытых задач сейчас нет. Хороший момент повторить пройденное или добавить новые дела.`
      : `${name}, you have no open tasks right now. A good moment to review what you've covered or add new ones.`;
  } else if (/priorit|приорит|срочн|urgent|важн/.test(q)) {
    const first = urgent.length > 0 ? urgent : open;
    body = ru
      ? `Начните с этого:\n${list(first, 3)}\n\nВыделите 90 минут на первую задачу, затем просмотрите остальные дедлайны вечером.`
      : `Start with this:\n${list(first, 3)}\n\nBlock 90 minutes for the first item, then review the remaining deadlines tonight.`;
  } else if (/explain|объясни|quiz|проверь|тест|экзамен/.test(q)) {
    body = ru
      ? `Для объяснений и тестов нужен ИИ, а он сейчас недоступен — попробуйте ещё раз чуть позже. Пока вот ближайшие дела:\n${list(open, 3)}`
      : `Explanations and quizzes need the AI, which is unavailable right now — please try again a bit later. Meanwhile, here is what's next:\n${list(open, 3)}`;
  } else {
    const inProgress = open.filter((task) => task.status === 'In Progress').length;
    body = ru
      ? `Открытых задач: ${open.length}${urgent.length ? `, срочных: ${urgent.length}` : ''}${inProgress ? `, в процессе: ${inProgress}` : ''}.\nБлижайшие дедлайны:\n${list(open, 3)}`
      : `Open tasks: ${open.length}${urgent.length ? `, urgent: ${urgent.length}` : ''}${inProgress ? `, in progress: ${inProgress}` : ''}.\nNext deadlines:\n${list(open, 3)}`;
  }

  const footer = ru
    ? '\n\n— Офлайн-режим: ИИ сейчас недоступен, ответ составлен по вашим задачам.'
    : '\n\n— Offline mode: the AI is unavailable right now; this reply is based on your tasks.';

  return body + footer;
}
