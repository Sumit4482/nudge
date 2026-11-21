/** Pull a JSON object out of a reply that may have extra words around it. */
export function parseSteps(text: string): string[] | null {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const obj = JSON.parse(m[0]) as { steps?: unknown };
    if (!Array.isArray(obj.steps)) return null;
    const steps = obj.steps.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).map((x) => x.trim().slice(0, 80));
    return steps.length >= 3 && steps.length <= 8 ? steps : null;
  } catch {
    return null;
  }
}
