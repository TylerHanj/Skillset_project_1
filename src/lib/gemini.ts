import { QUICK_PROMPTS } from '../mockData';
import type { ChatMessage, Task } from '../types';
import { localReply, type Lang } from './localReply';

/*
 * Клиент Gemini с двумя гарантиями:
 *  1) Пользователь ВСЕГДА получает ответ: при перегрузке/квоте/сети/отсутствии ключа
 *     после ограниченного числа попыток отвечает локальный fallback (localReply).
 *  2) Минимум лишних запросов: кэш, дедупликация, лимит попыток, паузы по Retry-After,
 *     «карантин» для упавших/исчерпанных моделей, отключение при неверном ключе.
 */

export interface AskParams {
  question: string;
  history: ChatMessage[];
  tasks: Task[];
  userName: string;
  language: Lang;
  signal?: AbortSignal;
}

export interface AskResult {
  text: string;
  source: 'gemini' | 'cache' | 'local';
  model?: string;
}

export interface GeminiConfig {
  apiKey?: string;
  models: string[];
  fetchFn?: typeof fetch;
  sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
  now?: () => number;
  storage?: Pick<Storage, 'getItem' | 'setItem'> | null;
  online?: () => boolean;
}

// ---- Лимиты (всё ограничено, чтобы не сжигать квоту) ----
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const REQUEST_TIMEOUT_MS = 10_000;
const TOTAL_BUDGET_MS = 25_000; // после этого — гарантированный локальный ответ
const MAX_ATTEMPTS_PER_MODEL = 2; // 1 повтор для временных сбоев
const MAX_REQUESTS_PER_QUESTION = 4; // жёсткий потолок на один вопрос
const SHORT_WAIT_MS = 8_000; // дольше ждать по 429 не будем — переключимся на другую модель
const DAILY_QUOTA_COOLDOWN_MS = 3 * 60 * 60 * 1000;
const DEAD_MODEL_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const BAD_REQUEST_COOLDOWN_MS = 10 * 60 * 1000;
const OVERLOAD_COOLDOWN_MS = 30_000;
const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX = 50;
const HISTORY_MESSAGES = 6;
const HISTORY_CHARS = 500;
const QUESTION_CHARS = 2000;
const MAX_TASKS_IN_PROMPT = 15;
const COOLDOWN_STORAGE_KEY = 'skillset-gemini-cooldowns';
const DISABLED_STORAGE_KEY = 'skillset-gemini-disabled';

// Первая модель — самая «дешёвая» по квоте (у Flash-Lite на бесплатном тарифе лимит запросов в сутки выше).
const DEFAULT_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
];

// ---- Классификация ответа API ----
type Outcome =
  | { kind: 'ok'; text: string }
  | { kind: 'fatal' } // ключ/регион/права — повторять бессмысленно
  | { kind: 'blocked' } // фильтр безопасности — другие модели ответят так же
  | { kind: 'dead' } // модели не существует
  | { kind: 'skip' } // странный 400/пустой ответ — пробуем другую модель
  | { kind: 'retry' } // 5xx / сеть / таймаут
  | { kind: 'rate'; daily: boolean; waitMs: number };

interface ErrorBody {
  error?: {
    status?: string;
    message?: string;
    details?: Array<Record<string, unknown>>;
  };
}

function parseDelayMs(value: unknown): number | undefined {
  if (typeof value !== 'string') return undefined;
  const match = /^([\d.]+)s$/.exec(value.trim());
  return match ? Math.ceil(Number(match[1]) * 1000) : undefined;
}

async function classifyError(res: Response): Promise<Outcome> {
  let body: ErrorBody = {};
  try {
    body = (await res.json()) as ErrorBody;
  } catch {
    /* тело не JSON — не страшно */
  }
  const err = body.error ?? {};
  const message = err.message ?? '';
  const details = Array.isArray(err.details) ? err.details : [];
  const detailsText = JSON.stringify(details);

  if (res.status === 401 || res.status === 403) return { kind: 'fatal' };
  if (res.status === 400) {
    const keyOrRegion =
      err.status === 'FAILED_PRECONDITION' ||
      /API_KEY_INVALID|API key not valid|API key expired|location is not supported|billing/i.test(
        `${message} ${detailsText}`,
      );
    return keyOrRegion ? { kind: 'fatal' } : { kind: 'skip' };
  }
  if (res.status === 404) return { kind: 'dead' };
  if (res.status === 429) {
    const daily = /PerDay/i.test(detailsText) || /per day|daily/i.test(message);
    const fromBody = details.map((d) => parseDelayMs(d.retryDelay)).find((v) => v !== undefined);
    const header = Number(res.headers.get('retry-after'));
    const waitMs = fromBody ?? (Number.isFinite(header) && header > 0 ? header * 1000 : 20_000);
    return { kind: 'rate', daily, waitMs };
  }
  if (res.status >= 500 || res.status === 408) return { kind: 'retry' };
  return { kind: 'skip' };
}

// ---- Формирование запроса (экономим токены) ----
function clip(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function buildSystemPrompt(p: AskParams, today: string): string {
  const open = p.tasks
    .filter((task) => task.status !== 'Done')
    .sort((a, b) => `${a.dueDate} ${a.dueTime}`.localeCompare(`${b.dueDate} ${b.dueTime}`))
    .slice(0, MAX_TASKS_IN_PROMPT)
    .map(
      (task) =>
        `- [${task.subject}] ${clip(task.title, 80)} | due ${task.dueDate} ${task.dueTime}` +
        `${task.urgent ? ' | URGENT' : ''} | ${task.status} | est ${task.timeEst}`,
    );
  return [
    'You are Study AI, a concise study assistant inside a student planner app.',
    `Reply in ${p.language === 'ru' ? 'Russian' : 'English'}.`,
    'Output plain text only: no markdown, no asterisks, no headings, no tables (the UI shows raw text). Use short paragraphs or "•" lines.',
    'Keep answers practical and under about 150 words unless the student asks for more detail.',
    "Use the student's tasks when relevant. Never invent tasks or deadlines.",
    `Today: ${today}. Student: ${p.userName}.`,
    open.length > 0 ? `Open tasks:\n${open.join('\n')}` : 'The student has no open tasks.',
  ].join('\n');
}

interface Content {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

function buildContents(history: ChatMessage[], question: string): Content[] {
  const turns: Content[] = [];
  const push = (role: 'user' | 'model', text: string): void => {
    const last = turns[turns.length - 1];
    if (last && last.role === role) last.parts[0].text += `\n${text}`; // Gemini любит чередование ролей
    else turns.push({ role, parts: [{ text }] });
  };
  for (const m of history.slice(-HISTORY_MESSAGES)) {
    if (!m.text.trim()) continue;
    // Диалог должен начинаться с пользователя.
    if (turns.length === 0 && m.role === 'ai') continue;
    push(m.role === 'ai' ? 'model' : 'user', clip(m.text, HISTORY_CHARS));
  }
  push('user', clip(question, QUESTION_CHARS));
  return turns;
}

function extractText(data: unknown): Outcome {
  const d = data as {
    promptFeedback?: { blockReason?: string };
    candidates?: Array<{
      finishReason?: string;
      content?: { parts?: Array<{ text?: string; thought?: boolean }> };
    }>;
  };
  if (d?.promptFeedback?.blockReason) return { kind: 'blocked' };
  const candidate = d?.candidates?.[0];
  const text = (candidate?.content?.parts ?? [])
    .filter((part) => !part.thought && typeof part.text === 'string')
    .map((part) => part.text as string)
    .join('')
    .trim();
  if (text) return { kind: 'ok', text };
  if (candidate?.finishReason === 'SAFETY' || candidate?.finishReason === 'PROHIBITED_CONTENT') {
    return { kind: 'blocked' };
  }
  return { kind: 'skip' };
}

// ---- Утилиты ----
function abortError(): Error {
  return new DOMException('Aborted', 'AbortError');
}

function defaultSleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(abortError());
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = (): void => {
      clearTimeout(timer);
      reject(abortError());
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

function hash(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i += 1) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

function safeStorage(): Pick<Storage, 'getItem' | 'setItem'> | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

// ---- Фабрика (ради тестируемости) ----
export function createGeminiAsker(config: GeminiConfig) {
  const fetchFn = config.fetchFn ?? ((...args: Parameters<typeof fetch>) => fetch(...args));
  const sleep = config.sleep ?? defaultSleep;
  const now = config.now ?? Date.now;
  const storage = config.storage === undefined ? safeStorage() : config.storage;
  const online = config.online ?? (() => typeof navigator === 'undefined' || navigator.onLine !== false);
  const apiKey = config.apiKey?.trim();
  const models = config.models.filter(Boolean);

  const cache = new Map<string, { text: string; model: string; at: number }>();
  const inflight = new Map<string, Promise<AskResult>>();
  let disabled = false; // неверный ключ / регион: до перезагрузки больше не стучимся

  // Карантин моделей хранится в localStorage, чтобы перезагрузка страницы не «забывала» исчерпанную квоту.
  function readCooldowns(): Record<string, number> {
    try {
      return JSON.parse(storage?.getItem(COOLDOWN_STORAGE_KEY) ?? '{}') as Record<string, number>;
    } catch {
      return {};
    }
  }
  const memoryCooldowns: Record<string, number> = readCooldowns();
  function setCooldown(model: string, ms: number): void {
    memoryCooldowns[model] = now() + ms;
    try {
      storage?.setItem(COOLDOWN_STORAGE_KEY, JSON.stringify(memoryCooldowns));
    } catch {
      /* квота хранилища — не критично */
    }
  }
  function isCoolingDown(model: string): boolean {
    return (memoryCooldowns[model] ?? 0) > now();
  }

  try {
    if (storage?.getItem(DISABLED_STORAGE_KEY) === hash(apiKey ?? '')) disabled = true;
  } catch {
    /* ignore */
  }
  function disableForGood(): void {
    disabled = true;
    try {
      storage?.setItem(DISABLED_STORAGE_KEY, hash(apiKey ?? ''));
    } catch {
      /* ignore */
    }
  }

  async function callOnce(
    model: string,
    body: string,
    signal: AbortSignal | undefined,
    timeoutMs: number,
  ): Promise<Outcome> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const onAbort = (): void => controller.abort();
    signal?.addEventListener('abort', onAbort, { once: true });
    try {
      const res = await fetchFn(`${API_BASE}/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey as string },
        body,
        signal: controller.signal,
      });
      if (!res.ok) return await classifyError(res);
      return extractText(await res.json());
    } catch {
      if (signal?.aborted) throw abortError(); // отмена пользователем — не ошибка сервера
      return { kind: 'retry' }; // таймаут или обрыв сети
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    }
  }

  async function runGemini(p: AskParams): Promise<{ text: string; model: string } | null> {
    const deadline = now() + TOTAL_BUDGET_MS;
    const today = new Date(now()).toISOString().slice(0, 10);
    const quick = (QUICK_PROMPTS as readonly string[]).includes(p.question);
    const body = JSON.stringify({
      system_instruction: { parts: [{ text: buildSystemPrompt(p, today) }] },
      // Быстрые подсказки самодостаточны — историю не шлём, экономим токены.
      contents: buildContents(quick ? [] : p.history, p.question),
      generationConfig: { maxOutputTokens: 1024, temperature: 0.6 },
    });

    let requests = 0;
    for (const model of models) {
      if (isCoolingDown(model)) continue;
      let attempt = 0;
      while (attempt < MAX_ATTEMPTS_PER_MODEL) {
        const remaining = deadline - now();
        if (requests >= MAX_REQUESTS_PER_QUESTION || remaining <= 1000) return null;
        attempt += 1;
        requests += 1;

        const out = await callOnce(model, body, p.signal, Math.min(REQUEST_TIMEOUT_MS, remaining));
        if (out.kind === 'ok') return { text: out.text, model };
        if (out.kind === 'fatal') {
          disableForGood();
          return null;
        }
        if (out.kind === 'blocked') return null;

        let waitMs = 0;
        if (out.kind === 'retry') {
          if (attempt < MAX_ATTEMPTS_PER_MODEL) waitMs = 1000 * 2 ** (attempt - 1) + Math.random() * 400;
          else setCooldown(model, OVERLOAD_COOLDOWN_MS);
        } else if (out.kind === 'rate') {
          if (!out.daily && out.waitMs <= SHORT_WAIT_MS && attempt < MAX_ATTEMPTS_PER_MODEL) {
            waitMs = out.waitMs + 250; // сервер сам сказал, когда можно повторить
          } else {
            setCooldown(model, out.daily ? DAILY_QUOTA_COOLDOWN_MS : Math.min(out.waitMs, 120_000));
          }
        } else if (out.kind === 'dead') {
          setCooldown(model, DEAD_MODEL_COOLDOWN_MS);
        } else {
          setCooldown(model, BAD_REQUEST_COOLDOWN_MS);
        }

        if (waitMs === 0) break; // следующая модель
        if (now() + waitMs >= deadline) return null;
        await sleep(waitMs, p.signal);
      }
    }
    return null;
  }

  function cacheKey(p: AskParams): string | null {
    const question = p.question.trim().toLowerCase().replace(/\s+/g, ' ');
    const standalone = (QUICK_PROMPTS as readonly string[]).includes(p.question) || question.length >= 20;
    if (!standalone) return null; // короткие реплики вроде «а почему?» зависят от контекста
    const tasksSig = p.tasks.map((task) => `${task.id}:${task.status}`).join(',');
    return `${p.language}|${question}|${hash(tasksSig)}`;
  }

  async function ask(p: AskParams): Promise<AskResult> {
    const local = (): AskResult => ({
      text: localReply(p.question, p.tasks, p.language, p.userName),
      source: 'local',
    });
    if (p.signal?.aborted) throw abortError();
    if (!apiKey || models.length === 0 || disabled || !online()) return local();

    const key = cacheKey(p);
    if (key) {
      const hit = cache.get(key);
      if (hit && now() - hit.at < CACHE_TTL_MS) return { text: hit.text, source: 'cache', model: hit.model };
      const pending = inflight.get(key);
      if (pending) return pending;
    }

    const job = (async (): Promise<AskResult> => {
      const result = await runGemini(p);
      if (!result) return local();
      if (key) {
        if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value as string);
        cache.set(key, { ...result, at: now() });
      }
      return { text: result.text, source: 'gemini', model: result.model };
    })();

    if (key) {
      inflight.set(key, job);
      job.then(
        () => inflight.delete(key),
        () => inflight.delete(key),
      );
    }
    return job;
  }

  return { ask };
}

// ---- Экземпляр приложения ----
const env = import.meta.env;
const envModels = env?.VITE_GEMINI_MODELS?.split(',').map((m: string) => m.trim());

const defaultAsker = createGeminiAsker({
  apiKey: env?.VITE_GEMINI_API_KEY,
  models: envModels && envModels.length > 0 ? envModels : DEFAULT_MODELS,
});

/** Никогда не бросает исключений, кроме AbortError при отмене; всегда возвращает текст ответа. */
export function askGemini(params: AskParams): Promise<AskResult> {
  return defaultAsker.ask(params);
}
