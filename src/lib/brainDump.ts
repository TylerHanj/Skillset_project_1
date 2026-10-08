import { MONTHS_SHORT } from './calendar';
import { supabase } from './supabase';
import type { Task, TaskCategory } from '../types';

const DEFAULT_GEMINI_MODELS = ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.5-flash'];

interface ParsedTaskResponse {
  id?: unknown;
  title?: unknown;
  dueDate?: unknown;
  hasTime?: unknown;
  category?: unknown;
  isCompleted?: unknown;
  createdAt?: unknown;
}

function categoryOf(value: unknown): TaskCategory {
  return value === 'study' || value === 'personal' || value === 'general' ? value : 'general';
}

function toDateOnly(value: string | null): string | null {
  if (!value) return null;
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value);
  return match ? match[1] : null;
}

function displayDue(dueDate: string | null, hasTime: boolean): { due: string; dueTime: string } {
  const dateOnly = toDateOnly(dueDate);
  if (!dateOnly) return { due: 'No due date', dueTime: '' };

  const [year, month, day] = dateOnly.split('-').map(Number);
  let dueTime = '';
  if (hasTime && dueDate && dueDate.includes('T')) {
    const date = new Date(dueDate);
    if (!Number.isNaN(date.getTime())) {
      dueTime = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }
  }
  return {
    due: `${MONTHS_SHORT[month - 1]} ${day}, ${year}${dueTime ? ` · ${dueTime}` : ''}`,
    dueTime,
  };
}

function taskFromResponse(value: ParsedTaskResponse): Task | null {
  const title = typeof value.title === 'string' ? value.title.trim() : '';
  if (!title) return null;

  const rawDueDate = typeof value.dueDate === 'string' ? value.dueDate : null;
  const hasTime = Boolean(value.hasTime) && Boolean(toDateOnly(rawDueDate));
  const dueDate = rawDueDate ? (hasTime ? rawDueDate : toDateOnly(rawDueDate)) : null;
  const category = categoryOf(value.category);
  const { due, dueTime } = displayDue(rawDueDate ?? dueDate, hasTime);
  const createdAt =
    typeof value.createdAt === 'string' && !Number.isNaN(new Date(value.createdAt).getTime())
      ? value.createdAt
      : new Date().toISOString();

  return {
    id: typeof value.id === 'string' && value.id ? value.id : crypto.randomUUID(),
    title,
    dueDate,
    hasTime,
    category,
    isCompleted: Boolean(value.isCompleted),
    createdAt,
    subject: category.toUpperCase(),
    due,
    dueTime,
    status: Boolean(value.isCompleted) ? 'Done' : 'Todo',
    urgent: false,
    timeEst: '30m',
  };
}

function parseTaskList(value: unknown): Task[] {
  const rawTasks = Array.isArray(value) ? value : (value as { tasks?: unknown } | null)?.tasks;
  if (!Array.isArray(rawTasks)) throw new Error('The AI returned an invalid task list.');
  return rawTasks
    .map((item) => taskFromResponse(item as ParsedTaskResponse))
    .filter((task): task is Task => task !== null);
}

function cleanJson(text: string): string {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  const start = trimmed.indexOf('[');
  const end = trimmed.lastIndexOf(']');
  if (start < 0 || end < start) throw new Error('The AI response did not contain a JSON task list.');
  return trimmed.slice(start, end + 1);
}

async function parseWithGemini(userInput: string): Promise<Task[]> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('Brain Dump is unavailable: no Gemini API key is configured.');

  const configuredModels = import.meta.env.VITE_GEMINI_MODELS
    ?.split(',')
    .map((model: string) => model.trim())
    .filter(Boolean) ?? [];
  const models = [...new Set([...configuredModels, ...DEFAULT_GEMINI_MODELS])];
  const baseline = new Date().toISOString();
  const requestBody = JSON.stringify({
    system_instruction: {
      parts: [{
        text: [
          'You are a specialized task extraction parser for a minimalist study app.',
          `Use ${baseline} as the current date and time to resolve relative dates.`,
          'Split the input into discrete actionable tasks. Ignore conversational filler and non-actionable thoughts.',
          'Write short, clear, imperative titles in the same language as the input.',
          'Resolve relative dates to absolute ISO 8601 dates. Use null when no date is given.',
          'Use an ISO datetime and hasTime=true only when a specific time is mentioned; otherwise use YYYY-MM-DD and hasTime=false.',
          "Use only category values 'study', 'personal', or 'general'.",
          'Set isCompleted=false. Return a JSON array only, without markdown fences.',
        ].join('\n'),
      }],
    },
    contents: [{ role: 'user', parts: [{ text: userInput }] }],
    generationConfig: {
      temperature: 0.15,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            id: { type: 'STRING' },
            title: { type: 'STRING' },
            dueDate: { type: 'STRING', nullable: true },
            hasTime: { type: 'BOOLEAN' },
            category: { type: 'STRING', enum: ['study', 'personal', 'general'] },
            isCompleted: { type: 'BOOLEAN' },
            createdAt: { type: 'STRING' },
          },
          required: ['id', 'title', 'dueDate', 'hasTime', 'category', 'isCompleted', 'createdAt'],
        },
      },
    },
  });

  let lastModelError: Error | null = null;
  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      let response: Response;
      try {
        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
          body: requestBody,
        });
      } catch (error) {
        console.warn(`[brain-dump] Gemini network error for ${model}; ${attempt === 0 ? 'retrying' : 'trying another model'}.`, error);
        lastModelError = new Error(`Gemini request to ${model} failed because of a network error.`);
        if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 800));
        continue;
      }

      if (response.status === 404) {
        const detail = await response.text().catch(() => '');
        console.warn(`[brain-dump] Gemini model ${model} is unavailable; trying the next configured model.`, detail);
        lastModelError = new Error(`Gemini model ${model} was not found (404).`);
        break;
      }
      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        const transient = response.status === 429 || response.status >= 500;
        if (transient) {
          const retryAfter = Number(response.headers.get('retry-after'));
          const delayMs = Number.isFinite(retryAfter) && retryAfter > 0
            ? Math.min(retryAfter * 1000, 3000)
            : 800 * (attempt + 1);
          console.warn(
            `[brain-dump] Gemini returned ${response.status} for ${model}; ${attempt === 0 ? `retrying in ${delayMs}ms` : 'trying the next model'}.`,
            detail,
          );
          lastModelError = new Error(`Gemini request failed (${response.status}).`);
          if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }
        console.error('[brain-dump] Gemini request failed', response.status, detail);
        throw new Error(`Gemini request failed (${response.status}).`);
      }

      const payload = await response.json();
      const rawText = payload?.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text ?? '')
        .join('') ?? '';
      if (!rawText.trim()) throw new Error('Gemini returned an empty response.');
      const tasks = JSON.parse(cleanJson(rawText)) as unknown;
      return parseTaskList(tasks);
    }
  }

  throw lastModelError ?? new Error('No configured Gemini model is available.');
}

/**
 * Extracts structured tasks from free-form text through the server-side Supabase
 * Edge Function. The function owns the LLM key and resolves relative dates.
 */
export async function parseBrainDump(userInput: string): Promise<Task[]> {
  const input = userInput.trim();
  if (!input) return [];

  try {
    const { data, error } = await supabase.functions.invoke('parse-brain-dump', {
      body: { userInput: input },
    });
    if (error) {
      console.error('[brain-dump] Supabase Edge Function invocation failed', error);
      throw error;
    }
    return parseTaskList(data);
  } catch (edgeFunctionError) {
    console.error('[brain-dump] Falling back to the configured Gemini client', edgeFunctionError);
    try {
      return await parseWithGemini(input);
    } catch (fallbackError) {
      console.error('[brain-dump] Gemini fallback failed', fallbackError);
      if (fallbackError instanceof Error) throw fallbackError;
      throw new Error('Could not analyze your brain dump. Please try again.');
    }
  }
}
