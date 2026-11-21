import { cannedSteps } from '../planner/rules';
import type { Tag } from '../types';
import { parseSteps } from './parseSteps';
import { getSecret, SECRET } from './secrets';

const CLAUDE_MODEL = 'claude-haiku-5-5';
/** Free, no key, OpenAI-compatible. Limited to about 1 reply per 45 seconds per IP. */
const FREE_URL = 'https://text.pollinations.ai/openai';
const TIMEOUT_MS = 20000;

export interface BreakdownResult {
  steps: string[];
  /** True when an AI made the steps, false for the built-in sample. */
  fromAi: boolean;
  /** Why the sample was used, for a calm message. */
  note?: string;
}

const prompt = (title: string, mins: number) =>
  `Break this task into 4 to 6 small steps for someone who is procrastinating.\nTask: "${title}" (about ${mins} minutes).\n` +
  'Rules: each step takes 10 to 25 minutes, the first step takes 2 minutes or less, imperative voice, under 60 characters each.\n' +
  'Reply with JSON only, like {"steps": ["...", "..."]}.';

async function post(url: string, headers: Record<string, string>, body: unknown): Promise<Response> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body), signal: ctl.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function withClaude(key: string, title: string, mins: number): Promise<{ text?: string; status: number }> {
  const res = await post('https://api.anthropic.com/v1/messages', { 'x-api-key': key, 'anthropic-version': '2023-06-01' }, {
    model: CLAUDE_MODEL,
    max_tokens: 400,
    messages: [{ role: 'user', content: prompt(title, mins) }],
  });
  if (!res.ok) return { status: res.status };
  const json = (await res.json()) as { content?: { type: string; text?: string }[] };
  return { status: res.status, text: json.content?.find((c) => c.type === 'text')?.text ?? '' };
}

async function withFree(title: string, mins: number): Promise<{ text?: string; status: number }> {
  const res = await post(FREE_URL, {}, { model: 'openai', max_tokens: 400, messages: [{ role: 'user', content: prompt(title, mins) }] });
  if (!res.ok) return { status: res.status };
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return { status: res.status, text: json.choices?.[0]?.message?.content ?? '' };
}

/**
 * Break a task into 4 to 6 small steps. Uses your Claude key if you saved one, otherwise a free keyless AI.
 * Falls back to the built-in steps if anything fails. Only the task title and length leave the phone.
 */
export async function breakdown(title: string, mins: number, tag: Tag): Promise<BreakdownResult> {
  const sample = (note: string): BreakdownResult => ({ steps: cannedSteps(tag), fromAi: false, note });
  const key = await getSecret(SECRET.anthropic);
  try {
    const r = key ? await withClaude(key, title, mins) : await withFree(title, mins);
    if (r.text == null) {
      if (r.status === 401) return sample('Your Claude key was refused. Check it in Settings.');
      if (r.status === 402 || r.status === 429) return sample('The free AI is resting for a minute. Showing a sample.');
      return sample('The AI is not available right now. Showing a sample.');
    }
    const steps = parseSteps(r.text);
    return steps ? { steps, fromAi: true } : sample('The AI gave an unusable answer. Showing a sample.');
  } catch {
    return sample('No connection. Showing a sample.');
  }
}
