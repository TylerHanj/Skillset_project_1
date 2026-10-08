import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const taskSchema = {
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
};

serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: corsHeaders });
  }

  try {
    const { userInput } = await request.json() as { userInput?: unknown };
    if (typeof userInput !== 'string' || !userInput.trim()) {
      return Response.json({ error: 'userInput is required' }, { status: 400, headers: corsHeaders });
    }
    if (userInput.length > 6_000) {
      return Response.json({ error: 'Please keep your brain dump under 6,000 characters.' }, { status: 400, headers: corsHeaders });
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) throw new Error('The parser is not configured.');

    const baseline = new Date().toISOString();
    const prompt = [
      'You are a specialized task extraction parser for a minimalist study app.',
      `Baseline time for resolving relative dates is ${baseline}.`,
      'Split the input into discrete, actionable tasks and ignore conversational filler or non-actionable thoughts.',
      'Write short, clear, imperative titles in the same language as the input.',
      'Resolve relative dates such as tomorrow, this Friday, and next week to absolute ISO 8601 dates using the baseline.',
      'If a specific time is mentioned, return dueDate as an ISO datetime and hasTime=true. Otherwise return YYYY-MM-DD when a date is known and hasTime=false. Use null if no date is stated.',
      "Use only these categories: 'study', 'personal', 'general'.",
      'Every extracted task must be incomplete (isCompleted=false). Generate an id and use the baseline as createdAt.',
      'Return JSON only, matching the provided schema with no markdown.',
    ].join('\n');

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: prompt }] },
          contents: [{ role: 'user', parts: [{ text: userInput.trim() }] }],
          generationConfig: {
            temperature: 0.15,
            responseMimeType: 'application/json',
            responseSchema: { type: 'ARRAY', items: taskSchema },
          },
        }),
      },
    );
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      console.error('Gemini API request failed', response.status, detail);
      throw new Error(`LLM request failed (${response.status})`);
    }

    const payload = await response.json();
    const text = payload?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text ?? '')
      .join('')
      .trim() ?? '';
    if (!text) throw new Error('Gemini returned an empty response.');
    const cleanedText = text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();
    const arrayStart = cleanedText.indexOf('[');
    const arrayEnd = cleanedText.lastIndexOf(']');
    if (arrayStart < 0 || arrayEnd < arrayStart) throw new Error('Gemini response did not contain a JSON task array.');
    const rawTasks = JSON.parse(cleanedText.slice(arrayStart, arrayEnd + 1));
    if (!Array.isArray(rawTasks)) throw new Error('LLM response was not a task array.');
    // Do not let a model choose metadata that belongs to this request.
    const tasks = rawTasks.map((task: Record<string, unknown>) => ({
      ...task,
      id: crypto.randomUUID(),
      isCompleted: false,
      createdAt: baseline,
    }));
    return Response.json({ tasks }, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('parse-brain-dump failed', error);
    return Response.json(
      { error: 'Unable to parse the brain dump right now.' },
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
